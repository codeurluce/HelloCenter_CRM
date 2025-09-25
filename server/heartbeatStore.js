// heartbeatStore.js
const lastPing = new Map();

module.exports = {
  set: (userId, timestamp) => {
    lastPing.set(userId, timestamp);
  },
  get: (userId) => {
    return lastPing.get(userId);
  },
  delete: (userId) => {
    lastPing.delete(userId);
  },
  getAllUserIds: () => {
    return Array.from(lastPing.keys());
  }
};