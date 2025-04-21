"use client";
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Button from '../_components/Button';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user, signIn, loading } = useAuth();

  if (loading) return <div className="flex justify-center p-12">読み込み中...</div>;
  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await signIn(email);
      
      if (error) {
        setMessage({ type: 'error', text: 'ログインに失敗しました。再度お試しください。' });
      } else {
        setMessage({ type: 'success', text: 'ログインリンクをメールで送信しました。メールをご確認ください。' });
        setEmail('');
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました。再度お試しください。' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            予定管理アプリ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            メールアドレスでログインしてください
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
          <div>
            <label htmlFor="email-address" className="sr-only">
              メールアドレス
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="メールアドレス"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? '送信中...' : 'マジックリンクを送信'}
          </Button>
          
          <p className="mt-2 text-center text-sm text-gray-600">
            パスワードは不要です。メールに届くリンクをクリックしてログインしてください。
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;