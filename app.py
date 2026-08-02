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

# 選擇模型， 速度快且視覺能力強
model = genai.GenerativeModel('gemini-2.5-flash')

def parse_schedule_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # 加上明確的 JSON 結構範例，降低幻覺機率
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
        
        # 關鍵修正：啟用強制的 JSON 回應模式 (response_mime_type)
        response = model.generate_content(
            [prompt, img],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        # 因為強制 JSON 模式，出來的文字絕對是合法的 JSON 字串，可直接解析
        return json.loads(response.text)
        
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
            return jsonify({"status": "error", "message": "AI 解析失敗，請確認圖片清晰度或稍後再試。"}), 500

# 供 Vercel Serverless 使用的進入點
if __name__ == '__main__':
    app.run(debug=True, port=5000)
