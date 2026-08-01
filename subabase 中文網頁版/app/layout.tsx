import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// 載入 Google 字體
const inter = Inter({ subsets: ['latin'] })

// 設定網站的 Meta 資訊 (SEO)
export const metadata: Metadata = {
  title: 'Supabase 全功能繁體中文模板',
  description: '整合 Auth, CRUD, Realtime, Storage 與 RPC 的 Next.js 全棧模板',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        {/* children 將會渲染 app/page.tsx 等頁面內容 */}
        {children}
      </body>
    </html>
  )
}
