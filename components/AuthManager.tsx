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
  const [message, setMessage] = useState({ type: '', text: '' })

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

  // Email / 密碼登入或註冊
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (isLoginMode) {
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

  // GitHub OAuth 第三方登入
  const handleGitHubSignIn = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: `GitHub 登入失敗: ${error.message}` })
      setLoading(false)
    }
    // 注意：若成功執行 OAuth，瀏覽器會自動跳轉至 GitHub 驗證頁面
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
        <div className="space-y-4">
          {/* GitHub 登入按鈕 */}
          <button
            type="button"
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#24292F] hover:bg-[#1b1f23] text-white rounded-lg transition font-medium shadow-sm disabled:opacity-50"
          >
            {/* GitHub Logo SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            使用 GitHub 登入
          </button>

          {/* 分隔線 */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-3 text-xs text-gray-400 absolute">或使用信箱登入</span>
          </div>

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
        </div>
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
