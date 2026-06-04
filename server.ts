import express from "express";
import { Camoufox } from "camoufox";
import "dotenv/config";
import { sendTelegramAlert } from "./helpers/telegram.helper";

const app = express();
const PORT = process.env.PORT || 8080;
const URL_ENV =
  process.env.TARGET_URL || "https://www.justeat.it/en/courier/form?city=padua";
const INTERVAL = Number(process.env.CHECK_INTERVAL_MS) || 300000;
const TARGET_VEHICLES = (process.env.TARGET_VEHICLES || "Driver Bike,Company Bike,Driver E-Bike,Company E-Bike")
  .split(",")
  .map((vehicle) => vehicle.trim())
  .filter(Boolean);

function extractAssignedObject(html: string, variableName: string): any | null {
  const marker = `window.${variableName} = `;
  const markerIndex = html.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const objectStart = html.indexOf("{", markerIndex);
  if (objectStart === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let stringDelimiter = "";
  let escaped = false;

  for (let index = objectStart; index < html.length; index += 1) {
    const character = html[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === stringDelimiter) {
        inString = false;
      }

      continue;
    }

    if (character === '"' || character === "'") {
      inString = true;
      stringDelimiter = character;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        const objectLiteral = html.slice(objectStart, index + 1);

        try {
          return new Function(`return (${objectLiteral});`)();
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

async function checkJobPostings(): Promise<void> {
  let browser;
  try {
    console.log(
      `[${new Date().toLocaleTimeString()}] Launching stealth browser to check: ${URL_ENV}`,
    );

    // 1. Extract the expected city slug from the target parameter (e.g., "padua")
    const parsedUrl = new URL(URL_ENV);
    const targetCitySlug = parsedUrl.searchParams
      .get("city")
      ?.toLowerCase()
      .trim();

    if (!targetCitySlug) {
      console.error(
        "❌ Target URL does not contain a valid '?city=' query parameter.",
      );
      return;
    }

    // 2. CRITICAL FIX: Enable main_world_eval to allow access to page-level globals
    browser = await Camoufox({
      headless: true,
      main_world_eval: true,
    });
    const page = await browser.newPage();

    // Wait until network activity settles to let scripts hydrate
    await page.goto(URL_ENV, { waitUntil: "networkidle" });

    const html = await page.content();

    // Close the browser session early to free memory
    await browser.close();

    const country = extractAssignedObject(html, "country");
    const language = extractAssignedObject(html, "language");

    if (!country && !language) {
      console.warn(
        "⚠️ Failed to communicate with the browser's main window context.",
      );
      return;
    }

    // Safely choose the object that actually contains the city-specific data.
    const activeDataPool = [country, language].find(
      (pool: any) => pool && Array.isArray(pool.city_options),
    );

    if (!activeDataPool || !activeDataPool.city_options) {
      console.warn(
        "⚠️ 'window.country' and 'window.language' are unpopulated. Check if the selector context has changed.",
      );
      return;
    }

    // 4. Locate target layout configuration map
    const targetCityProfile = activeDataPool.city_options.find(
      (city: any) => city.slug?.toLowerCase().trim() === targetCitySlug,
    );

    if (!targetCityProfile) {
      console.warn(
        `⚠️ Could not locate city metadata configuration options matching "${targetCitySlug}".`,
      );
      return;
    }

    console.log(
      `🔍 Synchronized data signature profile for: ${targetCityProfile.name}`,
    );

    // 5. Evaluation branch: Detect if applicant loops are open or initialized
    if (
      !targetCityProfile.job_postings ||
      targetCityProfile.job_postings.length === 0
    ) {
      console.log(
        `🔒 Check complete for ${targetCityProfile.name}: Applications are fully CLOSED for all vehicles.`,
      );
      return;
    }

    const jobPostingsBlock = targetCityProfile.job_postings.find(
      (block: any) => block.layout === "job_posting_0",
    );
    const postingsArray = jobPostingsBlock?.attributes?.postings;

    if (!postingsArray || !Array.isArray(postingsArray)) {
      console.log(
        `🔒 Check complete for ${targetCityProfile.name}: No recruitment criteria open right now.`,
      );
      return;
    }

    // 6. Cross-reference available positions against the target vehicles
    const matchedVehicles: string[] = [];

    postingsArray.forEach((posting: any, index: number) => {
      const option2 = posting.attributes?.option_2;

      if (
        option2 &&
        TARGET_VEHICLES.some((targetVehicle) =>
          option2.toLowerCase().includes(targetVehicle.toLowerCase()),
        )
      ) {
        matchedVehicles.push(`Post ${index + 1}: Found "${option2}"`);
      }
    });

    // 7. Fire notifications when target vehicles appear
    if (matchedVehicles.length > 0) {
      const alertMessage = `🚨 *JustEat Update Required for ${targetCityProfile.name}!*\n\nTarget vehicle(s) matched (${TARGET_VEHICLES.join(", ")}):\n${matchedVehicles.map((v) => `• ${v}`).join("\n")}`;
      console.warn(
        `🚨 Target vehicle(s) detected for ${targetCityProfile.name}! Routing Telegram broadcast...`,
      );
      await sendTelegramAlert(alertMessage);
    } else {
      console.log(
        `✅ Check complete for ${targetCityProfile.name}: No target vehicles found (${TARGET_VEHICLES.join(", ")}).`,
      );
    }
  } catch (error) {
    console.error("❌ Stealth scrape loop failed:", error);
    if (browser) await browser.close();
  }
}

app.get("/", (req, res) => {
  res.send({
    status: "Main-World Monitoring Loop Active",
    tracking: URL_ENV,
    interval_ms: INTERVAL,
    target_vehicles: TARGET_VEHICLES,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper Server listening on http://localhost:${PORT}`);
  checkJobPostings();
  setInterval(checkJobPostings, INTERVAL);
});
