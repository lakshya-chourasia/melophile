/**
 * Ultra-Fast Multi-API Studio Poster Service (Apple WebP + Deezer Edge + Spotify + Unsplash)
 *
 * Architecture:
 * 1. L1 Memory Cache + Decoded GPU Registry: 0ms synchronous lookup & instant Frame-0 paint.
 * 2. L2 IndexedDB + localStorage (v5): 30-day persistence (skipped on miss once hydrated).
 * 3. Responsive Edge Rewriting: Serves ~20KB 400x400 WebP for cards and ~44KB 600x600 WebP for hero posters.
 * 4. 10ms Micro-Batching + Single-Flight Deduplication + Negative Miss Cache.
 */

export const DEFAULT_ARTWORK_FALLBACK = '';

const LOCAL_STORAGE_KEY = 'soundstream_artwork_v11';
const INDEXED_DB_NAME = 'soundstream_artwork_db_v11';
const INDEXED_DB_STORE = 'artworks';
const INDEXED_DB_VERSION = 1;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days
const MISS_TTL_MS = 20 * 1000; // 20s short negative cache so transient misses recover quickly
const MICRO_BATCH_DELAY_MS = 10;
const MAX_BATCH_SIZE = 40;

interface CacheRecord {
  url: string;
  timestamp: number;
  hits: number;
  trackTitle?: string;
  artistName?: string;
}

const memoryCache = new Map<string, CacheRecord>();
const missCache = new Map<string, number>();
const inFlightRequests = new Map<string, Promise<string>>();
const decodedImageUrls = new Set<string>();
let idbHydrated = false;

let totalHits = 0;
let totalMisses = 0;

const BAD_SAAVN_COVER_SLUG_RE =
  /\b(?:with[-_ ]love|love[-_ ]forever|broken[-_ ]strings|yours[-_ ]truly|best[-_ ]of|hit[-_ ]songs|bollywood[-_ ]hits|jukebox|instrumental|karaoke|soothing[-_ ]songs|happy[-_ ]vibes|mashup|compilation|playlist|non[-_ ]?stop|lofi|lo[-_ ]fi|slowed|sped[-_ ]up|all[-_ ]time[-_ ]best|romantic[-_ ]classics|nightcore|breakcore|ringtone|8d)\b/i;

export function isHighResStudioPoster(url?: string | null): boolean {
  if (!url) return false;
  // Never accept playlist artwork, artist portraits, or compilation/instrumental knockoffs as song covers
  if (
    url.includes('dzcdn.net') &&
    (url.includes('/images/playlist/') || url.includes('/images/artist/'))
  ) {
    return false;
  }
  if (url.includes('saavncdn.com')) {
    const slug = url.split('/').pop() || '';
    if (BAD_SAAVN_COVER_SLUG_RE.test(slug)) return false;
  }
  const isSquareYtmCover =
    (url.includes('lh3.googleusercontent.com') || url.includes('yt3.googleusercontent.com')) &&
    /=w(\d+)-h\1(?:-|$)/i.test(url);
  return (
    isSquareYtmCover ||
    url.includes('dzcdn.net') ||
    url.includes('mzstatic.com') ||
    url.includes('scdn.co') ||
    url.includes('coverartarchive.org') ||
    url.includes('archive.org') ||
    url.includes('saavncdn.com') ||
    url.includes('theaudiodb.com')
  );
}

/**
 * Rewrites high-res CDN URLs into fast, edge-cached WebP / right-sized variants:
 * - Apple mzstatic: 400x400bb.webp (~20KB, ~14ms) for cards, 600x600bb.webp (~44KB) for hero
 * - Deezer dzcdn: 500x500-000000-80-0-0.jpg (~25KB, edge-cached) for cards
 * - YouTube Music googleusercontent: w400-h400-l90-rj for cards, w800-h800-l90-rj for hero
 * - Unsplash: w=480&q=75&auto=format&fit=crop for cards, w=720&q=80 for hero
 */
