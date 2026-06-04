import { sendTelegramAlert } from '../helpers/telegram.helper';
import { extractAssignedObject } from '../lib/parser';
import { TARGET_URL, INTERVAL_MS, TARGET_VEHICLES } from '../config';
import { recordIteration } from './stats';

async function fetchHtmlWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching target page`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function checkJobPostings(): Promise<void> {
  try {
    console.log(
      `[${new Date().toLocaleTimeString()}] Fetching page HTML to check: ${TARGET_URL}`,
    );

    const parsedUrl = new URL(TARGET_URL);
    const targetCitySlug = parsedUrl.searchParams.get('city')?.toLowerCase().trim();

    if (!targetCitySlug) {
      const err = "Target URL does not contain a valid '?city=' query parameter.";
      console.error(`❌ ${err}`);
      recordIteration({ success: false, error: err });
      return;
    }

    const html = await fetchHtmlWithTimeout(TARGET_URL, 30000);

    const country = extractAssignedObject(html, 'country');
    const language = extractAssignedObject(html, 'language');

    if (!country && !language) {
      const err = "Failed to communicate with the browser's main window context.";
      console.warn(`⚠️ ${err}`);
      recordIteration({ success: false, error: err, city: targetCitySlug });
      return;
    }

    const activeDataPool = [country, language].find((pool: any) => pool && Array.isArray(pool.city_options));

    if (!activeDataPool || !activeDataPool.city_options) {
      const err = "'window.country' and 'window.language' are unpopulated. Check if the selector context has changed.";
      console.warn(`⚠️ ${err}`);
      recordIteration({ success: false, error: err, city: targetCitySlug });
      return;
    }

    const targetCityProfile = activeDataPool.city_options.find(
      (city: any) => city.slug?.toLowerCase().trim() === targetCitySlug,
    );

    if (!targetCityProfile) {
      const err = `Could not locate city metadata configuration options matching "${targetCitySlug}".`;
      console.warn(`⚠️ ${err}`);
      recordIteration({ success: false, error: err, city: targetCitySlug });
      return;
    }

    console.log(`🔍 Synchronized data signature profile for: ${targetCityProfile.name}`);

    if (!targetCityProfile.job_postings || targetCityProfile.job_postings.length === 0) {
      console.log(`🔒 Check complete for ${targetCityProfile.name}: Applications are fully CLOSED for all vehicles.`);
      recordIteration({ success: true, matchedCount: 0, city: targetCityProfile.name });
      return;
    }

    const jobPostingsBlock = targetCityProfile.job_postings.find((block: any) => block.layout === 'job_posting_0');
    const postingsArray = jobPostingsBlock?.attributes?.postings;

    if (!postingsArray || !Array.isArray(postingsArray)) {
      console.log(`🔒 Check complete for ${targetCityProfile.name}: No recruitment criteria open right now.`);
      recordIteration({ success: true, matchedCount: 0, city: targetCityProfile.name });
      return;
    }

    const matchedVehicles: string[] = [];

    postingsArray.forEach((posting: any, index: number) => {
      const option2 = posting.attributes?.option_2;

      if (
        option2 &&
        TARGET_VEHICLES.some((targetVehicle) => option2.toLowerCase().includes(targetVehicle.toLowerCase()))
      ) {
        matchedVehicles.push(`Post ${index + 1}: Found "${option2}"`);
      }
    });

    if (matchedVehicles.length > 0) {
      const allVehicles = postingsArray.map((p: any) => p.attributes?.option_2).filter(Boolean);
      const uniqueVehicles = Array.from(new Set(allVehicles));

      const matchedNames = matchedVehicles
        .map((entry) => {
          const m = entry.match(/Found "(.+)"/);
          return m ? m[1] : entry;
        })
        .filter(Boolean);

      const alertMessage = `🚨 *JustEat Update Required for ${targetCityProfile.name}!*\n\nWebsite vehicles: ${uniqueVehicles.join(', ') || '(none)'}\nTargeted vehicle: ${matchedNames.join(', ')}`;

      console.warn(`🚨 Target vehicle(s) detected for ${targetCityProfile.name}! Routing Telegram broadcast...`);
      await sendTelegramAlert(alertMessage);
      recordIteration({ success: true, matchedCount: matchedNames.length, city: targetCityProfile.name });
    } else {
      console.log(`✅ Check complete for ${targetCityProfile.name}: No target vehicles found (${TARGET_VEHICLES.join(', ')}).`);
      recordIteration({ success: true, matchedCount: 0, city: targetCityProfile.name });
    }
  } catch (error) {
    console.error('❌ Stealth scrape loop failed:', error);
    recordIteration({ success: false, error: String(error) });
  }
}

export default { checkJobPostings };
