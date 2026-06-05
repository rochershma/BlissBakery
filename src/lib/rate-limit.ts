// Simple in-memory rate limiter (no Redis needed)
// For production, replace with Redis-based solution

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (val.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, retryAfterMs: 0 };
}

// Track OTP verification failures separately (lock after N failures)
const failStore = new Map<string, { failures: number; lockedUntil: number }>();

export function checkBruteForce(phone: string, maxFailures: number = 5, lockoutMs: number = 15 * 60 * 1000): { locked: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = failStore.get(phone);

  if (!entry) return { locked: false, retryAfterMs: 0 };

  if (entry.lockedUntil > now) {
    return { locked: true, retryAfterMs: entry.lockedUntil - now };
  }

  // Lock expired, reset
  if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
    failStore.delete(phone);
    return { locked: false, retryAfterMs: 0 };
  }

  return { locked: false, retryAfterMs: 0 };
}

export function recordFailure(phone: string, maxFailures: number = 5, lockoutMs: number = 15 * 60 * 1000) {
  const entry = failStore.get(phone) || { failures: 0, lockedUntil: 0 };
  entry.failures++;

  if (entry.failures >= maxFailures) {
    entry.lockedUntil = Date.now() + lockoutMs;
  }

  failStore.set(phone, entry);
}

export function clearFailures(phone: string) {
  failStore.delete(phone);
}
