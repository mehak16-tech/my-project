# Gemini Chat (React + Vite)

Sexy, minimal chat UI powered by Google Gemini.

## Quick start

1) Install dependencies

```bash
cd frontend
npm i
```

2) Add your API key

Create a `.env` file in `frontend/` with:

```bash
VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
# Backend API base
VITE_API_BASE=http://localhost:4000
```

3) Run the app

```bash
npm run dev
```

Open the URL shown and start chatting.

## Notes

- The client uses `@google/generative-ai` and reads the key via `import.meta.env.VITE_GEMINI_API_KEY`.
- Default model is `gemini-1.5-flash` for speed. You can change it in `src/lib/gemini.js`.
