import { GoogleGenAI } from "@google/genai";
import { UserAnswer } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export const generateDiagnosis = async (answers: UserAnswer[]): Promise<string> => {
  // Viteのdefine設定からキーを取得
  const apiKey = process.env.GEMINI_API_KEY || "";
  
  if (!apiKey) {
    // コンソールに表示されるエラーメッセージの原因
    console.error("API Key is missing from environment variables.");
    throw new Error("APIキーが設定されていません。");
  }

  // 正しいクラス名 GoogleGenAI を使用
  const ai = new GoogleGenAI({ apiKey });
  
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
      },
    });

    return response.text || "ごめんね、診断結果をうまくまとめられなかったよ。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AIとの通信中にエラーが発生しました。");
  }
};
