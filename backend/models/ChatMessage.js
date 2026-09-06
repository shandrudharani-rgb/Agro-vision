const mongoose = require('mongoose');

// A message belongs to exactly one authenticated farmer. Keeping this model
// separate from the controller makes the chat history reusable and testable.
const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: String, enum: ['user', 'bot'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 12000 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);
