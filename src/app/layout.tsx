import './globals.css';  // この行が重要です

export const metadata = {
    title: 'Next Task App',
    description: 'タスク管理アプリケーション',
  }
  
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="ja">
        <body>{children}</body>
      </html>
    )
  }