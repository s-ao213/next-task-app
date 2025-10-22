import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, tokenManager } from '../supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ユーザーインターフェースに出席番号を追加
export interface User {
  id: string;
  email: string;
  name: string;
  studentId?: string;
}

// ローカルストレージのキー
const STUDENT_ID_KEY = 'next-task-app-student-id';

// ユーザー情報をデータベースに保存・更新する関数
const storeUserInDatabase = async (user: SupabaseUser, studentId?: string) => {
  if (!user) return { error: { message: 'ユーザー情報がありません' } };
  
  try {
    if (!studentId || studentId.trim() === '') {
      return { error: { message: '出席番号は必須です' } };
    }
    
    const normalizedStudentId = studentId.trim();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, student_id')
      .eq('id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user:', error);
      return { error };
    }
    
    const userData: { 
      id: string;
      email: string | undefined;
      name: string;
      student_id: string;
      updated_at: string;
      created_at?: string;
    } = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email || '',
      student_id: normalizedStudentId,
      updated_at: new Date().toISOString()
    };

    if (!data) {
      userData.created_at = new Date().toISOString();
    }
    
    const { error: upsertError } = await supabase
      .from('users')
      .upsert(userData);
    
    if (upsertError) {
      console.error('Error updating user:', upsertError);
      return { error: upsertError };
    }
    
    return { data: userData };
  } catch (error) {
    console.error('Error storing user data:', error);
    return { error: { message: error instanceof Error ? error.message : 'Unknown error occurred' } };
  }
};

// 出席番号の一意性を確認する関数
const checkStudentIdUnique = async (studentId: string, excludeUserId?: string) => {
  try {
    let query = supabase
      .from('users')
      .select('id')
      .eq('student_id', studentId);
    
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking student ID:', error);
      return { isUnique: false, error };
    }
    
    return { isUnique: !data || data.length === 0 };
  } catch (error) {
    console.error('Error checking student ID uniqueness:', error);
    return { isUnique: false, error };
  }
};

