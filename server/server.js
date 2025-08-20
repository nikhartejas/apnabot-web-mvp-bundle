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

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const sessions = new Map();

app.post("/api/chat", async (req, res) => {
  try {
    const { session_id, message, history = [] } = req.body ?? {};
    if (!message) return res.status(400).json({ error: "message required" });

    const prev = sessions.get(session_id) || [];
    const merged = [
      { role: "system", content: "You are ApnaBot, a helpful Hinglish assistant for Indian SMBs. Be concise and practical. If unsure, say so." },
      ...prev.filter((m) => m.role !== "system"),
      ...history.filter((m) => m.role === "user" || m.role === "assistant"),
      { role: "user", content: message },
    ].slice(-20);

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: merged,
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error("OpenAI error:", err);
      return res.status(502).json({ error: "LLM upstream error" });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? "(no reply)";

    const next = [...merged, { role: "assistant", content: reply }];
    if (session_id) sessions.set(session_id, next.slice(-20));

    res.json({ reply, usage: data.usage ?? null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ ApnaBot server running at http://localhost:${PORT}`);
  console.log(`➡️  Open http://localhost:${PORT} in your browser`);
});
