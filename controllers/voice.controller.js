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

    // Ensure we have a valid Data URI or raw base64
    let dataUrl = audioBase64;
    if (!audioBase64.startsWith("data:")) {
      dataUrl = `data:audio/mp3;base64,${audioBase64}`;
    }

    console.log("Constructed dataUrl length:", dataUrl.length);

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
                text: `You are an expert AI audio forensics analyst.
Your task is to detect if this voice is AI-GENERATED or HUMAN.

Analyze strictly for:
1. Unnatural perfectness (lack of breaths, pauses, or micro-stutters).
2. "Metallic" or robotic artifacts in high frequencies.
3. Inconsistent background noise or sudden spectral cutoffs.
4. Pitch consistency that appears mathematically generated.

If you suspect this is synthetic, classify as AI_GENERATED.
Do not default to HUMAN unless you hear distinct organic traits (mouth clicks, irregular breaths).

Reply ONLY in JSON:
{
 "classification": "AI_GENERATED" or "HUMAN",
 "confidenceScore": number 0-1 (1 = certain),
 "explanation": "technical reason citing specific artifacts or lack thereof"
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
