'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function StorageManager({ user }: { user: User | null }) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    const { data, error } = await supabase.storage.from('user_assets').list('', { limit: 20 })
    if (error) {
      console.error('檔案清單讀取失敗:', error)
      return
    }

    if (data) {
      const fileList = data.map((file) => {
        const { data: publicUrlData } = supabase.storage
          .from('user_assets')
          .getPublicUrl(file.name)
        return {
          name: file.name,
          url: publicUrlData.publicUrl,
        }
      })
      setFiles(fileList)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) return
      if (!user) {
        alert('上傳檔案前請先登入！')
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error } = await supabase.storage.from('user_assets').upload(fileName, file)

      if (error) throw error

      alert('檔案上傳成功！')
      fetchFiles()
    } catch (error: any) {
      alert(`上傳失敗: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (fileName: string) => {
    const { error } = await supabase.storage.from('user_assets').remove([fileName])
    if (error) alert(`刪除失敗: ${error.message}`)
    else fetchFiles()
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        📁 雲端儲存 (Storage)
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            上傳新檔案至 user_assets 儲存桶：
          </label>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading || !user}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          {!user && <p className="text-xs text-amber-600 mt-1">⚠️ 需登入後方可執行上傳操作。</p>}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">公開檔案清單：</h3>
          {files.length === 0 ? (
            <p className="text-xs text-gray-400">目前尚無檔案。</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {files.map((file) => (
                <div key={file.name} className="p-2 border rounded-lg bg-gray-50 flex items-center justify-between">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline truncate max-w-[120px]"
                  >
                    {file.name}
                  </a>
                  {user && (
                    <button
                      onClick={() => deleteFile(file.name)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      刪除
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
