'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import AuthManager from '@/components/AuthManager'
import DataCrudManager from '@/components/DataCrudManager'
import StorageManager from '@/components/StorageManager'
import RealtimeChannel from '@/components/RealtimeChannel'
import RpcCaller from '@/components/RpcCaller'

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Supabase 繁體中文全功能控制台樣板
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            包含身份驗證 (Auth)、資料庫 CRUD、即時監聽 (Realtime)、雲端儲存 (Storage) 與 SQL 函數 (RPC) 的全套示範程式碼。
          </p>
        </div>

        {/* 核心功能分頁佈局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AuthManager onAuthChange={setCurrentUser} />
          <DataCrudManager user={currentUser} />
          <StorageManager user={currentUser} />
          <RealtimeChannel user={currentUser} />
        </div>

        <div className="w-full">
          <RpcCaller user={currentUser} />
        </div>
      </div>
    </main>
  )
}