// SupabaseのUser型を独自のUser型に変換する関数
const mapSupabaseUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('student_id')
      .eq('id', supabaseUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user data:', error);
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
      studentId: data?.student_id || '' 
    };
  } catch (error) {
    console.error('Error mapping user:', error);
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
      studentId: ''
    };
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // トークンをチェックして必要なら更新
  const checkAndRefreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const isExpiring = await tokenManager.isTokenExpiringSoon();
      
      if (isExpiring) {
        const remaining = await tokenManager.getTokenRemainingMinutes();
        console.log(`トークンの有効期限まで残り ${remaining} 分。更新します...`);
        
        const session = await tokenManager.refreshToken();
        
        if (session?.user) {
          const mappedUser = await mapSupabaseUser(session.user);
          setUser(mappedUser);
          console.log('トークン更新成功');
          return true;
        } else {
          console.error('トークン更新失敗: ユーザー情報が取得できません');
          tokenManager.clearTokens();
          setUser(null);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('トークンチェック中のエラー:', error);
      return false;
    }
  }, []);

  // 初期化とトークン監視
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        console.log('認証を初期化中...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            const mappedUser = await mapSupabaseUser(session.user);
            setUser(mappedUser);
            
            const remaining = await tokenManager.getTokenRemainingMinutes();
            console.log(`現在のトークン有効期限まで残り ${remaining} 分`);
          } else {
            console.log('有効なトークンが見つかりません');
            setUser(null);
          }
          setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            console.log('認証イベント:', event);

            switch (event) {
              case 'SIGNED_IN':
                if (session?.user) {
                  const mappedUser = await mapSupabaseUser(session.user);
                  setUser(mappedUser);
                  console.log('サインイン成功');
                }
                break;
                
              case 'TOKEN_REFRESHED':
                if (session?.user) {
                  const mappedUser = await mapSupabaseUser(session.user);
                  setUser(mappedUser);
                  const remaining = await tokenManager.getTokenRemainingMinutes();
                  console.log(`トークンが更新されました。有効期限まで残り ${remaining} 分`);
                }
                break;
                
              case 'SIGNED_OUT':
                tokenManager.clearTokens();
                setUser(null);
                console.log('サインアウトしました');
                break;
                
              case 'USER_UPDATED':
                if (session?.user) {
                  const mappedUser = await mapSupabaseUser(session.user);
                  setUser(mappedUser);
                }
                break;
            }
          }
        );

        checkIntervalRef.current = setInterval(async () => {
          const remaining = await tokenManager.getTokenRemainingMinutes();
          console.log(`トークンチェック: 残り ${remaining} 分`);
          await checkAndRefreshToken();
        }, 2 * 60 * 1000);

        refreshIntervalRef.current = setInterval(async () => {
          console.log('定期的なトークン更新を実行...');
          await tokenManager.refreshToken();
        }, 45 * 60 * 1000);

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('認証初期化エラー:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkAndRefreshToken]);

  // ページの可視性監視
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('ページが表示されました。トークンをチェックします...');
        const remaining = await tokenManager.getTokenRemainingMinutes();
        console.log(`トークン残り時間: ${remaining} 分`);
        await checkAndRefreshToken();
      }
    };

    const handleFocus = async () => {
      console.log('ウィンドウにフォーカスが戻りました。トークンをチェックします...');
      await checkAndRefreshToken();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAndRefreshToken]);

  // サインアップ
  const signUp = async (email: string, password: string, studentId: string) => {
    setLoading(true);
    try {
      if (!studentId || studentId.trim() === '') {
        return { 
          error: { message: '出席番号は必須です。入力してください。' },
          user: null 
        };
      }
      
      const normalizedStudentId = studentId.trim();
      
      const { isUnique, error: checkError } = await checkStudentIdUnique(normalizedStudentId);
      
      if (checkError) {
        return { 
          error: { message: '出席番号の確認中にエラーが発生しました。' },
          user: null 
        };
      }
      
      if (!isUnique) {
        return { 
          error: { message: 'この出席番号は既に使用されています。' },
          user: null 
        };
      }
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            student_id: normalizedStudentId
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        const storeResult = await storeUserInDatabase(data.user, normalizedStudentId);
        
        if (storeResult?.error) {
          console.error('ユーザー情報の保存に失敗:', storeResult.error);
          return { 
            error: { message: `アカウントは作成されましたが、出席番号の保存に失敗しました: ${storeResult.error.message}` },
            user: null 
          };
        }
      }
      
      localStorage.setItem(STUDENT_ID_KEY, normalizedStudentId);
      
      return { 
        error: null,
        user: await mapSupabaseUser(data.user),
        message: '登録確認メールを送信しました。メールを確認してアカウントを有効化してください。'
      };
    } catch (error) {
      console.error('サインアップエラー:', error);
      const message = error instanceof Error ? error.message : 'アカウント作成中にエラーが発生しました。';
      return { 
        error: { message },
        user: null
      };
    } finally {
      setLoading(false);
    }
  };

  // サインイン
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;
      
      const mappedUser = await mapSupabaseUser(data.user);
      const remaining = await tokenManager.getTokenRemainingMinutes();
      console.log(`ログイン成功。トークン有効期限まで残り ${remaining} 分`);
      
      return { 
        error: null,
        user: mappedUser,
        message: 'ログインに成功しました。'
      };
    } catch (error: unknown) {
      console.error('ログインエラー:', error);
      const message = error instanceof Error ? error.message : 'ログインに失敗しました。';
      return { 
        error: { message },
        user: null
      };
    } finally {
      setLoading(false);
    }
  };
  
  // 出席番号の更新
  const updateStudentId = async (studentId: string) => {
    if (!user) {
      return { error: { message: 'ログインしていません。' } };
    }
    
    try {
      const { isUnique, error: checkError } = await checkStudentIdUnique(studentId, user.id);
      
      if (checkError) {
        return { error: { message: '出席番号の確認中にエラーが発生しました。' } };
      }
      
      if (!isUnique) {
        return { error: { message: 'この出席番号は既に使用されています。' } };
      }
      
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (supabaseUser) {
        const result = await storeUserInDatabase(supabaseUser, studentId);
        
        if (result?.error) {
          return { error: result.error };
        }
        
        const updatedUser = { ...user, studentId };
        setUser(updatedUser);
        localStorage.setItem(STUDENT_ID_KEY, studentId);
        
        return { 
          error: null,
          message: '出席番号を更新しました。'
        };
      }
      
      return { error: { message: 'ユーザー情報の取得に失敗しました。' } };
    } catch (error: unknown) {
      console.error('出席番号更新エラー:', error);
      const message = error instanceof Error ? error.message : '出席番号の更新中にエラーが発生しました。';
      return { 
        error: { message }
      };
    }
  };

  // サインアウト
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      tokenManager.clearTokens();
      setUser(null);
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      console.log('ログアウト成功');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // 出席番号からユーザーを検索
  const getUserByStudentId = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, student_id, name')
        .eq('student_id', studentId);
      
      if (error) {
        console.error('Error fetching user by student ID:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const userData = data[0];
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email,
          studentId: userData.student_id
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error in getUserByStudentId:', error);
      return null;
    }
  };

  // 複数の出席番号から複数のユーザーを取得
  const getUsersByStudentIds = async (studentIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, student_id, name')
        .in('student_id', studentIds);
      
      if (error) {
        console.error('Error fetching users by student IDs:', error);
        return [];
      }
      
      return data?.map(userData => ({
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email,
        studentId: userData.student_id
      })) || [];
    } catch (error) {
      console.error('Error in getUsersByStudentIds:', error);
      return [];
    }
  };

  return { 
    user, 
    loading, 
    signIn, 
    signUp, 
    signOut,
    updateStudentId,
    getUserByStudentId,
    getUsersByStudentIds,
    checkAndRefreshToken
  };
};