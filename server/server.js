// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.use(express.static(publicDir));

app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

app.post("/api/chat", async (req, res) => {
  try {
    const { session_id, message, history = [] } = req.body ?? {};
    if (!OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    if (!message) return res.status(400).json({ error: "message required" });

    const messages = [
      { role: "system", content: "You are ApnaBot, a helpful Hinglish assistant for Indian SMBs. Be concise and practical." },
      ...history.filter(m => m.role === "system" || m.role === "user" || m.role === "assistant"),
      { role: "user", content: message }
    ].slice(-24);

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.3, max_tokens: 600 })
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("OpenAI error:", r.status, text);
      return res.status(502).json({ error: "LLM upstream error" });
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? "(no reply)";
    res.json({ reply, usage: data.usage ?? null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ ApnaBot server running at http://localhost:${PORT}`);
});
