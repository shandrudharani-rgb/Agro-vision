const Notification = require('../models/Notification');

async function createNotification({ user, type = 'system', title, message, link, relatedId }) {
  try {
    return await Notification.create({ user, type, title, message, link, relatedId });
  } catch (err) {
    // Notifications are a nice-to-have; never let a notification failure
    // break the calling feature (e.g. pest risk generation).
    console.error('Failed to create notification (non-fatal):', err.message);
    return null;
  }
}

module.exports = { createNotification };
