'use strict';

const mongoose = require('mongoose');

async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatbot_mehak';
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    autoIndex: true
  });
  console.log('Connected to MongoDB');
}

module.exports = { connectMongo };
