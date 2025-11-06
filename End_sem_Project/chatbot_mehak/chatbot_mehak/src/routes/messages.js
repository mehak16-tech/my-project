'use strict';

const express = require('express');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const Message = require('../models/Message');
const { geminiClient, getModelName, normalizeModelName, resolvePreferredModel } = require('../config/gemini');

const router = express.Router();

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const secret = process.env.JWT_SECRET || 'dev_secret';
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

const sendSchema = z.object({
  sessionId: z.string(),
  content: z.string().min(1),
  system: z.string().optional()
});

router.get('/:sessionId', requireAuth, async (req, res) => {
  const { sessionId } = req.params;
  const session = await Session.findOne({ _id: sessionId, userId: req.user.id });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
  res.json(messages);
});

router.post('/send', requireAuth, async (req, res) => {
  const t0 = Date.now();
  try {
    const { sessionId, content, system } = sendSchema.parse(req.body);
    const session = await Session.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    const userMsg = await Message.create({
      sessionId: session._id,
      userId: req.user.id,
      role: 'user',
      content
    });

    const genAI = geminiClient();
    const modelName = normalizeModelName(session.model) || getModelName();

    const prior = await Message.find({ sessionId: session._id }).sort({ createdAt: 1 });
    const chatHistory = prior.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    async function trySendWithModel(name) {
      const model = genAI.getGenerativeModel(
        system ? { model: name, systemInstruction: system } : { model: name }
      );
      const chat = model.startChat({ history: chatHistory });
      const response = await chat.sendMessage(content);
      return response?.response?.text() || '';
    }

    let text;
    const candidates = Array.from(new Set([
      modelName,
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash'
    ]));

    let lastErr;
    for (const candidate of candidates) {
      try {
        text = await trySendWithModel(candidate);
        if (text) break;
      } catch (e) {
        lastErr = e;
        // Continue on 404/unsupported
        if (!(e && (e.status === 404 || String(e.message || e).includes('Not Found')))) {
          break;
        }
      }
    }
    if (!text) {
      // Final attempt: discover a supported model for this key and try once
      const discovered = await resolvePreferredModel();
      try {
        text = await trySendWithModel(discovered);
      } catch (e) {
        lastErr = e;
      }
    }
    if (!text) throw lastErr || new Error('No response from model');
    const latencyMs = Date.now() - t0;

    const assistantMsg = await Message.create({
      sessionId: session._id,
      role: 'assistant',
      content: text,
      latencyMs
    });

    await Session.updateOne({ _id: session._id }, { $set: { updatedAt: new Date() } });

    res.json({ user: userMsg, assistant: assistantMsg });
  } catch (err) {
    const latencyMs = Date.now() - t0;
    console.error('Send message failed:', err);
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    try {
      if (req.body && req.body.sessionId) {
        await Message.create({ sessionId: req.body.sessionId, role: 'assistant', content: 'Sorry, something went wrong.', error: err.message, latencyMs });
      }
    } catch (_) {}
    const payload = process.env.NODE_ENV === 'production' ? { error: 'Failed to send message' } : { error: 'Failed to send message', detail: String(err.message || err) };
    res.status(500).json(payload);
  }
});

module.exports = router;


