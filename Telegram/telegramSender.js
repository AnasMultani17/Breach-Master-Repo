/**
 * Telegram message sender utilities
 * Wraps node-telegram-bot-api for clean, reusable sending
 */

async function sendText(bot, chatId, text) {
  await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
}

async function sendButtons(bot, chatId, text, buttons) {
  /**
   * buttons = [
   *   { label: "Yes", data: "btn_yes" },
   *   { label: "No",  data: "btn_no"  }
   * ]
   * Rendered as a row of inline keyboard buttons
   */
  const keyboard = {
    inline_keyboard: [buttons.map((b) => ({ text: b.label, callback_data: b.data }))],
  };
  await bot.sendMessage(chatId, text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}

module.exports = { sendText, sendButtons };
