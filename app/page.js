// app/page.js
"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("請先選擇一張班表圖片！");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        alert(data.error || "解析發生錯誤");
      }
    } catch (err) {
      alert("網路連線錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">AI 智能班表解析系統</h1>
        
        {/* 上傳區塊 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col items-center space-y-4">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {preview && (
            <img src={preview} alt="班表預覽" className="max-w-full h-auto max-h-96 rounded border" />
          )}
          <button 
            onClick={handleUpload} 
            disabled={loading || !file}
            className={`px-8 py-3 rounded-full text-white font-bold transition-all ${
              loading || !file ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"
            }`}
          >
            {loading ? "AI 引擎解析中 (約需 5-10 秒)..." : "開始精準解析"}
          </button>
        </div>

        {/* 結果顯示區塊 */}
        {result && (
          <div className="bg-white p-6 rounded-xl shadow-sm border overflow-x-auto">
            <h2 className="text-xl font-bold mb-4">解析結果</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border p-2 min-w-[80px]">班別</th>
                  <th className="border p-2 min-w-[80px]">人員</th>
                  <th className="border p-2 min-w-[60px]">狀態</th>
                  <th className="border p-2 min-w-[100px]">8月3日</th>
                  <th className="border p-2 min-w-[100px]">8月4日</th>
                  <th className="border p-2 min-w-[100px]">8月5日</th>
                  <th className="border p-2 min-w-[100px]">8月6日</th>
                  <th className="border p-2 min-w-[100px]">8月7日</th>
                  <th className="border p-2 min-w-[100px]">8月8日</th>
                  <th className="border p-2 min-w-[100px]">8月9日</th>
                </tr>
              </thead>
              <tbody>
                {result.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border p-2">{row.shift_type}</td>
                    <td className="border p-2 font-medium">{row.name}</td>
                    <td className="border p-2">{row.status}</td>
                    <td className="border p-2 text-gray-600">{row.schedule["08-03"]}</td>
                    <td className="border p-2 text-gray-600">{row.schedule["08-04"]}</td>
                    <td className="border p-2 text-gray-600">{row.schedule["08-05"]}</td>
                    <td className="border p-2 text-gray-600">{row.schedule["08-06"]}</td>
                    <td className="border p-2 text-gray-600">{row.schedule["08-07"]}</td>
                    <td className="border p-2 text-gray-600">{row.schedule["08-08"]}</td>
                    <td className="border p-2 text-gray-600">{row.schedule["08-09"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
