import axios from "axios";

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

    // 🤖 OpenRouter (Gemini 2.0 Flash)
    // We use the OpenAI-compatible endpoint.
    // Note: Passing audio via 'image_url' (or generic content part with data URI) allows OpenRouter/Google to handle it.
    
    // Fallback: Check OPENROUTER_API_KEY, then GEMINI_API_KEY, then fail.
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ Missing OpenRouter API Key");
      return res.status(500).json({ status: "error", message: "Server configuration error: Missing API Key" });
    }

    // Log key prefix for debugging (first 6 chars)
    console.log(`Using API Key starting with: ${apiKey.substring(0, 6)}...`);

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an AI voice authenticity detector.
Analyze this audio for:
- Natural breathing patterns
- Micro-tremors of human vocal cords
- Digital artifacts

Only classify as AI_GENERATED if strong evidence exists.

Reply ONLY in JSON:
{
 "classification": "AI_GENERATED" or "HUMAN",
 "confidenceScore": number 0-1,
 "explanation": "short technical reason"
}`
              },
              {
                type: "image_url", 
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://guvi-voice-api.onrender.com", 
          "X-Title": "Guvi Voice API"
        }
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Parse JSON from the messy Markdown response
    let cleanJson = content.replace(/```json|```/g, "").trim();
    const aiResult = JSON.parse(cleanJson);

    return res.json({
      status: "success",
      language,
      classification: aiResult.classification,
      confidenceScore: aiResult.confidenceScore,
      explanation: aiResult.explanation
    });

  } catch (err) {
    console.error("OpenRouter Error:", err.response?.data || err.message);

    return res.status(500).json({
      status: "error",
      message: "Processing failed",
      error: err.response?.data?.error?.message || err.message
    });
  }
};
