require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { connectDB } = require("./db");
const { handleMessage, handleCallbackQuery } = require("./conversationController");

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN is not set in environment variables.");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

async function bootstrap() {
  await connectDB();

  try {
    await bot.getMe();
  } catch (err) {
    console.error("❌ Invalid TELEGRAM_BOT_TOKEN. Please update it in .env.");
    process.exit(1);
  }

  // Handle plain text messages
  bot.on("message", async (msg) => {
    const chatId = String(msg.chat.id);
    const text = msg.text || "";
    if (text) await handleMessage(bot, chatId, text);
  });

  // Handle inline button clicks
  bot.on("callback_query", async (query) => {
    const chatId = String(query.message.chat.id);
    const data = query.data || "";
    await bot.answerCallbackQuery(query.id); // dismiss loading spinner
    await handleCallbackQuery(bot, chatId, data);
  });

  bot.on("polling_error", (err) => {
    console.error("Polling error:", err.message);
  });

  await bot.startPolling();
  console.log("🤖 Telegram Resume Bot is running...");
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start bot:", err.message);
  process.exit(1);
});
