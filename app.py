import os
import json
import traceback
from flask import Flask, request, jsonify, render_template
from google import genai
from google.genai import types

# 加上 template_folder 確保 Vercel 找得到網頁
app = Flask(__name__, template_folder='templates')

def get_gemini_client():
    # 在執行時才抓取 API Key，防止 Vercel 啟動時崩潰
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("系統找不到 GEMINI_API_KEY，請確認 Vercel 環境變數設定。")
    return genai.Client(api_key=api_key)

def parse_schedule_image(image_bytes, mime_type):
    try:
        client = get_gemini_client()
        
        prompt = """
        你是一個專業的資料輸入與表格解析 AI。
        請分析這張排班表圖片，將其轉換為 JSON 格式。
        
        規則：
        1. 找出表格中的所有員工列資料。
        2. 輸出必須是一個 JSON Array，每個元素代表一位員工。
        3. 必須嚴格遵照以下 JSON 格式：
        [
            {
                "shift": "班別 (例如 PT/晚班)",
                "name": "門市人員姓名",
                "status": "狀態 (例如 實習，若無則留空字串)",
                "schedule": {
                    "8/3": "該日排班內容(如: 休、或 文化/延平 1900~2200，若空則留空字串)",
                    "8/4": "",
                    "8/5": "",
                    "8/6": "",
                    "8/7": "",
                    "8/8": "",
                    "8/9": ""
                }
            }
        ]
        """
        
        # 使用 2.5 Flash 模型
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1 # 降低隨機性，讓 JSON 結構更穩定
            )
        )
        
        return json.loads(response.text), None
        
    except Exception as e:
        print("❌ 發生錯誤：")
        traceback.print_exc()
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "沒有找到檔案"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "未選擇檔案"}), 400

    if file:
        # 讀取檔案 Bytes 與格式
        image_bytes = file.read()
        mime_type = file.mimetype
        
        # 傳遞給 AI 解析
        parsed_data, error_msg = parse_schedule_image(image_bytes, mime_type)
        
        if parsed_data:
            return jsonify({"status": "success", "data": parsed_data})
        else:
            return jsonify({
                "status": "error", 
                "message": f"AI 解析失敗: {error_msg}"
            }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
