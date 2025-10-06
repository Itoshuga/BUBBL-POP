const mongoose = require('mongoose');


const quoteSchema = new mongoose.Schema({
guildId: { type: String, required: true },
userId: { type: String, required: true },
username: { type: String },
quote: { type: String, required: true },
createdAt: { type: Date, default: () => new Date() },
messageId: { type: String }
});


module.exports = mongoose.model('Quote', quoteSchema);