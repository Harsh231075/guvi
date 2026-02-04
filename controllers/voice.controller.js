import fs from "fs";
import wav from "node-wav";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { GoogleGenerativeAI } from "@google/generative-ai";

ffmpeg.setFfmpegPath(ffmpegPath);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const allowedLanguages = ["Tamil", "English", "Hindi", "Malayalam", "Telugu"];

export const detectVoice = async (req, res) => {
  let wavPath;
  let mp3Path;

  try {
    const { language, audioFormat, audioBase64 } = req.body;

    if (!audioBase64 || !language || audioFormat !== "mp3" || !allowedLanguages.includes(language)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input format. Required: language, audioFormat='mp3', audioBase64 string"
      });
    }

    mp3Path = `uploads/${Date.now()}.mp3`;
    wavPath = `uploads/${Date.now()}.wav`;

    // Clean Base64 string (remove data URI prefix if present)
    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
    const mp3Buffer = Buffer.from(base64Data, 'base64');
    
    fs.writeFileSync(mp3Path, mp3Buffer);

    // 🎵 Convert MP3 → WAV
    await new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .toFormat("wav")
        .save(wavPath)
        .on("end", resolve)
        .on("error", reject);
    });

    // 📊 Extract audio samples
    const wavBuffer = fs.readFileSync(wavPath);
    const result = wav.decode(wavBuffer);
    const samples = result.channelData[0];

    let sum = 0;
    let zeroCrossings = 0;
    let energySum = 0;
    let energySqSum = 0;
    let pitchVar = 0;

    for (let i = 0; i < samples.length; i++) {
      const val = samples[i];

      sum += Math.abs(val);
      energySum += val * val;
      energySqSum += (val * val) ** 2;

      if (i > 0) {
        if (samples[i - 1] * val < 0) zeroCrossings++;
        pitchVar += Math.abs(val - samples[i - 1]);
      }
    }

    const avgAmplitude = sum / samples.length;
    const zcr = zeroCrossings / samples.length;

    const energyMean = energySum / samples.length;
    const energyVariance = (energySqSum / samples.length) - (energyMean ** 2);
    pitchVar = pitchVar / samples.length;

    // 🤖 Gemini reasoning
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

    const prompt = `
You are an AI voice authenticity detector.

Acoustic features:
- Average Amplitude: ${avgAmplitude}
- Zero Crossing Rate: ${zcr}
- Energy Variance: ${energyVariance}
- Pitch Variation: ${pitchVar}

Human speech usually shows:
• Irregular pitch variation
• Higher energy variance
• Natural fluctuations

AI-generated speech often shows:
• Very smooth waveform
• Low pitch variation
• Consistent energy levels

Only classify as AI_GENERATED if there is strong evidence.

Reply ONLY in JSON:
{
 "classification": "AI_GENERATED" or "HUMAN",
 "confidenceScore": number between 0 and 1,
 "explanation": "short technical reason"
}
`;

    let text = (await model.generateContent(prompt)).response.text();
    text = text.replace(/```json|```/g, "").trim();

    const aiResult = JSON.parse(text);

    fs.unlinkSync(mp3Path);
    fs.unlinkSync(wavPath);

    return res.json({
      status: "success",
      language,
      classification: aiResult.classification,
      confidenceScore: aiResult.confidenceScore,
      explanation: aiResult.explanation
    });

  } catch (err) {
    console.error(err);

    if (mp3Path && fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
    if (wavPath && fs.existsSync(wavPath)) fs.unlinkSync(wavPath);

    return res.status(500).json({
      status: "error",
      message: "Processing failed",
      error: err.message // Return specific error for debugging
    });
  }
};
