// app/api/parse/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) {
      return NextResponse.json({ error: "未找到圖片檔案" }, { status: 400 });
    }

    // 將檔案轉換為 AI 引擎所需的 Base64 格式
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    // 初始化 Gemini AI 引擎
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 精準設定 Prompt，要求 AI 輸出特定結構的 JSON
    const prompt = `
      你是一個精準的資料解析助理。請解析這張員工班表圖片，並嚴格將其轉換為 JSON 格式陣列輸出。
      圖片包含：班別、門市人員、狀態，以及 8月3日 到 8月9日 的每日排班。
      
      請遵循以下 JSON 結構規範，陣列中的每個物件代表一名員工：
      [
        {
          "shift_type": "PT/晚班",
          "name": "陳建邦",
          "status": "",
          "schedule": {
            "08-03": "指休",
            "08-04": "指休",
            "08-05": "文化/延平 1900~2200",
            "08-06": "休",
            "08-07": "大同 1900~2100",
            "08-08": "文化/延平 1830~2130",
            "08-09": "愛國/四維 1900-2200"
          }
        }
      ]
      
      注意：
      1. 遇到空自請填入空字串 ""，若為支援或實習請填寫於 status。
      2. 遇到換行（如地點在上方，時間在下方），請用半形空格合併成一行（如 "文化/延平 1900~2200"）。
      3. 嚴格只輸出 JSON 格式字串，不要包含任何 Markdown 標記（如 \`\`\`json ），不要有任何額外的問候語。
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const responseText = result.response.text();
    
    // 清理可能的 Markdown 標籤以確保 JSON 解析正確
    const cleanJsonString = responseText.replace(/```json\n?|```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonString);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error) {
    console.error("AI 解析錯誤:", error);
    return NextResponse.json({ error: "解析失敗，請確認圖片清晰度或稍後再試。" }, { status: 500 });
  }
}
