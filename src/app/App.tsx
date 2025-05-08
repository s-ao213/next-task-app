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
import Signup from './pages/Signup';

import { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('認証初期化エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  if (!isBrowser) {
    return null;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-r from-indigo-100 to-purple-100">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <h2 className="text-xl font-medium text-gray-700">読み込み中...</h2>
          <p className="text-gray-500">アプリケーションを準備しています</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" replace />} />
        <Route 
          path="/*" 
          element={
            session ? (
              <Layout>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="events" element={<Events />} />
                  <Route path="tests" element={<Tests />} />
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