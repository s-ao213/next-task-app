import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'next-task-app-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'next-task-app'
    }
  }
});

// トークン管理専用のユーティリティ
export const tokenManager = {
  // アクセストークンを取得
  getAccessToken: async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  },

  // リフレッシュトークンを取得
  getRefreshToken: async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.refresh_token || null;
  },

  // トークンの有効期限をチェック（秒単位）
  getTokenExpiry: async (): Promise<number | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.expires_at || null;
  },

  // トークンが期限切れかどうか（5分前にtrueを返す）
  isTokenExpiringSoon: async (): Promise<boolean> => {
    const expiresAt = await tokenManager.getTokenExpiry();
    if (!expiresAt) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5分のバッファ
    
    return now >= (expiresAt - bufferTime);
  },

  // トークンを手動で更新
  refreshToken: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('トークン更新エラー:', error);
        return null;
      }
      
      if (session) {
        console.log('トークンが正常に更新されました');
        return session;
      }
      
      return null;
    } catch (error) {
      console.error('トークン更新の例外:', error);
      return null;
    }
  },

  // トークンをクリア
  clearTokens: (): void => {
    localStorage.removeItem('next-task-app-auth');
  },

  // トークンの残り時間を取得（分単位）
  getTokenRemainingMinutes: async (): Promise<number | null> => {
    const expiresAt = await tokenManager.getTokenExpiry();
    if (!expiresAt) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiresAt - now;
    
    return Math.floor(remaining / 60);
  }
};