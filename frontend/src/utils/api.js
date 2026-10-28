const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Fetch off-chain book metadata
 */
export async function fetchBooksMetadata() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("Backend API not reachable for /books, using direct blockchain state.");
    return [];
  }
}

/**
 * Fetch single book metadata
 */
export async function fetchBookMetadataById(bookId) {
  try {
    const res = await fetch(`${API_BASE}/books/${encodeURIComponent(bookId)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch student profile by wallet
 */
export async function fetchStudentProfile(walletAddress) {
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(walletAddress)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    return null;
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return { connected: false };
    return await res.json();
  } catch (err) {
    return { connected: false, error: err.message };
  }
}
