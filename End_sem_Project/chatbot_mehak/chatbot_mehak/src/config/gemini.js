'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

function geminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

function normalizeModelName(name) {
  if (!name) return 'gemini-1.5-flash-8b-latest';
  if (name === 'gemini-1.5-flash') return 'gemini-1.5-flash-latest';
  if (name === 'gemini-1.5-pro') return 'gemini-1.5-pro-latest';
  if (name === 'gemini-pro') return 'gemini-1.5-pro-latest';
  if (name === 'gemini-1.5-flash-8b') return 'gemini-1.5-flash-8b-latest';
  return name;
}

function getModelName() {
  return normalizeModelName(process.env.GEMINI_MODEL || 'gemini-1.5-flash-8b-latest');
}

module.exports = { geminiClient, getModelName, normalizeModelName };
/**
 * Model discovery helpers
 */
async function listAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to list models (${res.status} ${res.statusText})`);
  }
  const data = await res.json();
  const models = Array.isArray(data.models) ? data.models : [];
  return models.map((m) => ({
    id: (m.name || '').replace('models/', ''),
    methods: Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : []
  }));
}

function getPreferredCandidates(envModel) {
  const candidates = [];
  if (envModel && typeof envModel === 'string' && envModel.trim()) {
    candidates.push(envModel.trim());
  }
  candidates.push(
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro'
  );
  return Array.from(new Set(candidates));
}

function pickBestModelId(available, preferredList) {
  if (!available || available.length === 0) return null;
  const supports = new Set(['generateContent', 'generateContentStream']);
  const usable = available.filter((m) => m.methods.some((x) => supports.has(x)));
  if (usable.length === 0) return null;
  for (const pref of preferredList) {
    const found = usable.find((m) => m.id === pref);
    if (found) return found.id;
  }
  const flash = usable.find((m) => m.id.includes('flash'));
  return (flash && flash.id) || usable[0].id;
}

let cachedResolvedModel;
async function resolvePreferredModel() {
  if (cachedResolvedModel) return cachedResolvedModel;
  const preferred = getPreferredCandidates(process.env.GEMINI_MODEL);
  const models = await listAvailableModels();
  const chosen = pickBestModelId(models, preferred);
  if (!chosen) throw new Error('No compatible Gemini model available for this key');
  cachedResolvedModel = chosen;
  return chosen;
}

module.exports.listAvailableModels = listAvailableModels;
module.exports.resolvePreferredModel = resolvePreferredModel;


