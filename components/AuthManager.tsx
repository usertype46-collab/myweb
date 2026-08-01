'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function AuthManager({ onAuthChange }: { onAuthChange: (user: User | null) => void }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  
  // 表單狀態
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' }) // type: 'error' | 'success' | 'info'

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
  }, [onAuthChange, supabase.auth])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (isLoginMode) {
      // 執行登入邏輯
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setMessage({ type: 'error', text: '登入失敗：帳號不存在或密碼錯誤。如果是剛註冊，請確認是否已點擊信箱驗證信。' })
        } else {
          setMessage({ type: 'error', text: `登入失敗: ${error.message}` })
        }
      } else {
        setMessage({ type: 'success', text: '登入成功！' })
      }
    } else {
      // 執行註冊邏輯
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        }
      })
      
      if (error) {
        setMessage({ type: 'error', text: `註冊失敗: ${error.message}` })
      } else {
        // 判斷是否需要信箱驗證 (如果 user 的 identities 存在但尚未確認)
        if (data.user?.identities?.length === 0) {
           setMessage({ type: 'error', text: '此信箱已被註冊過，請直接登入。' })
        } else if (data.session === null) {
           setMessage({ type: 'info', text: '註冊成功！我們已發送一封驗證信到您的信箱，請點擊連結以啟用帳號。' })
        } else {
           setMessage({ type: 'success', text: '註冊且自動登入成功！' })
        }
      }
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMessage({ type: 'success', text: '已成功登出。' })
    setEmail('')
    setPassword('')
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
        <form onSubmit={handleAuth} className="space-y-4">
          {/* 模式切換器 */}
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => { setIsLoginMode(true); setMessage({ type: '', text: '' }) }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${isLoginMode ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              登入
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginMode(false); setMessage({ type: '', text: '' }) }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${!isLoginMode ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              註冊新帳號
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件 (Email)</label>
            <input
              type="email"
              required
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
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 個字元"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 text-white rounded-lg transition font-medium disabled:opacity-50 ${isLoginMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-900'}`}
          >
            {loading ? '處理中...' : (isLoginMode ? '確認登入' : '確認註冊')}
          </button>
        </form>
      )}

      {/* 訊息提示區塊 */}
      {message.text && (
        <div className={`mt-4 p-3 rounded-lg border text-sm ${
          message.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 
          message.type === 'success' ? 'bg-green-50 text-green-600 border-green-200' : 
          'bg-blue-50 text-blue-600 border-blue-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
