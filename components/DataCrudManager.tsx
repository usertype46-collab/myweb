'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface Todo {
  id: string
  title: string
  is_completed: boolean
  created_at: string
}

export default function DataCrudManager({ user }: { user: User | null }) {
  const supabase = createClient()
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchTodos()
    } else {
      setTodos([])
    }
  }, [user])

  const fetchTodos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('讀取資料失敗:', error.message)
    else setTodos(data || [])
    setLoading(false)
  }

  const addTodo = async () => {
    if (!newTitle.trim() || !user) return
    const { error } = await supabase
      .from('todos')
      .insert([{ title: newTitle.trim(), user_id: user.id }])

    if (error) alert(`新增失敗: ${error.message}`)
    else {
      setNewTitle('')
      fetchTodos()
    }
  }

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !currentStatus })
      .eq('id', id)

    if (error) alert(`更新失敗: ${error.message}`)
    else fetchTodos()
  }

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id)

    if (error) alert(`刪除失敗: ${error.message}`)
    else fetchTodos()
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        📊 資料庫操作 (Database CRUD & RLS)
      </h2>

      {!user ? (
        <p className="text-gray-500 text-sm">請先登入帳號以進行資料庫操作。</p>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="新增一項待辦事項..."
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={addTodo}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              新增
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">資料載入中...</p>
          ) : todos.length === 0 ? (
            <p className="text-sm text-gray-400">目前尚無待辦事項。</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition"
                >
                  <span
                    onClick={() => toggleTodo(todo.id, todo.is_completed)}
                    className={`cursor-pointer text-sm font-medium ${
                      todo.is_completed ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {todo.title}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                  >
                    刪除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
