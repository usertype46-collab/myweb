'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function AuthManager({ onAuthChange }: { onAuthChange: (user: User | null) => void }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // 獲取初始用戶數據
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      onAuthChange(user)
    })

    // 監聽身份狀態變更
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      onAuthChange(currentUser)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignUp = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      }
    })
    if (error) setMessage(`註冊失敗: ${error.message}`)
    else setMessage('註冊成功！請檢查您的電子郵件以驗證帳號。')
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(`登入失敗: ${error.message}`)
    else setMessage('登入成功！')
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMessage('已成功登出。')
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        🔒 身份驗證 (Auth)
      </h2>

      {user ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800">當前已登入為：</p>
            <p className="text-base font-bold text-green-900 break-all">{user.email}</p>
            <p className="text-xs text-green-600 mt-1">UID: {user.id}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            登出帳號
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件 (Email)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼 (Password)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
            >
              登入
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium disabled:opacity-50"
            >
              註冊
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="mt-4 text-sm text-center text-gray-600 bg-gray-50 p-2 rounded border">
          {message}
        </p>
      )}
    </div>
  )
}
