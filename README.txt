# ApnaBot Web MVP Bundle

This bundle includes:
- server/ (Express API proxy to OpenAI)
- public/index.html (homepage with **Live Demos** section: Flow • GPT • Lead+FAQ)
- public/apnabot-widget.js (floating widget)
- public/apnabot-inline.js (inline chat)
- public/embedded-templates.html (standalone 3-templates page)

## Run locally
```
cd server
copy .env.example .env   # put your OPENAI_API_KEY here
npm install
npm start
```
Open http://localhost:3000/

- Homepage (with live demos): `/`
- Standalone 3-templates page: `/embedded-templates.html`

## Notes
- Requires Node 18+.
- Change model in `.env`: `OPENAI_MODEL=gpt-4o-mini`.
