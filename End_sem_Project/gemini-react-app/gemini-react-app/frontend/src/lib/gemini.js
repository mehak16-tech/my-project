import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

function assertApiKeyPresent() {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    throw new Error(
      "Missing VITE_GEMINI_API_KEY. Add it to your .env file and restart the dev server."
    );
  }
}

function getPreferredModelCandidates() {
  const envModel = import.meta.env.VITE_GEMINI_MODEL;
  const candidates = [];
  if (envModel && typeof envModel === "string" && envModel.trim()) {
    candidates.push(envModel.trim());
  }
  // Safer defaults ordered by likely availability
  candidates.push(
    // Free-tier friendly options first
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash",
    // Pro variants may require billing/access
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro"
  );
  return candidates;
}
let resolvedModelId = null;
let resolvingPromise = null;

async function listAvailableModels() {
  const url = `${MODELS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to list models (${res.status})`);
  }
  const data = await res.json();
  const models = Array.isArray(data.models) ? data.models : [];
  // Map to { id: 'gemini-1.5-flash', methods: [...] }
  return models.map((m) => {
    const name = typeof m.name === "string" ? m.name : ""; // e.g., "models/gemini-1.5-flash"
    const id = name.startsWith("models/") ? name.slice("models/".length) : name;
    const methods = Array.isArray(m.supportedGenerationMethods)
      ? m.supportedGenerationMethods
      : [];
    return { id, methods };
  });
}

function pickBestModelId(available) {
  if (!available || available.length === 0) return null;
  const supports = new Set(["generateContent", "generateContentStream"]);
  const usable = available.filter((m) => m.methods.some((x) => supports.has(x)));
  if (usable.length === 0) return null;

  const prefs = getPreferredModelCandidates();
  for (const pref of prefs) {
    const found = usable.find((m) => m.id === pref);
    if (found) return found.id;
  }
  // Fallback: prefer any flash-like model, else first usable
  const flash = usable.find((m) => m.id.includes("flash"));
  return (flash && flash.id) || usable[0].id;
}

export async function getGeminiModel(modelName) {
  assertApiKeyPresent();
  if (modelName) {
    const client = new GoogleGenerativeAI(apiKey);
    return client.getGenerativeModel({ model: modelName });
  }
  if (resolvedModelId) {
    const client = new GoogleGenerativeAI(apiKey);
    return client.getGenerativeModel({ model: resolvedModelId });
  }
  if (!resolvingPromise) {
    resolvingPromise = (async () => {
      const models = await listAvailableModels();
      const chosen = pickBestModelId(models);
      if (!chosen) {
        throw new Error("No compatible Gemini model available for your key.");
      }
      resolvedModelId = chosen;
      return chosen;
    })();
  }
  const id = await resolvingPromise;
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: id });
}

export async function sendChatWithHistory(messages) {
  const model = await getGeminiModel();

  // Ensure the first history item sent to Gemini is a user turn.
  // Drop any leading model messages (e.g., local greetings) before the first user message.
  const trimmed = [];
  for (const m of messages) {
    if (trimmed.length === 0 && m.role !== "user") continue;
    trimmed.push(m);
  }

  const userLast = trimmed[trimmed.length - 1];
  if (!userLast || userLast.role !== "user") {
    throw new Error("Last message must be a user message.");
  }

  const history = trimmed.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const chat = model.startChat({ history });

  const result = await chat.sendMessage(userLast.text);
  const response = await result.response;
  const text = response.text();

  return { text };
}