export function optimizePosterUrl(url: string, size: 'card' | 'hero' = 'card'): string {
  if (!url) return '';
  if (
    (url.includes('lh3.googleusercontent.com') || url.includes('yt3.googleusercontent.com')) &&
    /=w(\d+)-h\1(?:-|$)/i.test(url)
  ) {
    const dim = size === 'hero' ? '=w800-h800-l90-rj' : '=w400-h400-l90-rj';
    return url.replace(/=w\d+-h\d+[^&]*/i, dim);
  }
  if (url.includes('mzstatic.com')) {
    const dim = size === 'hero' ? '600x600bb.webp' : '400x400bb.webp';
    return url.replace(/\/\d+x\d+bb\.(jpg|jpeg|png|webp)$/i, `/${dim}`);
  }
  if (url.includes('dzcdn.net')) {
    const target = size === 'hero' ? '1000x1000-000000-80-0-0.jpg' : '500x500-000000-80-0-0.jpg';
    return url.replace(/\/\d+x\d+-\d+-\d+-\d+-\d+\.jpg/i, `/${target}`);
  }
  if (url.includes('images.unsplash.com/photo-')) {
    const base = url.split('?')[0];
    return size === 'hero'
      ? `${base}?auto=format&fit=crop&w=720&q=80`
      : `${base}?auto=format&fit=crop&w=480&q=75`;
  }
  return url;
}

export function markImageDecoded(url?: string | null): void {
  if (!url) return;
  decodedImageUrls.add(url);
  if (decodedImageUrls.size > 1200) {
    const first = decodedImageUrls.values().next().value;
    if (first) decodedImageUrls.delete(first);
  }
}

export function isImageDecoded(url?: string | null): boolean {
  return Boolean(url && decodedImageUrls.has(url));
}

export function isYouTubeThumbnailUrl(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes('ytimg.com') ||
    url.includes('youtube.com') ||
    url.includes('ggpht.com')
  );
}

export function hasVerifiedSquareCover(track?: {
  id?: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  hasSquareArtwork?: boolean;
} | null): boolean {
  if (!track) return false;
  if (isHighResStudioPoster(track.thumbnail)) return true;
  if (track.hasSquareArtwork === false) return false;
  const cached = getCachedArtworkSync(track.title || '', track.artist || '', track.id);
  return isHighResStudioPoster(cached);
}

