'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const { connectMongo } = require('./src/config/db');
const { geminiClient, getModelName } = require('./src/config/gemini');

// Routes
const authRoutes = require('./src/routes/auth');
const sessionRoutes = require('./src/routes/sessions');
const promptRoutes = require('./src/routes/prompts');
const messageRoutes = require('./src/routes/messages');
const modelRoutes = require('./src/routes/models');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'chatbot_mehak_backend', model: getModelName() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/models', modelRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start
const PORT = process.env.PORT || 4001;
connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

module.exports = app;


