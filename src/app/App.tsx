"use client";

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Layout from './_components/Layout';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Events from './pages/Events';
import Tests from './pages/Tests';
import Login from './pages/Login';
import { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBrowser, setIsBrowser] = useState<boolean>(false);

  useEffect(() => {
    // クライアントサイドのみでレンダリングされることを確認
    setIsBrowser(true);
    
    // セッションの取得とAuthStateChangeの監視を同時に設定
    const initializeAuth = async () => {
      try {
        // 現在のセッションを取得
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData.session);
        
        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, updatedSession) => {
            setSession(updatedSession);
          }
        );
        
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('認証初期化エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // サーバーサイドレンダリング対応
  if (!isBrowser) {
    return null;
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-100 to-purple-100">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <h2 className="text-xl font-medium text-gray-700">読み込み中...</h2>
          <p className="text-gray-500">アプリケーションを準備しています</p>
        </div>
      </div>
    );
  }

  // ルーティング定義
  const routes = [
    { path: "/", element: <Dashboard />, exact: true },
    { path: "/calendar", element: <Calendar /> },
    { path: "/tasks", element: <Tasks /> },
    { path: "/events", element: <Events /> },
    { path: "/tests", element: <Tests /> }
  ];

  return (
    <Router>
      <Routes>
        {/* ログインページ - 認証されていない場合のみアクセス可能 */}
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" replace />} 
        />

        {/* 認証が必要なルート - ログインしていない場合はログインページにリダイレクト */}
        <Route 
          path="/*" 
          element={
            session ? (
              <Layout>
                <Routes>
                  {routes.map((route) => (
                    <Route 
                      key={route.path} 
                      path={route.path === "/" ? "" : route.path}
                      element={route.element} 
                      index={route.exact}
                    />
                  ))}
                  {/* 一致しないパスはダッシュボードにリダイレクト */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;