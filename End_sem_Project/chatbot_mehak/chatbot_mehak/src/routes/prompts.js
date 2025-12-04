'use strict';

const express = require('express');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const Prompt = require('../models/Prompt');

const router = express.Router();

/**
 * 1) Admin emails list – set in .env as:
 *    ADMIN_EMAILS=you@gmail.com,otheradmin@example.com
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase());
}

/**
 * 2) Auth middleware – also adds req.user.isAdmin
 */
function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const secret = process.env.JWT_SECRET || 'dev_secret';

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = jwt.verify(token, secret);

    req.user = {
      id: payload.sub,
      email: payload.email,
      isAdmin: isAdminEmail(payload.email),
    };

    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * 3) Validation for creating/updating prompts
 */
const upsertSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isGlobal: z.boolean().optional(),
});

/**
 * 4) List prompts:
 *    - always include this user's prompts
 *    - plus all global prompts
 */
router.get('/', requireAuth, async (req, res) => {
  const prompts = await Prompt.find({
    $or: [{ userId: req.user.id }, { isGlobal: true }],
  }).sort({ updatedAt: -1 });

  res.json(prompts);
});

/**
 * 5) Create prompt:
 *    - normal user can create only personal (isGlobal=false)
 *    - only admin can create isGlobal=true
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = upsertSchema.parse(req.body);

    if (data.isGlobal && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ error: 'Only admin can create global prompts' });
    }

    const prompt = await Prompt.create({
      ...data,
      userId: req.user.id,
    });

    res.status(201).json(prompt);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

/**
 * 6) Update prompt:
 *    - only owner can update (userId filter)
 *    - only admin can set/keep isGlobal=true
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const data = upsertSchema.parse(req.body);

    if (data.isGlobal && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ error: 'Only admin can modify global prompts' });
    }

    const updated = await Prompt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: data },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

/**
 * 7) Delete prompt:
 *    - only owner can delete (userId filter)
 *    - users cannot delete admin’s global prompts
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const removed = await Prompt.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!removed) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json({ ok: true });
});

module.exports = router;
