import { GoogleGenerativeAI } from "@google/genai";
import { UserAnswer } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Vite の define 設定で埋め込まれたAPIキーを取得します
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";

export const generateDiagnosis = async (answers: UserAnswer[]): Promise<string> => {
  if (!apiKey) {
    throw new Error("APIキーが設定されていません。GitHubのSecretsを確認してください。");
  }

  // 1. クラス名を GoogleGenerativeAI に修正し、インスタンス化を正しい形式に変更
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 2. モデル取得時にシステム指示を組み込みます
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-flash-preview',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.8,
    }
  });

  const answersFormatted = answers.map(a => `[${a.questionId}: ${a.questionText}] -> 回答: ${a.answerText}`).join('\n');
  const targetLevel = answers.find(a => a.questionId === 'Q15')?.answerText || '未定';
  const targetRegion = answers.find(a => a.questionId === 'Q16')?.answerText || '指定なし';

  const prompt = `
以下のアンケート結果をもとに、この学生にぴったりの進路を詳しく診断してください。
特に「目標レベル：${targetLevel}」および「希望地域：${targetRegion}」に適した実在する大学名と学部名を具体的に提案してください。

【アンケート結果】
${answersFormatted}

学生の将来が楽しみになるような、ポジティブで具体的なアドバイスをお願いします。
`;

  try {
    // 3. 呼び出しフローを SDK の標準仕様（generateContent）に修正
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text || "ごめんね、診断結果をうまくまとめられなかったよ。もう一度試してみてね！";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AIとの通信中にエラーが発生しました。");
  }
};
