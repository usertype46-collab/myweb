'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function RpcCaller({ user }: { user: User | null }) {
  const supabase = createClient()
  const [stats, setStats] = useState<{ total_count: number; completed_count: number; pending_count: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const callRpcStats = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase.rpc('get_user_todo_stats')

    if (error) {
      alert(`RPC 執行失敗: ${error.message}`)
    } else if (data && data.length > 0) {
      setStats(data[0])
    }
    setLoading(false)
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        ⚙️ 資料庫函數 (RPC / Stored Procedure)
      </h2>

      {!user ? (
        <p className="text-gray-500 text-sm">請登入後測試 RPC 數據計算功能。</p>
      ) : (
        <div className="space-y-4">
          <button
            onClick={callRpcStats}
            disabled={loading}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
          >
            {loading ? '計算中...' : '執行 RPC: 計算我的 Todo 統計數據'}
          </button>

          {stats && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-600">總計項目</p>
                <p className="text-lg font-bold text-purple-900">{stats.total_count}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-600">已完成</p>
                <p className="text-lg font-bold text-green-900">{stats.completed_count}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-600">待完成</p>
                <p className="text-lg font-bold text-amber-900">{stats.pending_count}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
