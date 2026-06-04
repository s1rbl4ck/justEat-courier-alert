import express from "express";
import { checkJobPostings } from './services/scraper';
import { getStats } from './services/stats';
import { PORT, TARGET_URL, INTERVAL_MS, TARGET_VEHICLES } from './config';

const app = express();

// Ensure `/stats` is handled as early middleware to avoid routing conflicts
app.all('/stats', (req, res) => {
  res.json(getStats());
});

// (debug logging removed)

app.get('/', (req, res) => {
  const stats = getStats();
  res.json({
    tracking: TARGET_URL,
    interval_ms: INTERVAL_MS,
    target_vehicles: TARGET_VEHICLES,
    stats,
  });
});

// Ensure stats are always reachable via any HTTP method
// Serve stats on the same Express server
app.get('/stats', (req, res) => {
  res.json(getStats());
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper Server listening on http://localhost:${PORT}`);
  checkJobPostings();
  setInterval(checkJobPostings, INTERVAL_MS);
});
