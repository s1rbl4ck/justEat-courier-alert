/**
 * Sends a notification directly to your Telegram chat
 */
export async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "⚠️ Telegram credentials missing in env file. Skipping alert.",
    );
    return;
  }

  const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
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
      console.error("❌ Telegram API Error:", errorData);
    } else {
      console.log("🚀 Notification pushed successfully to Telegram!");
    }
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error);
  }
}
