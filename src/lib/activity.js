const STORAGE_KEY = "stockflow.activity.v1";
const MAX_ENTRIES = 50;

/*
 * Small history of transactions signed through StockFlow.
 * Stored in this browser only (localStorage), never on a server.
 */
export function getActivity() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addActivity(entry) {
  try {
    const next = [
      { ...entry, at: Date.now() },
      ...getActivity(),
    ].slice(0, MAX_ENTRIES);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );
  } catch {
    // Storage may be unavailable (private mode, blocked, full).
  }
}

export function clearActivity() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable.
  }
}