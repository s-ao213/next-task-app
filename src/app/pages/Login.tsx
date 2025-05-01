"use client";
import React, { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import Button from '../_components/Button';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Mail, ArrowRight, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user, signIn, loading } = useAuth();

  // ローカルストレージから保存されたメールアドレスを取得
  useEffect(() => {
    const savedEmail = localStorage.getItem('next-task-app-auth-email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">認証状態を確認しています...</p>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!email || !email.includes('@')) {
        setMessage({ 
          type: 'error', 
          text: '有効なメールアドレスを入力してください。' 
        });
        setIsSubmitting(false);
        return;
      }

      if (!password) {
        setMessage({ 
          type: 'error', 
          text: 'パスワード（出席番号）を入力してください。' 
        });
        setIsSubmitting(false);
        return;
      }

      const { error, message: responseMessage } = await signIn(email, password);
      
      if (error) {
        setMessage({ 
          type: 'error', 
          text: error.message || 'ログインに失敗しました。メールアドレスと出席番号を確認してください。' 
        });
      } else {
        setMessage({ 
          type: 'success', 
          text: responseMessage || 'ログインに成功しました。リダイレクトします...' 
        });

        // ログイン成功時、ホームにリダイレクト
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました。再度お試しください。';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            メールアドレスと出席番号でログインしてください
          </p>
        </div>
        
        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-6">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="メールアドレス"
              />
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-6">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="パスワード"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                ログイン中...
              </>
            ) : (
              'ログイン'
            )}
          </Button>
          
          <div className="mt-6">
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-600">
                アカウントをお持ちでないですか？
              </p>
              <Link 
                to="/signup" 
                className="flex items-center justify-center mt-2 text-blue-600 hover:text-blue-800"
              >
                新規登録はこちら
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;