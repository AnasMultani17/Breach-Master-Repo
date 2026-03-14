/**
 * In-memory session store keyed by Telegram chat ID.
 * For production, replace with Redis.
 */

const sessions = {};

function getSession(chatId) {
  if (!sessions[chatId]) {
    sessions[chatId] = {
      step: "ASK_NAME",
      data: {
        experience: [],
        education: [],
        skills: [],
        originalResumeUrls: [],
      },
      tempBuffer: {},
    };
  }
  return sessions[chatId];
}

function setSession(chatId, updates) {
  sessions[chatId] = { ...sessions[chatId], ...updates };
}

function clearSession(chatId) {
  delete sessions[chatId];
}

module.exports = { getSession, setSession, clearSession };
