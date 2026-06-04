Just Eat Vehicle Checker

Lightweight scraper that monitors Just Eat recruitment pages and alerts via Telegram when configured vehicle types appear.

Quick start

1. Copy the .env.example to .env and fill your Telegram bot credentials and desired target vehicles.

   cp .env.example .env
   edit .env with your values

2. Install dependencies (using Bun or npm):

   bun install
   # or
   npm install

3. Run the server:

   bun run start
   # or
   npx tsx server.ts

Environment variables

- TARGET_URL — URL to monitor (must include ?city=slug)
- TARGET_VEHICLES — comma-separated list of vehicle labels to alert on (substring match)
- TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID — credentials to send Telegram alerts (single chat)
- TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_IDS — send alerts to multiple chats (comma-separated IDs)
- CHECK_INTERVAL_MS — polling interval in milliseconds

How it works

- Loads the target page in a stealth browser (Camoufox).
- Extracts the embedded window.country / window.language objects from the HTML if present.
- Finds the city block by slug and inspects job_postings for option_2 values.
- If any configured TARGET_VEHICLES substring matches an option_2, the app sends a Telegram alert.

Files

- server.ts — main process and scraping loop.
- helpers/telegram.helper.ts — Telegram notification helper.
- config.ts — centralized environment parsing.
- .env.example — example env variables.

Known vehicle labels

These are the vehicle labels that may appear in the Just Eat job postings and can be used in `TARGET_VEHICLES` (substring matching):

- Driver Bike
- Company Bike
- Driver E-Bike
- Company E-Bike
- Driver Scooter
- Company Scooter
- Driver E-Roller
- Driver Car / Kombi
- Company Car / Kombi
- Driver Buffer Vehicle

Debugging tips

- To inspect the page snapshot locally, open justeatpage.html (if you have one) and search for window.language / window.country.
- Increase CHECK_INTERVAL_MS to reduce requests while testing.
- Check the server logs for "Synchronized data signature profile for:" to confirm the city was located.

Next steps

- Add unit tests around extractAssignedObject and config parsing.
- Add exact-match mode vs substring matching for vehicle labels.
- Persist alerts/state to avoid duplicate notifications.
