"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'ダッシュボード' },
    { path: '/tasks', label: '課題' },
    { path: '/events', label: 'イベント' },
    { path: '/tests', label: 'テスト' },
    { path: '/calendar', label: 'カレンダー' },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <div className="flex items-center py-4">
              <span className="font-bold text-xl text-blue-600">予定管理アプリ</span>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`py-4 px-3 text-gray-700 hover:text-blue-600 ${
                    location.pathname === item.path ? 'border-b-2 border-blue-500' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700">{user.email}</span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  ログアウト
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  ログイン
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;