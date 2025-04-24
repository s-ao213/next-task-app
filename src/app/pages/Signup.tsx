"use client";
import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import Button from '../_components/Button';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Mail, UserPlus, ArrowRight, Lock } from 'lucide-react';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user, signUp, loading } = useAuth();

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
      // 入力バリデーション
      if (!email || !email.includes('@')) {
        setMessage({ 
          type: 'error', 
          text: '有効なメールアドレスを入力してください。' 
        });
        setIsSubmitting(false);
        return;
      }

      if (!password || password.length < 6) {
        setMessage({ 
          type: 'error', 
          text: 'パスワードは6文字以上で入力してください。' 
        });
        setIsSubmitting(false);
        return;
      }

      if (!studentId.trim()) {
        setMessage({ 
          type: 'error', 
          text: '出席番号は必須です。入力してください。' 
        });
        setIsSubmitting(false);
        return;
      }

      const { error, message: responseMessage } = await signUp(email, password, studentId);
      
      if (error) {
        setMessage({ 
          type: 'error', 
          text: error.message || 'アカウント作成に失敗しました。再度お試しください。' 
        });
      } else {
        setMessage({ 
          type: 'success', 
          text: responseMessage || '登録が完了しました。メールを確認してアカウントを有効化してください。' 
        });
        setEmail('');
        setPassword('');
        setStudentId('');
      }
    } catch (error: unknown) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'エラーが発生しました。再度お試しください。' 
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
            新規アカウント登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            必要情報を入力してアカウントを作成してください
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="パスワード（6文字以上）"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="student-id" className="block text-sm font-medium text-gray-700 mb-1">
                出席番号 <span className="text-red-500">*</span>
              </label>
              <input
                id="student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required // 必須フィールドに設定
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="出席番号（必須）"
              />
              <p className="mt-1 text-xs text-gray-500">
                <span className="text-red-500">※</span> 出席番号は必須で、他のユーザーと重複できません
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                送信中...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                アカウント作成
              </>
            )}
          </Button>
          
          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              登録後、確認メールが送信されます。メールのリンクをクリックしてアカウントを有効化してください。
            </p>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                すでにアカウントをお持ちですか？
              </p>
              <Link 
                to="/login" 
                className="flex items-center justify-center mt-2 text-blue-600 hover:text-blue-800"
              >
                ログインはこちら
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;