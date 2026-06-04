export type Stats = {
  iterations: number;
  successes: number;
  failures: number;
  consecutiveFailures: number;
  lastIteration: string | null;
  lastSuccess: string | null;
  lastFailure: string | null;
  lastError: string | null;
  lastMatchedCount: number;
  lastCity: string | null;
};

const initial: Stats = {
  iterations: 0,
  successes: 0,
  failures: 0,
  consecutiveFailures: 0,
  lastIteration: null,
  lastSuccess: null,
  lastFailure: null,
  lastError: null,
  lastMatchedCount: 0,
  lastCity: null,
};

export const stats: Stats = { ...initial };

export function recordIteration(opts: { success: boolean; error?: string | null; matchedCount?: number; city?: string | null }) {
  stats.iterations += 1;
  stats.lastIteration = new Date().toISOString();

  if (opts.city) stats.lastCity = opts.city;
  if (typeof opts.matchedCount === 'number') stats.lastMatchedCount = opts.matchedCount;

  if (opts.success) {
    stats.successes += 1;
    stats.consecutiveFailures = 0;
    stats.lastSuccess = stats.lastIteration;
    stats.lastError = null;
  } else {
    stats.failures += 1;
    stats.consecutiveFailures += 1;
    stats.lastFailure = stats.lastIteration;
    stats.lastError = opts.error ? String(opts.error) : null;
  }
}

export function getStats(): Stats {
  return { ...stats };
}
