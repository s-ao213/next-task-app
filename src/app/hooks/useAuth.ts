import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

// ユーザーインターフェースに出席番号を追加
export interface User {
  id: string;
  email: string;
  name: string;
  studentId?: string; // 出席番号
}

// ローカルストレージのキー
const EMAIL_STORAGE_KEY = 'next-task-app-auth-email';
const STUDENT_ID_KEY = 'next-task-app-student-id';

// ユーザー情報をデータベースに保存・更新する関数
const storeUserInDatabase = async (user: SupabaseUser, studentId?: string) => {
  if (!user) return { error: { message: 'ユーザー情報がありません' } };
  
  try {
    // 出席番号が必須の場合のバリデーション
    if (!studentId || studentId.trim() === '') {
      return { error: { message: '出席番号は必須です' } };
    }
    
    // 出席番号を正規化（前後の空白を削除）
    const normalizedStudentId = studentId.trim();
    
    // ユーザーが既に存在するか確認
    const { data, error } = await supabase
      .from('users')
      .select('id, student_id')
      .eq('id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user:', error);
      return { error };
    }
    
    // 更新するデータを準備
    const userData: { 
      id: string;
      email: string | undefined;
      name: string;
      student_id: string; // nullを許可しない
      updated_at: string;
      created_at?: string;
    } = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email || '',
      // 必ず値を持つように
      student_id: normalizedStudentId,
      updated_at: new Date().toISOString()
    };

    // 新規登録の場合は作成日時も設定
    if (!data) {
      userData.created_at = new Date().toISOString();
    }
    
    // ユーザー情報をデータベースに保存/更新
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
    
    // 自分自身は除外する（更新時）
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking student ID:', error);
      return { isUnique: false, error };
    }
    
    // データがなければ一意
    return { isUnique: !data || data.length === 0 };
  } catch (error) {
    console.error('Error checking student ID uniqueness:', error);
    return { isUnique: false, error };
  }
};

// SupabaseのUser型を独自のUser型に変換する関数
const mapSupabaseUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser) return null;
  
  // ユーザーの追加情報をデータベースから取得
  const { data } = await supabase
    .from('users')
    .select('student_id')
    .eq('id', supabaseUser.id)
    .single();
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
    studentId: data?.student_id || '' 
  };
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッションチェック＆ユーザー情報の取得
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUser = session?.user || null;
      
      if (supabaseUser) {
        // ユーザー情報をマッピング
        const mappedUser = await mapSupabaseUser(supabaseUser);
        setUser(mappedUser);
        
        // ローカルストレージに保存（自動ログイン用）
        if (mappedUser?.email) {
          localStorage.setItem(EMAIL_STORAGE_KEY, mappedUser.email);
        }
        if (mappedUser?.studentId) {
          localStorage.setItem(STUDENT_ID_KEY, mappedUser.studentId);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };

    getSession();

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const supabaseUser = session?.user || null;
        
        if (event === 'SIGNED_IN' && supabaseUser) {
          const mappedUser = await mapSupabaseUser(supabaseUser);
          setUser(mappedUser);
          
          // ローカルストレージに保存
          if (mappedUser?.email) {
            localStorage.setItem(EMAIL_STORAGE_KEY, mappedUser.email);
          }
          if (mappedUser?.studentId) {
            localStorage.setItem(STUDENT_ID_KEY, mappedUser.studentId);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(EMAIL_STORAGE_KEY);
          localStorage.removeItem(STUDENT_ID_KEY);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // 出席番号を使用したサインアップ（新規ユーザー登録）
  const signUp = async (email: string, password: string, studentId: string) => {
    setLoading(true);
    try {
      // 出席番号のバリデーション
      if (!studentId || studentId.trim() === '') {
        return { 
          error: { message: '出席番号は必須です。入力してください。' },
          user: null 
        };
      }
      
      // 出席番号を正規化（前後の空白を削除）
      const normalizedStudentId = studentId.trim();
      
      // まず出席番号の一意性を確認
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
      
      // 新規ユーザー登録 - メタデータに出席番号を保存
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            student_id: normalizedStudentId // 認証データにも出席番号を保存
          }
        }
      });
      
      if (error) throw error;
      
      // ユーザーメタデータ＆出席番号をデータベースに保存
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
      
      // ローカルストレージに出席番号を保存
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

  // 出席番号を使用したサインイン（ログイン）
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;
      
      // ユーザー情報をマッピング
      const mappedUser = await mapSupabaseUser(data.user);
      
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
      // 一意性の確認
      const { isUnique, error: checkError } = await checkStudentIdUnique(studentId, user.id);
      
      if (checkError) {
        return { error: { message: '出席番号の確認中にエラーが発生しました。' } };
      }
      
      if (!isUnique) {
        return { error: { message: 'この出席番号は既に使用されています。' } };
      }
      
      // 出席番号を更新
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (supabaseUser) {
        const result = await storeUserInDatabase(supabaseUser, studentId);
        
        if (result?.error) {
          return { error: result.error };
        }
        
        // 状態を更新
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
      
      // ローカルストレージもクリア
      localStorage.removeItem(EMAIL_STORAGE_KEY);
      localStorage.removeItem(STUDENT_ID_KEY);
      setUser(null);
      
      return { error: null };
    } catch (error: unknown) {
      console.error('サインアウトエラー:', error);
      const message = error instanceof Error ? error.message : 'ログアウト中にエラーが発生しました。';
      return { error: { message } };
    }
  };

  // 出席番号からユーザーを検索する関数（課題割り当て用）
  const getUserByStudentId = async (studentId: string) => {
    try {
      // .single()メソッドを削除し、配列として結果を取得
      const { data, error } = await supabase
        .from('users')
        .select('id, email, student_id, name')
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      // データが存在しない場合
      if (!data || data.length === 0) {
        return { 
          error: { message: '指定された出席番号のユーザーが見つかりません' },
          user: null
        };
      }
      
      // 最初のユーザーを返す
      return { 
        error: null,
        user: {
          id: data[0].id,
          email: data[0].email,
          name: data[0].name || data[0].email,
          studentId: data[0].student_id
        }
      };
    } catch (error: unknown) {
      console.error('ユーザー検索エラー:', error);
      const message = error instanceof Error ? error.message : 'ユーザーの検索中にエラーが発生しました';
      return { 
        error: { message },
        user: null
      };
    }
  };

  return { 
    user, 
    loading, 
    signUp,
    signIn, 
    signOut,
    updateStudentId,
    getUserByStudentId
  };
};