import os
import json
from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
from PIL import Image
import io

app = Flask(__name__)

# 設定你的 Gemini API Key (佈署時請設定在環境變數)
GOOGLE_API_KEY = os.environ.get("GEMINI_API_KEY", "AQ.Ab8RN6K5k8eX2ne-PGoDp9wO_bLbsb8heGCJBFmjF-og2MA1ew")
genai.configure(api_key=GOOGLE_API_KEY)

# 選擇模型，gemini-2.5-flash 速度快且視覺能力強
model = genai.GenerativeModel('gemini-2.5-flash')

def parse_schedule_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # 精準的 Prompt 工程，確保 AI 輸出完美的 JSON
        prompt = """
        你是一個專業的資料輸入與表格解析 AI。
        請分析這張排班表圖片，將其轉換為 JSON 格式。
        
        規則：
        1. 找出表格中的所有員工列資料。
        2. 輸出必須是一個 JSON Array，每個元素代表一位員工。
        3. 每個員工的 JSON Object 必須包含以下欄位：
           - "shift": 班別 (例如 "PT/晚班", "PT/早班")
           - "name": 門市人員姓名
           - "status": 狀態 (例如 "實習", "支援"，如果為空則填 "")
           - "schedule": 包含 8/3 到 8/9 的排班資料物件。鍵名請用 "8/3", "8/4", "8/5", "8/6", "8/7", "8/8", "8/9"。值請填寫該格子的內容 (例如 "休", "指休", "文化/延平 1900~2200")。如果是空白請填 ""。
        
        請「絕對只」輸出純 JSON 格式的字串，不要加上 ```json 標籤，也不要加上任何其他說明文字，確保我可以直接用 JSON.parse 解析。
        """
        
        response = model.generate_content([prompt, img])
        
        # 清理可能附帶的 Markdown 標記
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        return json.loads(result_text.strip())
        
    except Exception as e:
        print(f"Error parsing image: {e}")
        return None

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
        image_bytes = file.read()
        parsed_data = parse_schedule_image(image_bytes)
        
        if parsed_data:
            return jsonify({"status": "success", "data": parsed_data})
        else:
            # 根據需求更新了這裡的錯誤訊息
            return jsonify({"status": "error", "message": "解析失敗，檢查圖片解析度或稍後再試"}), 500

# 供 Vercel Serverless 使用的進入點
if __name__ == '__main__':
    app.run(debug=True, port=5000)
