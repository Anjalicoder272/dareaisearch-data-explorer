// ---------------------------------------------------------------------------
// "Network chaos" settings for the mock API.
// Assignment rule: random delay of 200 ms – 3 s, and about 1 in 10 requests fail.
// The ChaosPanel in the UI can change these values for demos (saved in localStorage).
// ---------------------------------------------------------------------------

export const chaos = {
  minDelay: 200, // ms
  maxDelay: 3000, // ms
  failRate: 0.1, // 0.1 = 10% of requests fail
};

// Load saved settings (if any) when the app starts.
try {
  const saved = localStorage.getItem('chaos');
  if (saved) Object.assign(chaos, JSON.parse(saved));
} catch {
  // localStorage not available: keep defaults
}

export function updateChaos(changes: Partial<typeof chaos>) {
  Object.assign(chaos, changes);
  try {
    localStorage.setItem('chaos', JSON.stringify(chaos));
  } catch {
    // ignore
  }
}

export function randomDelay() {
  return chaos.minDelay + Math.random() * (chaos.maxDelay - chaos.minDelay);
}

export function shouldFail() {
  return Math.random() < chaos.failRate;
}