/* ─────────────────────────────────────────────────────────────
   L2 CACHING: INDEXEDDB + LOCALSTORAGE
───────────────────────────────────────────────────────────── */
let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
            db.createObjectStore(INDEXED_DB_STORE, { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

async function getFromIndexedDB(key: string): Promise<string | null> {
  try {
    const db = await getIndexedDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(INDEXED_DB_STORE, 'readonly');
        const store = tx.objectStore(INDEXED_DB_STORE);
        const req = store.get(key);
        req.onsuccess = () => {
          const record: (CacheRecord & { key: string }) | undefined = req.result;
          if (record?.url && Date.now() - record.timestamp < TTL_MS && isHighResStudioPoster(record.url)) {
            resolve(record.url);
            return;
          }
          resolve(null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB(key: string, url: string, title?: string, artist?: string): Promise<void> {
  if (!isHighResStudioPoster(url)) return;
  try {
    const db = await getIndexedDB();
    if (!db) return;
    const tx = db.transaction(INDEXED_DB_STORE, 'readwrite');
    tx.objectStore(INDEXED_DB_STORE).put({
      key,
      url,
      timestamp: Date.now(),
      hits: 1,
      trackTitle: title,
      artistName: artist,
    });
  } catch {}
}

async function getIndexDBRecords(): Promise<Array<{ key: string; url: string; timestamp: number; hits: number }>> {
  try {
    const db = await getIndexedDB();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(INDEXED_DB_STORE, 'readonly');
        const req = tx.objectStore(INDEXED_DB_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  } catch {
    return [];
  }
}

function initHydrateCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed: Record<string, CacheRecord | string> = JSON.parse(stored);
      Object.entries(parsed).forEach(([k, val]) => {
        const record: CacheRecord =
          typeof val === 'string' ? { url: val, timestamp: Date.now(), hits: 1 } : val;
        if (Date.now() - record.timestamp < TTL_MS && isHighResStudioPoster(record.url)) {
          memoryCache.set(k.toLowerCase(), record);
        }
      });
    }
  } catch {}

  getIndexDBRecords()
    .then((records) => {
      records.forEach(({ key, url, timestamp, hits }) => {
        if (url && isHighResStudioPoster(url) && (!memoryCache.has(key) || (memoryCache.get(key)?.hits || 0) < hits)) {
          memoryCache.set(key.toLowerCase(), { url, timestamp, hits });
        }
      });
    })
    .finally(() => {
      idbHydrated = true;
    });
}
initHydrateCache();

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persistToLocalStorage(): void {
  if (typeof window === 'undefined') return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const obj: Record<string, CacheRecord> = {};
      Array.from(memoryCache.entries())
        .filter(([, v]) => isHighResStudioPoster(v.url))
        .sort((a, b) => b[1].hits - a[1].hits)
        .slice(0, 600)
        .forEach(([k, v]) => {
          obj[k] = v;
        });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }, 800);
}

export function preDecodeImage(url: string, size: 'card' | 'hero' = 'card'): void {
  if (typeof window === 'undefined' || !url || url.startsWith('data:')) return;
  const target = optimizePosterUrl(url, size);
  if (decodedImageUrls.has(target)) return;
  try {
    const img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => markImageDecoded(target);
    img.src = target;
    if (typeof img.decode === 'function') {
      img
        .decode()
        .then(() => markImageDecoded(target))
        .catch(() => {});
    }
  } catch {}
}

/**
 * Immediately warms L1 memory cache & triggers browser WebP pre-decode for tracks
 * returning from /api/universe, /api/search, or /api/recommendations so posters paint on Frame 0.
 */
export function primeArtworkUrls(
  tracks: Array<{ id?: string; title?: string; artist?: string; thumbnail?: string }>,
  limit = 20
): void {
  if (typeof window === 'undefined' || !Array.isArray(tracks)) return;
  let warmed = 0;
  for (const t of tracks) {
    if (!t?.thumbnail || !isHighResStudioPoster(t.thumbnail)) continue;
    const cleanT = cleanTitleForSearch(t.title || '');
    const cleanA = cleanArtistForSearch(t.artist || '');
    const titleArtistKey = `${cleanT}::${cleanA}`.toLowerCase();
    const record: CacheRecord = {
      url: t.thumbnail,
      timestamp: Date.now(),
      hits: 1,
      trackTitle: t.title,
      artistName: t.artist,
    };
    if (cleanT && !memoryCache.has(titleArtistKey)) {
      memoryCache.set(titleArtistKey, record);
    }
    if (t.id && !t.id.startsWith('http')) {
      const idKey = `id::${t.id}`.toLowerCase();
      if (!memoryCache.has(idKey)) memoryCache.set(idKey, record);
    }
    if (warmed < limit) {
      preDecodeImage(t.thumbnail, warmed < 2 ? 'hero' : 'card');
      warmed++;
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   TITLE & ARTIST NORMALIZERS
───────────────────────────────────────────────────────────── */
export function cleanTitleForSearch(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*[\(\[]\s*(?:official\s*(?:music\s*)?)?(?:video|audio|lyric(?:al)?\s*video|hd|4k|8k|uhd|remaster(?:ed)?(?:\s*\d+)?|visualizer|lyrics?|extended\s*mix|full\s*(?:song|video)|nsfw|explicit|clean|film\s*version|dance\s*mix)\s*[\)\]]/gi, '')
    .replace(/\s*\|.*$/, '')
    .replace(/\s*-\s*official\s*(?:music\s*)?(?:video|audio|lyric).*$/i, '')
    .replace(/\s*ft\.?.*$/i, '')
    .replace(/\s*feat\.?.*$/i, '')
    .trim();
}

export function cleanArtistForSearch(rawArtist: string): string {
  if (!rawArtist) return '';

  const monikerMatch = rawArtist.match(/\(([^)]+)\)/);
  if (monikerMatch && monikerMatch[1].trim()) {
    const moniker = monikerMatch[1].trim();
    const isExcluded = /(?:records?|entertainment|label|sony|warner|universal|music|ent|prod|topic|official|remaster|deluxe|live|audio|video|explicit|version)/i.test(moniker);
    if (!isExcluded) return moniker;
  }

  const lower = rawArtist.trim().toLowerCase();
  if (lower.includes('edward christopher sheeran')) return 'Ed Sheeran';
  if (lower.includes('harry edward styles')) return 'Harry Styles';
  if (lower.includes('adele adkins')) return 'Adele';
  if (lower.includes('austin richard post')) return 'Post Malone';

  return rawArtist
    .replace(/ - Topic$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/Official$/i, '')
    .replace(/\s*[\(\[].*?[\)\]]/g, '')
    .trim();
}

/* ─────────────────────────────────────────────────────────────
   AUTOMATIC 10ms MICRO-BATCHING -> POST /api/batch-artwork
───────────────────────────────────────────────────────────── */
interface PendingBatchItem {
  key: string;
  title: string;
  artist: string;
  videoId: string;
  resolve: (url: string | null) => void;
}

let pendingBatch: PendingBatchItem[] = [];
let batchFlushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushMicroBatch(): Promise<void> {
  batchFlushTimer = null;
  if (pendingBatch.length === 0) return;

  const batch = pendingBatch.splice(0, MAX_BATCH_SIZE);
  if (pendingBatch.length > 0) {
    batchFlushTimer = setTimeout(flushMicroBatch, 4);
  }

  try {
    const res = await fetch('/api/batch-artwork', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: batch.map((b) => ({
          key: b.key,
          title: b.title,
          artist: b.artist,
          videoId: b.videoId,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const artworks: Record<string, string> = data.artworks || data.results || {};
      batch.forEach((item) => {
        item.resolve(artworks[item.key] || null);
      });
      return;
    }
  } catch (err) {
    console.warn('[ArtworkService] Batch poster fetch error:', err);
  }

  // Fallback to individual single-track endpoint if batch failed
  await Promise.all(
    batch.map(async (item) => {
      try {
        const singleRes = await fetch(
          `/api/highres-artwork?track=${encodeURIComponent(item.title)}&artist=${encodeURIComponent(item.artist)}&videoId=${encodeURIComponent(item.videoId)}`
        );
        if (singleRes.ok) {
          const singleData = await singleRes.json();
          item.resolve(singleData.artworkUrl || null);
          return;
        }
      } catch {}
      item.resolve(null);
    })
  );
}

function enqueueBatchLookup(key: string, title: string, artist: string, videoId: string): Promise<string | null> {
  return new Promise((resolve) => {
    pendingBatch.push({ key, title, artist, videoId, resolve });
    if (pendingBatch.length >= MAX_BATCH_SIZE) {
      if (batchFlushTimer) {
        clearTimeout(batchFlushTimer);
        batchFlushTimer = null;
      }
      flushMicroBatch();
    } else if (!batchFlushTimer) {
      batchFlushTimer = setTimeout(flushMicroBatch, MICRO_BATCH_DELAY_MS);
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────────────────────── */
export function isArtworkKnownMissSync(title: string, artist?: string): boolean {
  const cleanT = cleanTitleForSearch(title);
  const cleanA = cleanArtistForSearch(artist || '');
  const key = `${cleanT}::${cleanA}`.toLowerCase();
  const until = missCache.get(key);
  if (!until) return false;
  if (Date.now() < until) return true;
  missCache.delete(key);
  return false;
}

export async function getArtwork(
  title: string,
  artist: string,
  trackId?: string
): Promise<string> {
  const cleanT = cleanTitleForSearch(title);
  const cleanA = cleanArtistForSearch(artist);
  const videoId = trackId && !trackId.startsWith('http') ? trackId : '';

  const titleArtistKey = `${cleanT}::${cleanA}`.toLowerCase();
  const trackIdKey = videoId ? `id::${videoId}`.toLowerCase() : null;

  // 1. L1 Memory Cache (0ms)
  if (cleanT && memoryCache.has(titleArtistKey)) {
    const record = memoryCache.get(titleArtistKey)!;
    record.hits++;
    totalHits++;
    return record.url;
  }
  if (trackIdKey && memoryCache.has(trackIdKey)) {
    const record = memoryCache.get(trackIdKey)!;
    record.hits++;
    totalHits++;
    return record.url;
  }

  // Fast negative-miss short circuit (0ms -> renders motion-blur fallback immediately)
  const missedUntil = missCache.get(titleArtistKey);
  if (missedUntil && Date.now() < missedUntil) {
    return '';
  }

  // 2. L2 IndexedDB Cache (only while startup hydration is still running)
  if (cleanT && !idbHydrated) {
    const idbUrl = await getFromIndexedDB(titleArtistKey);
    if (idbUrl) {
      memoryCache.set(titleArtistKey, { url: idbUrl, timestamp: Date.now(), hits: 1 });
      if (trackIdKey) memoryCache.set(trackIdKey, { url: idbUrl, timestamp: Date.now(), hits: 1 });
      totalHits++;
      preDecodeImage(idbUrl, 'card');
      return idbUrl;
    }
  }

  if (!cleanT && !cleanA) return '';

  // 3. Single-Flight Request Coalescing
  if (inFlightRequests.has(titleArtistKey)) {
    return inFlightRequests.get(titleArtistKey)!;
  }

  totalMisses++;

  const requestPromise = (async () => {
    try {
      const resolvedUrl = await enqueueBatchLookup(titleArtistKey, cleanT, cleanA, videoId);
      const finalUrl = resolvedUrl && isHighResStudioPoster(resolvedUrl) ? resolvedUrl : '';

      if (finalUrl) {
        const record: CacheRecord = {
          url: finalUrl,
          timestamp: Date.now(),
          hits: 1,
          trackTitle: title,
          artistName: artist,
        };

        memoryCache.set(titleArtistKey, record);
        if (trackIdKey) memoryCache.set(trackIdKey, record);
        missCache.delete(titleArtistKey);

        saveToIndexedDB(titleArtistKey, finalUrl, title, artist);
        if (trackIdKey) saveToIndexedDB(trackIdKey, finalUrl, title, artist);
        persistToLocalStorage();

        preDecodeImage(finalUrl, 'card');
        return finalUrl;
      }
      missCache.set(titleArtistKey, Date.now() + MISS_TTL_MS);
    } catch (err) {
      console.warn(`[ArtworkService] Poster lookup failed for "${cleanT}":`, err);
    } finally {
      inFlightRequests.delete(titleArtistKey);
    }

    return '';
  })();

  inFlightRequests.set(titleArtistKey, requestPromise);
  return requestPromise;
}

export function getCachedArtworkSync(
  title: string,
  artist?: string,
  trackId?: string
): string | null {
  const cleanT = cleanTitleForSearch(title);
  const cleanA = cleanArtistForSearch(artist || '');
  const titleArtistKey = `${cleanT}::${cleanA}`.toLowerCase();
  const trackIdKey = trackId && !trackId.startsWith('http') ? `id::${trackId}`.toLowerCase() : null;

  if (cleanT && memoryCache.has(titleArtistKey)) {
    return memoryCache.get(titleArtistKey)!.url;
  }
  if (trackIdKey && memoryCache.has(trackIdKey)) {
    return memoryCache.get(trackIdKey)!.url;
  }
  return null;
}

export function prefetchArtwork(
  tracks: Array<{ title: string; artist?: string; id?: string; thumbnail?: string }>,
  limit = 28
): void {
  if (!Array.isArray(tracks) || tracks.length === 0) return;

  primeArtworkUrls(tracks, limit);

  tracks.slice(0, limit).forEach((track) => {
    if (track.thumbnail && isHighResStudioPoster(track.thumbnail)) return;
    const cleanT = cleanTitleForSearch(track.title);
    const cleanA = cleanArtistForSearch(track.artist || '');
    const key = `${cleanT}::${cleanA}`.toLowerCase();
    if (cleanT && !memoryCache.has(key) && !isArtworkKnownMissSync(track.title, track.artist)) {
      getArtwork(track.title, track.artist || '', track.id).catch(() => {});
    }
  });
}

export async function clearArtworkCache(): Promise<void> {
  memoryCache.clear();
  missCache.clear();
  inFlightRequests.clear();
  decodedImageUrls.clear();
  totalHits = 0;
  totalMisses = 0;

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      const db = await getIndexedDB();
      if (db) {
        const tx = db.transaction(INDEXED_DB_STORE, 'readwrite');
        tx.objectStore(INDEXED_DB_STORE).clear();
      }
    } catch {}
  }
}

export function getArtworkCacheStats(): {
  memorySize: number;
  totalHits: number;
  totalMisses: number;
  hitRatio: string;
  sampleKeys: string[];
} {
  const total = totalHits + totalMisses;
  const hitRatio = total > 0 ? `${Math.round((totalHits / total) * 100)}%` : '0%';
  return {
    memorySize: memoryCache.size,
    totalHits,
    totalMisses,
    hitRatio,
    sampleKeys: Array.from(memoryCache.keys()).slice(0, 10),
  };
}
