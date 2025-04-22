import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
}

// src/app/hooks/useAuth.ts または適切な場所に追加
const storeUserInDatabase = async (user: SupabaseUser) => {
  if (!user) return;
  
  try {
    // ユーザーが既に存在するか確認
    const { data, error } = await supabase
    .from('users')
    .select('id')
    .filter('id', 'eq', user.id)
    .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user:', error);
    }
    
    // ユーザーが存在しない場合は追加
    if (!data) {
      const { error: insertError } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || null,
        created_at: new Date().toISOString()
      });
      
      if (insertError) console.error('Error inserting user:', insertError);
    }
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

// SupabaseのUser型を独自のUser型に変換する関数
const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.email || '', // メタデータからnameを取得
  };
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUser = session?.user || null;
      
      // ここでデータベースにユーザーを保存
      if (supabaseUser) {
        await storeUserInDatabase(supabaseUser);
      }
      
      setUser(mapSupabaseUser(supabaseUser));
      setLoading(false);
    };

    getSession();

    // Listen for changes on auth state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const supabaseUser = session?.user || null;
        
        // ログイン時にユーザーを保存
        if (event === 'SIGNED_IN' && supabaseUser) {
          await storeUserInDatabase(supabaseUser);
        }
        
        setUser(mapSupabaseUser(supabaseUser));
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // 残りのコードは変更なし

  // Sign in with magic link
  const signIn = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    return { error };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signIn, signOut };
};