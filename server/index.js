// index.js (ESM)
import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Push a simple demo message (Sandbox requires prior opt-in via join code)
app.post('/api/wa-demo', async (req, res) => {
  try {
    const { to, flow } = req.body; // e.g. "9198XXXXXXXX", "order|reminder|review"
    if (!/^\d{10,15}$/.test(to || '')) return res.status(400).json({ error: 'Invalid number' });

    const msg = await client.messages.create({
      from: 'whatsapp:+14155238886',           // Twilio Sandbox sender; replace in prod
      to: `whatsapp:+${to}`,
      body: `ApnaBot demo: ${flow || 'order'} ✅\nReply with your query to continue.`
    });

    res.json({ ok: true, sid: msg.sid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Inbound webhook → GPT reply (inside 24h session)
app.post('/twilio/inbound', async (req, res) => {
  try {
    const from = req.body.From;          // "whatsapp:+91..."
    const text = req.body.Body || '';
    if (!from) return res.sendStatus(200);

    // Use native fetch (Node 22+) to call OpenAI
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 250,
        messages: [
          { role: 'system', content: 'You are ApnaBot for Indian SMBs. Be concise. Hindi/Hinglish ok.' },
          { role: 'user', content: text }
        ]
      })
    });
    const j = await r.json();
    const reply = j?.choices?.[0]?.message?.content?.trim() || 'Thanks!';

    await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: from,
      body: reply
    });
  } catch (e) {
    // log error if needed
  }
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3001, () => {
  console.log('Twilio WA server running on', process.env.PORT || 3001);
});
