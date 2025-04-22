import { createClient } from '@supabase/supabase-js';

// 環境変数のチェックと確認用のログ
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { 
    url: supabaseUrl ? 'set' : 'missing',
    key: supabaseAnonKey ? 'set' : 'missing'
  });
  throw new Error(`supabaseUrl and supabaseAnonKey are required: URL=${supabaseUrl}, KEY=${supabaseAnonKey ? '***' : 'missing'}`);
}

// Supabaseクライアントを作成（追加のオプションを設定）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});