// /models/CoinFlip.js
const mongoose = require('mongoose');

const CoinFlipSchema = new mongoose.Schema(
  {
    result: { type: String, enum: ['pile', 'face'], required: true, index: true },
    userId: { type: String, index: true },
    guildId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.CoinFlip || mongoose.model('CoinFlip', CoinFlipSchema);
