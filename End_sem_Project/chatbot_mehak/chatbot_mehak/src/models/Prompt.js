'use strict';

const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    variables: [{ type: String }],
    isGlobal: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prompt', promptSchema);


