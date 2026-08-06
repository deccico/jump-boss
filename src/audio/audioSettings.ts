/**
 * Shared mute switch for sound effects and music, remembered across visits.
 * localStorage is absent in Node tests (and can throw in private browsing),
 * so every touch of it is guarded.
 */
const STORAGE_KEY = 'jump-boss-muted';

function readStored(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let muted = readStored();

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    }
  } catch {
    // persistence is best-effort
  }
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}
