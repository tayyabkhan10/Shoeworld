// 📁 src/lib/dashboardCache.ts
"use client";

/**
 * Tiny cache used by the admin dashboard widgets (Revenue / Users / Products).
 *
 * Why this exists:
 * Without it, every time you leave /admin and come back, the chart
 * components re-mount, state resets to `null`, and you see the loading
 * skeleton again even though nothing actually changed. This stores data
 * twice — in memory for instant access during the session, and in
 * localStorage so it even survives a hard refresh — with a short TTL so
 * numbers still stay reasonably fresh.
 */

type CacheEntry<T> = { data: T; ts: number };

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const memoryStore = new Map<string, CacheEntry<unknown>>();

function storageKey(key: string) {
  return `admin_dash_cache:${key}`;
}

export function getCached<T>(key: string): T | null {
  const mem = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (mem && Date.now() - mem.ts < TTL_MS) return mem.data;

  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - parsed.ts > TTL_MS) return null;
    memoryStore.set(key, parsed);
    return parsed.data;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T) {
  const entry: CacheEntry<T> = { data, ts: Date.now() };
  memoryStore.set(key, entry);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    /* storage full or private-mode browsing — fail silently, memory cache still works */
  }
}

export function clearCachedPrefix(prefix: string) {
  for (const k of Array.from(memoryStore.keys())) {
    if (k.startsWith(prefix)) memoryStore.delete(k);
  }
  if (typeof window === "undefined") return;
  try {
    const toDelete: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(storageKey(prefix))) toDelete.push(k);
    }
    toDelete.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}