import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/health", (req, res) => {
  res.json({ ok: true, name: "brbrs Gold AI", model: MODEL });
});

app.post("/chat", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ reply: "GEMINI_API_KEY yok kanka. Render Environment kısmına ekle." });
    }

    const userMessage = String(req.body.message || "").trim();
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-12) : [];
    if (!userMessage) return res.json({ reply: "Bir şey yaz kanka." });

    const promptText = [
      "Sen brbrs Gold AI'sın. Türkçe konuş. Kanka tarzında samimi, net ve akıllı cevap ver. Gereksiz uzatma. Kod sorularında dosya adı ve adım ver. Kötüyse kötü de.",
      "",
      "Önceki konuşma:",
      ...history.map((m) => `${m.role === "assistant" ? "Asistan" : "Kullanıcı"}: ${String(m.content || "")}`),
      "",
      `Kullanıcı: ${userMessage}`
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.75, maxOutputTokens: 900 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(response.status).json({ reply: data?.error?.message || "Gemini hata verdi kanka." });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "Cevap gelmedi kanka.";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: err?.message || "Bilinmeyen hata oldu kanka." });
  }
});

app.use((req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(PORT, () => console.log(`brbrs Gold AI çalışıyor: http://localhost:${PORT}`));
