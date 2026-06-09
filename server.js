import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

app.get("/health", (req, res) => {
  res.json({ ok: true, model: MODEL });
});

app.post("/chat", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        reply: "GROQ_API_KEY yok kanka. Render Environment kısmına ekle."
      });
    }

    const userMessage = String(req.body.message || "").trim();
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-12) : [];

    if (!userMessage) {
      return res.json({ reply: "Bir şey yaz kanka." });
    }

    const messages = [
      {
        role: "system",
        content:
          "Sen brbrs Gold AI'sın. Türkçe konuş. Kanka tarzında samimi ama zeki cevap ver. Gereksiz uzatma. Kod sorularında net dosya adı ve adım ver. Kötüyse kötü de. Cevapların kaliteli, mantıklı ve anlaşılır olsun."
      },
      ...history.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || m.text || "")
      })),
      {
        role: "user",
        content: userMessage
      }
    ];

    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.65,
      max_tokens: 1000
    });

    const reply =
      response.choices?.[0]?.message?.content ||
      "Cevap gelmedi kanka.";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: err?.message || "Groq hata verdi kanka."
    });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`brbrs Gold AI çalışıyor: http://localhost:${PORT}`);
});
