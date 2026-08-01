'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface Message {
  id: string
  content: string
  created_at: string
}

export default function RealtimeChannel({ user }: { user: User | null }) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMsg, setInputMsg] = useState('')

  useEffect(() => {
    // 獲取歷史廣播記錄
    const loadInitialMessages = async () => {
      const { data } = await supabase
        .from('live_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setMessages(data)
    }

    loadInitialMessages()

    // 啟動 Realtime WebSocket 訂閱
    const channel = supabase
      .channel('public:live_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_messages' },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => [newMsg, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const sendMessage = async () => {
    if (!inputMsg.trim() || !user) return
    const { error } = await supabase
      .from('live_messages')
      .insert([{ content: inputMsg.trim(), user_id: user.id }])

    if (error) alert(`發送失敗: ${error.message}`)
    else setInputMsg('')
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        ⚡ 即時廣播 (Realtime Subscription)
      </h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder={user ? "發送即時廣播訊息..." : "請先登入以發送訊息"}
            disabled={!user}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
          />
          <button
            onClick={sendMessage}
            disabled={!user}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
          >
            發送
          </button>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-40 overflow-y-auto font-mono text-xs space-y-2">
          <p className="text-gray-500">// 系統：WebSocket 連線已建立，等待 Realtime 變更...</p>
          {messages.map((msg) => (
            <p key={msg.id} className="break-all">
              <span className="text-gray-400">[{new Date(msg.created_at).toLocaleTimeString()}]</span> {msg.content}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
