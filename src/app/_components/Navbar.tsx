"use client";
import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Menu, X, Home, Calendar, ClipboardList, PartyPopper, BookOpen, LogOut } from 'lucide-react';
import React from 'react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [userInitial, setUserInitial] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    // セッション監視の設定
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (session?.user?.email) {
        setUserInitial(session.user.email[0].toUpperCase());
      }
    });

    window.addEventListener('resize', handleResize);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // リダイレクトを行う
    window.location.href = '/login';
  };

  // 現在のパスがナビゲーションアイテムのパスと一致するかチェック
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // パフォーマンス最適化のためメモ化
  const memoizedNavItems = useMemo(() => [
    { name: 'ダッシュボード', path: '/', icon: <Home size={20} /> },
    { name: 'カレンダー', path: '/calendar', icon: <Calendar size={20} /> },
    { name: '課題', path: '/tasks', icon: <ClipboardList size={20} /> },
    { name: 'イベント', path: '/events', icon: <PartyPopper size={20} /> },
    { name: 'テスト', path: '/tests', icon: <BookOpen size={20} /> },
  ], []);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* ロゴとサイト名 */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="font-bold text-xl text-blue-600 flex items-center">
              <ClipboardList className="mr-2 h-6 w-6" />
              <span className="hidden sm:inline">Next Task App</span>
            </Link>
          </div>
          
          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {memoizedNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* ユーザーメニュー */}
          <div className="hidden md:flex items-center">
            {session ? (
              <div className="ml-4 flex items-center">
                <div className="flex items-center space-x-2 border-l pl-4 border-gray-200">
                  <Link to="/setting">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium cursor-pointer hover:opacity-80">
                      {userInitial}
                    </div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-700 hover:text-red-500 transition-colors duration-200"
                  >
                    <LogOut size={18} className="mr-1" />
                    <span className="text-sm">ログアウト</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                ログイン
              </Link>
            )}
          </div>
          
          {/* モバイル用メニューボタン */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">メニューを開く</span>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* モバイル用メニュー */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          {memoizedNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive(item.path)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
          
          {/* モバイル用ユーザーメニュー */}
          {session ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-3">
                <Link to="/setting" onClick={() => setIsOpen(false)}>
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium cursor-pointer hover:opacity-80">
                    {userInitial}
                  </div>
                </Link>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-800">
                    {session.user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2">
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                >
                  <LogOut size={18} className="mr-3" />
                  ログアウト
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="block w-full mt-4 px-3 py-2 text-center rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);