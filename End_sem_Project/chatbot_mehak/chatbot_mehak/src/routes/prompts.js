'use strict';

const express = require('express');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const Prompt = require('../models/Prompt');

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

const upsertSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isGlobal: z.boolean().optional()
});

router.get('/', requireAuth, async (req, res) => {
  const prompts = await Prompt.find({ $or: [{ userId: req.user.id }, { isGlobal: true }] }).sort({ updatedAt: -1 });
  res.json(prompts);
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const data = upsertSchema.parse(req.body);
    const prompt = await Prompt.create({ ...data, userId: req.user.id });
    res.status(201).json(prompt);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const data = upsertSchema.parse(req.body);
    const updated = await Prompt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: data },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const removed = await Prompt.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;


