// import fs from "fs"; removed unused import
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const allowedLanguages = ["Tamil", "English", "Hindi", "Malayalam", "Telugu"];

export const detectVoice = async (req, res) => {
  try {
    const { language, audioFormat, audioBase64 } = req.body;

    if (!audioBase64 || !language || audioFormat !== "mp3" || !allowedLanguages.includes(language)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input format. Required: language, audioFormat='mp3', audioBase64 string"
      });
    }

    // Clean Base64 string (remove data URI prefix if present)
    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, "");

    // 🤖 Gemini reasoning
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

    const prompt = `
You are an AI voice authenticity detector.
Please listen to the attached audio sample.

Analyze the audio for:
- Natural breathing patterns and pauses
- Micro-tremors and irregularities typical of human vocal cords
- Digital artifacts or "glitches" typical of synthesis
- Consistencies in tone and cadence

Only classify as AI_GENERATED if there is strong evidence.

Reply ONLY in JSON:
{
 "classification": "AI_GENERATED" or "HUMAN",
 "confidenceScore": number between 0 and 1,
 "explanation": "short technical reason"
}
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/mp3",
          data: base64Data
        }
      }
    ]);

    let text = result.response.text();
    text = text.replace(/```json|```/g, "").trim();

    const aiResult = JSON.parse(text);

    return res.json({
      status: "success",
      language,
      classification: aiResult.classification,
      confidenceScore: aiResult.confidenceScore,
      explanation: aiResult.explanation
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: "error",
      message: "Processing failed",
      error: err.message 
    });
  }
};
