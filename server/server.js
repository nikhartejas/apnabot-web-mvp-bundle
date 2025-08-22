// server.js (ESM)
import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Simple landing + health endpoints
app.get('/', (req, res) => {
  res.type('text').send('ApnaBot WhatsApp API is running ✅');
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});


// If your website runs from a different origin, uncomment CORS below
// import cors from 'cors'; app.use(cors());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// POST /api/wa-demo  -> send a WhatsApp demo message (Sandbox requires prior "join <code>")
app.post('/api/wa-demo', async (req, res) => {
  try {
    const { to, flow } = req.body;                 // to like "9198XXXXXXXX", flow: "order|reminder|review|billing"
    if (!/^\d{10,15}$/.test(to || '')) return res.status(400).json({ error: 'Invalid number' });

    const msg = await client.messages.create({
      from: 'whatsapp:+14155238886',               // Twilio Sandbox sender; replace with your WA number in prod
      to: `whatsapp:+${to}`,
      body: `ApnaBot demo: ${flow || 'order'} ✅\nReply with your query to continue.`
    });
    res.json({ ok: true, sid: msg.sid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Twilio inbound webhook -> call GPT and reply (within 24h session)
app.post('/twilio/inbound', async (req, res) => {
  try {
    const from = req.body.From;                    // "whatsapp:+91..."
    const text = req.body.Body || '';
    if (!from) return res.sendStatus(200);

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 250,
        messages: [
          { role: 'system', content: 'You are ApnaBot for Indian SMBs. Be concise. Hindi/Hinglish OK.' },
          { role: 'user', content: text }
        ]
      })
    });
    const j = await r.json();
    const reply = j?.choices?.[0]?.message?.content?.trim() || 'Thanks!';

    await client.messages.create({ from: 'whatsapp:+14155238886', to: from, body: reply });
    // after client.messages.create(...)
return res.status(204).end();   // No Content (no "OK")

  } catch (e) {
    // log if needed
  }
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3001, () => {
  console.log('Twilio WA server running on', process.env.PORT || 3001);
});
