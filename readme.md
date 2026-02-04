```md
# 🎙️ AI-Generated Voice Detection API

This API detects whether a given voice sample is **AI-generated** or spoken by a **real human**.

The system analyzes acoustic voice features and applies AI reasoning to determine authenticity.

---

## 🌍 Supported Languages

The API supports voice samples in the following languages:

- Tamil  
- English  
- Hindi  
- Malayalam  
- Telugu  

---

## 🔐 Authentication

All requests must include a valid API key in the request headers.

```

x-api-key: YOUR_SECRET_API_KEY

```

Requests without a valid key will be rejected.

---

## 🚀 API Endpoint

```

POST [https://your-render-domain.com/api/voice-detection](https://your-render-domain.com/api/voice-detection)

````

---

## 📤 Request Format

**Content-Type:** `multipart/form-data`

### Form Fields

| Field Name   | Type  | Description |
|-------------|------|-------------|
| language    | Text | Tamil / English / Hindi / Malayalam / Telugu |
| audioFormat | Text | Must be `mp3` |
| audio       | File | MP3 voice recording |

---

## 🧪 Example cURL Request

```bash
curl -X POST https://your-render-domain.com/api/voice-detection \
  -H "x-api-key: sk_test_123456789" \
  -F "language=Hindi" \
  -F "audioFormat=mp3" \
  -F "audio=@sample.mp3"
````

---

## ✅ Success Response

```json
{
  "status": "success",
  "language": "Hindi",
  "classification": "HUMAN",
  "confidenceScore": 0.78,
  "explanation": "Natural pitch variation and irregular energy patterns detected"
}
```

---

## 📘 Response Fields

| Field           | Description                               |
| --------------- | ----------------------------------------- |
| status          | success or error                          |
| language        | Language provided in the request          |
| classification  | AI_GENERATED or HUMAN                     |
| confidenceScore | Value between 0.0 and 1.0                 |
| explanation     | Short technical reason for classification |

---

## ❌ Error Response Example

```json
{
  "status": "error",
  "message": "Invalid API key or malformed request"
}
```

---

## ⚙️ How Detection Works

The system analyzes multiple acoustic features, including:

* Pitch variation
* Energy variance
* Waveform smoothness
* Zero Crossing Rate (ZCR)

AI-generated voices often exhibit smoother and more consistent patterns, while human speech typically contains natural fluctuations and variability.

---

## 📌 Notes for Testing

* Use clear voice recordings for best accuracy
* Avoid heavy background noise
* Only MP3 files are supported
* Send one audio file per request

---

## 🏁 Summary

Upload an MP3 voice sample and receive a classification indicating whether the voice is **AI-generated** or **human**, along with a confidence score and explanation.

```
```
