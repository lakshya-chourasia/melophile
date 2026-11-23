import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Track, Playlist } from '../types/player';
import {
  cleanTrackTitle,
  extractCatalogArtistName,
  getDynamicTrackTag,
} from '../utils/playerUtils';
import { isHighResStudioPoster } from './artworkService';

export interface ListenHistoryItem {
  trackId: string;
  title: string;
  artist: string;
  genreTag: string;
  duration: string;
  durationSec: number;
  thumbnail: string;
  playCount: number;
  lastPlayedAtMs: number;
}

export interface UserTasteProfile {
  topArtists: string[];
  topGenres: string[];
  recentTitles: string[];
  totalPlays: number;
}

const VALID_ID_RE = /^[a-zA-Z0-9_\-]+$/;

function sanitizeFirestoreId(raw: string, maxLen = 64): string {
  const cleaned = String(raw || '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, maxLen);
  return cleaned && VALID_ID_RE.test(cleaned) ? cleaned : '';
}

function clampStr(val: unknown, maxLen: number): string {
  return String(val ?? '').trim().slice(0, maxLen);
}

function clampNum(val: unknown, min: number, max: number): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? val : 0;
  return Math.max(min, Math.min(max, n));
}

function sanitizeBoundedStringArray(arr: string[], maxItems: number, maxItemLen: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    const clean = clampStr(item, maxItemLen);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= maxItems) break;
  }
  return out;
}

const LABEL_OR_GENERIC_ARTIST_RE =
  /\b(t-?series|sony\s*music|zee\s*music|yrf|yash\s*raj|tips|saregama|speed\s*records|universal\s*music|warner\s*music|republic\s*records|atlantic\s*records|youtube\s*artist|unknown\s*artist|vevo)\b/i;

/**
 * Computes a weighted Taste Profile from favorited tracks (+3 weight) and listening history (+playCount weight).
 */
export function computeTasteProfile(
  favorites: Track[],
  history: ListenHistoryItem[]
): UserTasteProfile {
  const artistWeights = new Map<string, { label: string; score: number }>();
  const genreWeights = new Map<string, { label: string; score: number }>();

  const bump = (
    map: Map<string, { label: string; score: number }>,
    rawLabel: string,
    weight: number
  ) => {
    const label = rawLabel.trim();
    if (!label || label.length < 2) return;
    const key = label.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      prev.score += weight;
    } else {
      map.set(key, { label, score: weight });
    }
  };

  for (const fav of favorites) {
    const { title, artistFromTitle } = cleanTrackTitle(fav.title || '');
    const catalogArtist = extractCatalogArtistName(fav.artist || artistFromTitle || '');
    if (catalogArtist && !LABEL_OR_GENERIC_ARTIST_RE.test(catalogArtist)) {
      bump(artistWeights, catalogArtist, 4);
    }
    const tag = getDynamicTrackTag(title, catalogArtist || fav.artist || '', fav.views);
    if (tag && tag !== '#GLOBAL-HIT' && tag !== '#OFFICIAL') {
      bump(genreWeights, tag, 3);
    }
  }

  let totalPlays = 0;
  for (const item of history) {
    const plays = Math.max(1, Math.min(20, item.playCount || 1));
    totalPlays += item.playCount || 1;
    const { title, artistFromTitle } = cleanTrackTitle(item.title || '');
    const catalogArtist = extractCatalogArtistName(item.artist || artistFromTitle || '');
    if (catalogArtist && !LABEL_OR_GENERIC_ARTIST_RE.test(catalogArtist)) {
      bump(artistWeights, catalogArtist, Math.min(8, 1.5 + plays));
    }
    const tag = item.genreTag || getDynamicTrackTag(title, catalogArtist || item.artist || '');
    if (tag && tag !== '#GLOBAL-HIT' && tag !== '#OFFICIAL') {
      bump(genreWeights, tag, Math.min(6, 1 + plays * 0.6));
    }
  }

  const topArtists = sanitizeBoundedStringArray(
    Array.from(artistWeights.values())
      .sort((a, b) => b.score - a.score)
      .map((e) => e.label),
    12,
    80
  );

  const topGenres = sanitizeBoundedStringArray(
    Array.from(genreWeights.values())
      .sort((a, b) => b.score - a.score)
      .map((e) => e.label),
    10,
    60
  );

  const recentTitles = sanitizeBoundedStringArray(
    [
      ...history
        .slice()
        .sort((a, b) => b.lastPlayedAtMs - a.lastPlayedAtMs)
        .map((h) => cleanTrackTitle(h.title || '').title),
      ...favorites.map((f) => cleanTrackTitle(f.title || '').title),
    ],
    10,
    120
  );

  return {
    topArtists,
    topGenres,
    recentTitles,
    totalPlays,
  };
}

