'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { geminiClient } = require('../config/gemini');

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

router.get('/', requireAuth, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }
    const client = geminiClient();
    const { models } = await client.listModels();
    // Keep only text capable and methods supported
    const filtered = models
      .filter((m) => (m.name || '').includes('gemini'))
      .map((m) => ({
        name: m.name.replace('models/', ''),
        inputTokenLimit: m.inputTokenLimit,
        outputTokenLimit: m.outputTokenLimit,
        description: m.description,
        supportedMethods: m.supportedGenerationMethods
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(filtered);
  } catch (err) {
    console.error('List models failed:', err);
    const payload = process.env.NODE_ENV === 'production' ? { error: 'Failed to list models' } : { error: 'Failed to list models', detail: String(err.message || err) };
    res.status(500).json(payload);
  }
});

module.exports = router;


