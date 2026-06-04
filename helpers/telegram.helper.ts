import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS } from '../config';

/**
 * Sends a notification directly to your Telegram chat
 */
export async function sendTelegramAlert(message: string): Promise<void> {
  const token = TELEGRAM_BOT_TOKEN;
  const chatIds = TELEGRAM_CHAT_IDS;

  if (!token || chatIds.length === 0) {
    console.warn(
      "⚠️ Telegram credentials missing in env file. Skipping alert.",
    );
    return;
  }

  const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    for (const chatId of chatIds) {
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown", // Allows you to use *bold*, _italics_, etc.
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Telegram API Error for chat ${chatId}:`, errorData);
      } else {
        console.log(`🚀 Notification pushed successfully to Telegram chat ${chatId}!`);
      }
    }
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error);
  }
}