/**
 * Ensures the /users/{uid} master profile document exists before any subcollection write (Master Gate).
 */
export async function ensureUserProfile(
  user: User,
  initialTaste?: UserTasteProfile
): Promise<void> {
  const uid = sanitizeFirestoreId(user.uid, 128);
  if (!uid) return;
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  try {
    const snap = await getDoc(ref);
    const displayName = clampStr(user.displayName || user.email?.split('@')[0] || 'Listener', 120) || 'Listener';
    const email = user.email ? clampStr(user.email, 254) : undefined;
    const photoURL = user.photoURL ? clampStr(user.photoURL, 500) : undefined;

    if (!snap.exists()) {
      const payload: Record<string, unknown> = {
        uid,
        displayName,
        topArtists: sanitizeBoundedStringArray(initialTaste?.topArtists || [], 12, 80),
        topGenres: sanitizeBoundedStringArray(initialTaste?.topGenres || [], 10, 60),
        totalPlays: Math.floor(clampNum(initialTaste?.totalPlays || 0, 0, 10000000)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (email) payload.email = email;
      if (photoURL) payload.photoURL = photoURL;
      await setDoc(ref, payload);
    } else {
      const updatePayload: Record<string, unknown> = {
        displayName,
        updatedAt: serverTimestamp(),
      };
      if (email) updatePayload.email = email;
      if (photoURL) updatePayload.photoURL = photoURL;
      await updateDoc(ref, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserTasteProfile(
  uidRaw: string,
  taste: UserTasteProfile
): Promise<void> {
  const uid = sanitizeFirestoreId(uidRaw, 128);
  if (!uid) return;
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      topArtists: sanitizeBoundedStringArray(taste.topArtists, 12, 80),
      topGenres: sanitizeBoundedStringArray(taste.topGenres, 10, 60),
      totalPlays: Math.floor(clampNum(taste.totalPlays, 0, 10000000)),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveFavoriteToCloud(uidRaw: string, track: Track): Promise<void> {
  const uid = sanitizeFirestoreId(uidRaw, 128);
  const trackId = sanitizeFirestoreId(track.id, 64);
  if (!uid || !trackId) return;

  const path = `users/${uid}/favorites/${trackId}`;
  const ref = doc(db, 'users', uid, 'favorites', trackId);
  const { title: cleanT, artistFromTitle } = cleanTrackTitle(track.title || '');
  const title = clampStr(cleanT || track.title || 'Untitled Track', 200) || 'Untitled Track';
  const artist = clampStr(track.artist || artistFromTitle || 'Artist', 160);
  const duration = clampStr(track.duration || '0:00', 32);
  const durationSec = clampNum(track.durationSec || 0, 0, 86400);
  const thumbnail = clampStr(track.thumbnail || '', 600);
  const views = track.views ? clampStr(track.views, 60) : undefined;

  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      const updateData: Record<string, unknown> = {
        title,
        artist,
        duration,
        durationSec,
        thumbnail,
      };
      if (views) updateData.views = views;
      await updateDoc(ref, updateData);
    } else {
      const createData: Record<string, unknown> = {
        uid,
        trackId,
        title,
        artist,
        duration,
        durationSec,
        thumbnail,
        createdAt: serverTimestamp(),
      };
      if (views) createData.views = views;
      await setDoc(ref, createData);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeFavoriteFromCloud(uidRaw: string, rawTrackId: string): Promise<void> {
  const uid = sanitizeFirestoreId(uidRaw, 128);
  const trackId = sanitizeFirestoreId(rawTrackId, 64);
  if (!uid || !trackId) return;

  const path = `users/${uid}/favorites/${trackId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'favorites', trackId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recordTrackPlayInCloud(uidRaw: string, track: Track): Promise<void> {
  const uid = sanitizeFirestoreId(uidRaw, 128);
  const trackId = sanitizeFirestoreId(track.id, 64);
  if (!uid || !trackId) return;

  const path = `users/${uid}/history/${trackId}`;
  const ref = doc(db, 'users', uid, 'history', trackId);
  const { title: cleanT, artistFromTitle } = cleanTrackTitle(track.title || '');
  const title = clampStr(cleanT || track.title || 'Untitled Track', 200) || 'Untitled Track';
  const artist = clampStr(track.artist || artistFromTitle || 'Artist', 160);
  const genreTag = clampStr(getDynamicTrackTag(title, artist, track.views), 60);
  const duration = clampStr(track.duration || '0:00', 32);
  const durationSec = clampNum(track.durationSec || 0, 0, 86400);
  const thumbnail = clampStr(track.thumbnail || '', 600);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const prevCount = typeof snap.data()?.playCount === 'number' ? snap.data().playCount : 1;
      const nextCount = Math.min(100000, Math.max(1, Math.floor(prevCount) + 1));
      await updateDoc(ref, {
        title,
        artist,
        genreTag,
        duration,
        durationSec,
        thumbnail,
        playCount: nextCount,
        lastPlayedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        uid,
        trackId,
        title,
        artist,
        genreTag,
        duration,
        durationSec,
        thumbnail,
        playCount: 1,
        lastPlayedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function savePlaylistToCloud(uidRaw: string, playlist: Playlist): Promise<void> {
  const uid = sanitizeFirestoreId(uidRaw, 128);
  const playlistId = sanitizeFirestoreId(playlist.id, 128);
  if (!uid || !playlistId) return;

  const path = `users/${uid}/playlists/${playlistId}`;
  const ref = doc(db, 'users', uid, 'playlists', playlistId);
  const name = clampStr(playlist.name || 'My Playlist', 100) || 'My Playlist';
  const trackIds = sanitizeBoundedStringArray(
    (playlist.tracks || []).map((t) => sanitizeFirestoreId(t.id, 64)).filter(Boolean),
    50,
    64
  );

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        name,
        trackIds,
        trackCount: trackIds.length,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        uid,
        playlistId,
        name,
        trackIds,
        trackCount: trackIds.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePlaylistFromCloud(uidRaw: string, rawPlaylistId: string): Promise<void> {
  const uid = sanitizeFirestoreId(uidRaw, 128);
  const playlistId = sanitizeFirestoreId(rawPlaylistId, 128);
  if (!uid || !playlistId) return;

  const path = `users/${uid}/playlists/${playlistId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'playlists', playlistId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserFavorites(
  uidRaw: string,
  onData: (tracks: Track[]) => void
): () => void {
  const uid = sanitizeFirestoreId(uidRaw, 128);
  if (!uid) return () => {};
  const path = `users/${uid}/favorites`;
  const q = query(
    collection(db, 'users', uid, 'favorites'),
    where('uid', '==', uid),
    firestoreLimit(150)
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt;
        const createdAtMs = ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
        return {
          createdAtMs,
          track: {
            id: String(data.trackId || d.id),
            title: String(data.title || 'Untitled Track'),
            artist: String(data.artist || 'Artist'),
            duration: String(data.duration || '0:00'),
            durationSec: typeof data.durationSec === 'number' ? data.durationSec : 0,
            thumbnail:
              typeof data.thumbnail === 'string' && isHighResStudioPoster(data.thumbnail)
                ? data.thumbnail
                : '',
            views: typeof data.views === 'string' ? data.views : undefined,
          } as Track,
        };
      });
      rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(rows.map((r) => r.track));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeUserHistory(
  uidRaw: string,
  onData: (items: ListenHistoryItem[]) => void
): () => void {
  const uid = sanitizeFirestoreId(uidRaw, 128);
  if (!uid) return () => {};
  const path = `users/${uid}/history`;
  const q = query(
    collection(db, 'users', uid, 'history'),
    where('uid', '==', uid),
    firestoreLimit(100)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: ListenHistoryItem[] = snap.docs.map((d) => {
        const data = d.data();
        const ts = data.lastPlayedAt;
        const lastPlayedAtMs =
          ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now();
        return {
          trackId: String(data.trackId || d.id),
          title: String(data.title || 'Untitled Track'),
          artist: String(data.artist || 'Artist'),
          genreTag: String(data.genreTag || ''),
          duration: String(data.duration || '0:00'),
          durationSec: typeof data.durationSec === 'number' ? data.durationSec : 0,
          thumbnail:
            typeof data.thumbnail === 'string' && isHighResStudioPoster(data.thumbnail)
              ? data.thumbnail
              : '',
          playCount: typeof data.playCount === 'number' ? data.playCount : 1,
          lastPlayedAtMs,
        };
      });
      items.sort((a, b) => b.lastPlayedAtMs - a.lastPlayedAtMs);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
