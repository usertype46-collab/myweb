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
        
        # 將 Prompt 升級為更強烈的「檢查清單」格式，降低 AI 視覺自信的干擾
        prompt = """
        你是一個高階的資料輸入與表格解析 AI。請分析這張排班表圖片，將其精準轉換為 JSON 格式。
        
        【🚨 致命錯誤與視覺幻覺預防：強制校正「光華」與「光春」 🚨】
        由於圖片解析度與字體問題，你極有可能會把「光春」看成「光華」。請在輸出前，嚴格執行以下檢查：
        
        1. **字串強制轉換規則**：
           - 表格中 **絕對沒有「大同/光華」** 這個組合！
           - 如果你辨識出「大同/光華」，那是 100% 錯誤的視覺幻覺，請直接替換輸出為「大同/光春」。
        2. **早班（PT/早班）專屬限制**：
           - 只要是早班人員，排班開頭為「大同/」的，後面必定是「光春」（即「大同/光春」）。
           - 早班的「光華」只會出現在「中洲/光華」這個組合。
        
        規則：
        1. 找出表格中的所有員工列資料。
        2. 輸出必須是一個 JSON Array，每個元素代表一位員工。
        3. 必須嚴格遵照以下 JSON 格式：
        [
            {
                "shift": "班別 (例如 PT/早班, PT/晚班)",
                "name": "門市人員姓名",
                "status": "狀態 (例如 支援, 實習，若無則留空字串)",
                "schedule": {
                    "8/3": "該日排班內容(如: 休、指休、或 大同/光春 0830~1130，若空則留空字串)",
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
                # 將 temperature 設為 0.0，要求最穩定、最不具隨機性的輸出以提升 OCR 精準度
                temperature=0.0 
            )
        )
        
        parsed_data = json.loads(response.text)
        
        # 🛡️ 雙重保險：Python 程式碼層級的資料清洗 (Post-processing)
        # 徹底防止 AI 偶發的視覺幻覺，以程式強制執行業務邏輯
        for employee in parsed_data:
            if "schedule" in employee:
                for date, shift_info in employee["schedule"].items():
                    if shift_info and isinstance(shift_info, str):
                        # 1. 絕對替換：只要出現「大同/光華」，強制修正為「大同/光春」
                        if "大同/光華" in shift_info:
                            employee["schedule"][date] = shift_info.replace("大同/光華", "大同/光春")
                        
                        # 2. 早班防呆：如果是早班且包含「大同/」，強制確保沒有「光華」
                        if employee.get("shift", "").strip() == "PT/早班" and "大同/" in shift_info:
                            if "光華" in shift_info:
                                employee["schedule"][date] = shift_info.replace("光華", "光春")
        
        return parsed_data, None
        
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
