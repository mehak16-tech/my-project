'use strict';

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', index: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true },
    tokens: { type: Number },
    latencyMs: { type: Number },
    error: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);


