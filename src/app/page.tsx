"use client";

import App from './App';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // 開発環境でのService Workerをリセット
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('Service Worker unregistered');
        }
      });
    }
  }, []);

  return <App />;
}