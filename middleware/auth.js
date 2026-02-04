// middleware/auth.js
export const verifyApiKey = (req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.VOICE_API_KEY) {
    return res.status(401).json({
      status: "error",
      message: "Invalid API key or malformed request"
    });
  }
  next();
};
