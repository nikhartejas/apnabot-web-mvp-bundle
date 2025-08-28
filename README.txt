# ApnaBot Full Deploy Bundle

This bundle contains:
- `server/` — Express backend exposing `/api/chat` proxy to OpenAI
- `public/` — your homepage `index.html` (fixed GPT demo)

## Run locally
```bash
cd server
cp .env.example .env   # put your OPENAI_API_KEY
npm install
npm start
```
Open http://localhost:3000

## Deploy to Render
- Create a Web Service from this folder.
- Build Command: `cd server && npm install`
- Start Command: `node server/server.js`
- Add env var `OPENAI_API_KEY` in the dashboard.

