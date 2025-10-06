// /utils/mongo.js
const mongoose = require('mongoose');

let ready = false;

async function connect() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGO_URI not set in .env — skipping MongoDB connection');
    return;
  }
  await mongoose.connect(uri, { /* options */ });
  ready = true;
  console.log('Connected to MongoDB');
}

function isReady() {
  return ready && mongoose.connection?.readyState === 1;
}

function getMongoose() {
  // renvoie l’instance mongoose utilisée par l’app (ou null si non connectée)
  return isReady() ? mongoose : null;
}

async function ping() {
  if (!isReady()) throw new Error('Mongo non connecté');
  const res = await mongoose.connection.db.command({ ping: 1 });
  return res?.ok === 1;
}

module.exports = { connect, isReady, getMongoose, ping };
