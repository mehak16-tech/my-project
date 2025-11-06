'use strict';

const express = require('express');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const Message = require('../models/Message');
const { getModelName, normalizeModelName } = require('../config/gemini');

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

const createSchema = z.object({
  title: z.string().min(1).optional(),
  model: z.string().optional()
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, model } = createSchema.parse(req.body || {});
    const session = await Session.create({
      userId: req.user.id,
      title: title || 'New Chat',
      model: normalizeModelName(model) || getModelName()
    });
    res.status(201).json(session);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const sessions = await Session.find({ userId: req.user.id }).sort({ updatedAt: -1 });
  res.json(sessions);
});

router.get('/:id', requireAuth, async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, userId: req.user.id });
  if (!session) return res.status(404).json({ error: 'Not found' });
  const messages = await Message.find({ sessionId: session._id }).sort({ createdAt: 1 });
  res.json({ session, messages });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { title, status } = req.body || {};
  const updated = await Session.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: { ...(title ? { title } : {}), ...(status ? { status } : {}) } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

module.exports = router;


