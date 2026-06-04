import 'dotenv/config';

export const PORT = Number(process.env.PORT) || 8080;
export const TARGET_URL =
  process.env.TARGET_URL || 'https://www.justeat.it/en/courier/form?city=padua';
export const INTERVAL_MS = Number(process.env.CHECK_INTERVAL_MS) || 300000;

export const TARGET_VEHICLES = (process.env.TARGET_VEHICLES || 'Driver Bike,Company Bike,Driver E-Bike,Company E-Bike,Driver Scooter,Company Scooter,Driver E-Roller,Driver Car / Kombi,Company Car / Kombi,Driver Buffer Vehicle')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Supports either TELEGRAM_CHAT_IDS (comma-separated) or single TELEGRAM_CHAT_ID.
export const TELEGRAM_CHAT_IDS = (
  process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || ''
)
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

// Backward-compatible single value (first ID if many are configured).
export const TELEGRAM_CHAT_ID = TELEGRAM_CHAT_IDS[0] || '';
