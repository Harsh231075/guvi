import fs from "fs";
import wav from "node-wav";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { GoogleGenerativeAI } from "@google/generative-ai";

ffmpeg.setFfmpegPath(ffmpegPath);

const genAI = new GoogleGenerativeAI('AIzaSyCkIidKZ0VfEJHtMJjwmUbDURJl3_EPMdc');

const allowedLanguages = ["Tamil", "English", "Hindi", "Malayalam", "Telugu"];

export const detectVoice = async (req, res) => {
  let wavPath;

  try {
    const { language, audioFormat } = req.body;
    const file = req.file;

    if (!file || !language || audioFormat !== "mp3" || !allowedLanguages.includes(language)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input format"
      });
    }

    const mp3Path = file.path;
    wavPath = `uploads/${Date.now()}.wav`;

    // 🎵 Convert MP3 → WAV
    await new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .toFormat("wav")
        .save(wavPath)
        .on("end", resolve)
        .on("error", reject);
    });

    // 📊 Extract audio samples
    const buffer = fs.readFileSync(wavPath);
    const result = wav.decode(buffer);
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

    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (wavPath && fs.existsSync(wavPath)) fs.unlinkSync(wavPath);

    return res.status(500).json({
      status: "error",
      message: "Processing failed"
    });
  }
};
