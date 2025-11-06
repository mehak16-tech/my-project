const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4001";
const STATIC_TOKEN = import.meta.env.VITE_STATIC_TOKEN || "";

function getToken() {
  try {
    const saved = localStorage.getItem("token");
    if (saved && saved.trim()) return saved;
    if (STATIC_TOKEN && typeof STATIC_TOKEN === "string" && STATIC_TOKEN.trim()) {
      return STATIC_TOKEN.trim();
    }
    return "";
  } catch {
    return "";
  }
}

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function handle(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  base: API_BASE,
  // Health
  async health() {
    const res = await fetch(`${API_BASE}/health`);
    return handle(res);
  },
  // Prompts
  async listPrompts() {
    const res = await fetch(`${API_BASE}/api/prompts`, {
      headers: authHeaders(),
    });
    return handle(res);
  },
  async createPrompt(body) {
    const res = await fetch(`${API_BASE}/api/prompts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle(res);
  },
  async updatePrompt(id, body) {
    const res = await fetch(`${API_BASE}/api/prompts/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle(res);
  },
  async deletePrompt(id) {
    const res = await fetch(`${API_BASE}/api/prompts/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle(res);
  },
  // Auth
  async register(body) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return handle(res);
  },
  async login(body) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return handle(res);
  },
  // Sessions
  async createSession(body) {
    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body || {}),
    });
    return handle(res);
  },
  async listSessions() {
    const res = await fetch(`${API_BASE}/api/sessions`, {
      headers: authHeaders(),
    });
    return handle(res);
  },
  async getSession(id) {
    const res = await fetch(`${API_BASE}/api/sessions/${id}`, {
      headers: authHeaders(),
    });
    return handle(res);
  },
  async patchSession(id, body) {
    const res = await fetch(`${API_BASE}/api/sessions/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body || {}),
    });
    return handle(res);
  },
  // Messages
  async listMessages(sessionId) {
    const res = await fetch(`${API_BASE}/api/messages/${sessionId}`, {
      headers: authHeaders(),
    });
    return handle(res);
  },
  async sendMessage({ sessionId, content, system }) {
    const res = await fetch(`${API_BASE}/api/messages/send`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ sessionId, content, system }),
    });
    return handle(res);
  },
};

export function storeToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}


