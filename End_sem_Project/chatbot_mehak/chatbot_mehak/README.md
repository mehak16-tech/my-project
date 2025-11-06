# Chatbot Backend (Gemini + MongoDB)

Fast Express backend for a web chatbot powered by Gemini with MongoDB collections for users, sessions, messages, and prompts.

## Quickstart

1) Requirements
- Node 18+
- MongoDB running locally or in the cloud

2) Install
```bash
npm install
```

3) Environment
Create a `.env` in the project root:
```bash
PORT=4000
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/chatbot_mehak

# Auth
JWT_SECRET=change_this_in_production

# Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

4) Run
```bash
npm run dev
# or
npm start
```

## API Overview

Auth
- POST /api/auth/register { name, email, password }
- POST /api/auth/login { email, password }
  - Returns `{ user, token }` (use as `Authorization: Bearer <token>`)

Sessions
- POST /api/sessions { title?, model? }
- GET /api/sessions
- GET /api/sessions/:id (includes messages)
- PATCH /api/sessions/:id { title?, status? }

Messages
- GET /api/messages/:sessionId
- POST /api/messages/send { sessionId, content, system? }
  - Sends to Gemini and stores both user and assistant messages

Prompts
- GET /api/prompts
- POST /api/prompts { name, content, variables?, isGlobal? }
- PUT /api/prompts/:id
- DELETE /api/prompts/:id

## Data Models

Users
- name, email (unique), passwordHash, avatarUrl?, metadata?

Sessions
- userId (ref), title, model, status (active|ended), metadata?

Messages
- sessionId (ref), userId?, role (system|user|assistant), content, tokens?, latencyMs?, error?

Prompts
- userId (ref), name, content, variables[], isGlobal

## Notes
- Set `CORS_ORIGIN` to your frontend URL
- Default model is `gemini-1.5-flash` (override with `GEMINI_MODEL`)


