/**
 * Pure helper functions for YouTube music player logic
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  views?: string;
  thumbnail: string;
}

/**
 * Format duration in seconds to standard mm:ss or hh:mm:ss format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;

  if (hrs > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }

  return `${mins}:${paddedSecs}`;
}

/**
 * Parse time string like "3:45" or "1:15:20" to total seconds
 */
export function parseDurationToSeconds(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Extract YouTube 11-character video ID from URLs or raw IDs
 */
export function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If already an 11-char ID like 'dQw4w9WgXcQ'
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch URLs, short URLs, embeds, music.youtube.com, shorts
  const patterns = [
    /(?:v=|\/embed\/|\/watch\?v=|\/watch\?.+&v=)([^#&?]{11})/,
    /(?:youtu\.be\/)([^#&?]{11})/,
    /(?:youtube\.com\/shorts\/)([^#&?]{11})/,
    /(?:music\.youtube\.com\/watch\?v=)([^#&?]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Calculate next track index based on queue, shuffle, and repeat modes
 */
export type RepeatMode = 'off' | 'all' | 'one';

export function getNextTrackIndex(
  currentIndex: number,
  queueLength: number,
  repeatMode: RepeatMode,
  isShuffle: boolean,
  playedIndices: number[] = []
): number | null {
  if (queueLength <= 0) return null;
  if (queueLength === 1) {
    return repeatMode === 'off' ? (playedIndices.length > 0 ? null : 0) : 0;
  }

  if (repeatMode === 'one') {
    return currentIndex >= 0 ? currentIndex : 0;
  }

  if (isShuffle) {
    const available = [];
    for (let i = 0; i < queueLength; i++) {
      if (i !== currentIndex && !playedIndices.includes(i)) {
        available.push(i);
      }
    }

    if (available.length > 0) {
      const rand = Math.floor(Math.random() * available.length);
      return available[rand];
    }

    // If all have been played in shuffle:
    if (repeatMode === 'all') {
      const pool = [];
      for (let i = 0; i < queueLength; i++) {
        if (i !== currentIndex) pool.push(i);
      }
      return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : 0;
    }

    return null;
  }

  // Standard sequential playback
  if (currentIndex < queueLength - 1) {
    return currentIndex + 1;
  } else if (repeatMode === 'all') {
    return 0;
  }

  return null;
}

/**
 * Calculate previous track index
 */
export function getPrevTrackIndex(
  currentIndex: number,
  queueLength: number,
  currentTimeSec: number
): number {
  if (queueLength <= 0) return 0;
  // If track has been playing for > 3 seconds, replay from start
  if (currentTimeSec > 3) {
    return currentIndex;
  }
  return currentIndex > 0 ? currentIndex - 1 : queueLength - 1;
}

const TITLE_JUNK_PAREN_RE =
  /\b(?:official|music\s*video|video|audio|lyric(?:al|s)?|visuali[sz]er|m\/?v|pv|hd|hq|4k|8k|uhd|1080p|60fps|remaster(?:ed)?|explicit|clean|full\s*(?:song|video|audio)|with\s*lyrics|color\s*coded|sub\s*esp|español|eng\s*sub|subtitles?|new\s*(?:hindi|punjabi|english|tamil|telugu)?\s*song|latest\s*song|trending|viral|teaser|trailer|promo|clip|shorts?|prod\.?(?:\s+by)?|produced\s+by|directed\s+by|dir\.|starring|feat\.?|ft\.?|featuring|from\s+["'“”]?|ost|soundtrack|motion\s*picture|radio\s*edit|single\s*version|album\s*version|original\s*version|extended|bonus\s*track|deluxe|out\s*now|available\s*now|vevo|topic|live\s+(?:at|from|in|on|session|performance)|in\s+studio|performance|tiny\s*desk|colors\s+show|bbc|session|slowed|reverb|sped\s*up|nightcore|8d|bass\s*boosted|karaoke|instrumental|video\s*song|audio\s*song|audio\s*only|title\s*track|theme\s*song|animated|vertical|dolby|atmos|spatial|hi-?res|lossless|premiere|exclusive|uncensored|censored|spider-man|movie|film|version|edit|bonus|demo)\b|^\s*(?:19|20)\d{2}\s*$/i;

const TITLE_TRAILING_JUNK_RE =
  /(?:\s*[-–—:,]?\s*|\s+)(?:official\s*(?:music\s*)?(?:hd\s*|4k\s*)?(?:video|audio|lyric(?:al)?\s*(?:video|song)?|visuali[sz]er|m\/?v|performance|full\s*(?:song|video|audio)|remaster(?:ed)?|teaser|trailer)|music\s*video|lyric(?:al)?\s*video|full\s*(?:video\s*)?song|full\s*video|full\s*audio|video\s*song|audio\s*song|with\s*lyrics|m\/v|mv|visuali[sz]er|4k\s*remaster(?:ed)?|hd\s*remaster(?:ed)?|remaster(?:ed)?(?:\s*\d{4})?|audio\s*only|hd|4k|8k|hq|explicit|clean|official)\s*$/i;

const TITLE_LEADING_PREFIX_RE =
  /^(?:full\s*(?:video\s*)?(?:song)?|official\s*(?:music\s*)?(?:video|audio)|lyrical?(?:\s*video)?|video\s*song|audio\s*song|new\s*song|latest\s*song|exclusive|hd|4k|m\/?v)\s*[:\-–—]\s*/i;

const RECORD_LABEL_PREFIX_RE =
  /\b(?:t-series|tseries|sony\s*music|zee\s*music|tips\s*official|yrf|yash\s*raj|saregama|speed\s*records|desi\s*music|times\s*music|eros\s*now|shemaroo|warner\s*music|universal\s*music|atlantic\s*records|republic\s*records|interscope|columbia\s*records|def\s*jam|spinnin'?|monstercat|ncs|trap\s*nation|proximity|cloudkid|vevo|ultra\s*music|armada\s*music|dharma\s*productions|junglee\s*music)\b/i;

function normalizeMatchToken(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTitleNoise(input: string): string {
  let s = input;

  // Strip emojis, decorative symbols, and hashtags
  s = s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}★☆♫♪▶]/gu, ' ')
    .replace(/\s+#\S+/g, '')
    .replace(/^#\S+\s+/g, '');

  // Strip everything after pipe / double-slash / bullet separators (cast, movie, label credits)
  s = s.replace(/\s*(?:\||｜|\/\/|•)\s*.*$/, '');

  // Strip leading promo labels like "LYRICAL:", "Full Video:", "Official Audio:"
  s = s.replace(TITLE_LEADING_PREFIX_RE, '');

  // Iteratively strip junk parenthetical / bracketed groups: (...), [...], 【...】, {...}
  for (let pass = 0; pass < 4; pass++) {
    const next = s
      .replace(/\s*[\(\[【\{]\s*([^\)\]】\}]+?)\s*[\)\]】\}]/g, (full, inner: string) => {
        if (TITLE_JUNK_PAREN_RE.test(inner)) return '';
        return full;
      })
      .replace(/\s*[\(\[【\{]\s*[\)\]】\}]/g, '')
      .trim();
    if (next === s) break;
    s = next;
  }

  // Strip unparenthesized trailing video/audio/quality tags
  for (let pass = 0; pass < 4; pass++) {
    const next = s.replace(TITLE_TRAILING_JUNK_RE, '').trim();
    if (next === s || !next) break;
    s = next;
  }

  // Strip trailing inline featuring clauses (ft. / feat. / featuring ...)
  s = s.replace(/\s+(?:ft\.?|feat\.?|featuring)\s+.+$/i, '').trim();

  // Strip leading track numbers like "01. " or "02) "
  s = s.replace(/^\d{1,2}\s*[.)]\s+/, '');

  // Unwrap ONLY balanced outer quotes ('Song', "Song", “Song”, ‘Song’)
  s = s
    .replace(/^"([^"]+)"$/, '$1')
    .replace(/^'([^']+)'$/, '$1')
    .replace(/^“([^”]+)”$/, '$1')
    .replace(/^‘([^’]+)’$/, '$1')
    .trim();

  // Strip dangling trailing separators
  s = s.replace(/[\s\-–—:|,/]+$/, '').replace(/^[\s\-–—:|,/]+/, '').trim();

  return s.replace(/\s+/g, ' ').trim();
}

function isPureJunkSegment(seg: string): boolean {
  const cleaned = stripTitleNoise(seg);
  if (!cleaned) return true;
  if (TITLE_JUNK_PAREN_RE.test(cleaned) && cleaned.split(/\s+/).length <= 4) return true;
  if (RECORD_LABEL_PREFIX_RE.test(cleaned)) return true;
  return false;
}

/**
 * Clean up YouTube / catalog titles into ONLY the proper song name (zero video/promo/edition crap)
 */
export function cleanTrackTitle(
  rawTitle: string,
  knownArtist?: string
): { title: string; artistFromTitle?: string } {
  if (!rawTitle || typeof rawTitle !== 'string') return { title: 'Unknown Track' };

  const baseCleaned = stripTitleNoise(rawTitle);
  if (!baseCleaned) return { title: rawTitle.trim() };

  let working = baseCleaned;
  let artistFromTitle: string | undefined;

  // Handle K-pop / quoted MV titles like: BTS (방탄소년단) 'Dynamite' or BLACKPINK - 'How You Like That'
  const quotedSongMatch = working.match(/^(.{2,42}?)\s*(?:[-–—]\s*)?['"‘“]([^'"’”]{2,80})['"’”]$/);
  if (quotedSongMatch) {
    const leftArtist = quotedSongMatch[1].replace(/\s*[\(\[].*?[\)\]]/g, '').trim();
    const quotedSong = stripTitleNoise(quotedSongMatch[2]);
    if (quotedSong) {
      return {
        title: quotedSong,
        artistFromTitle: leftArtist && !RECORD_LABEL_PREFIX_RE.test(leftArtist) ? leftArtist : undefined,
      };
    }
  }

  // Handle "Artist: Song" (common on Bollywood / label channels like "Arijit Singh: Pachtaoge")
  const colonMatch = working.match(/^([^:]{2,38}):\s+(.{2,})$/);
  if (colonMatch) {
    const left = colonMatch[1].trim();
    const right = stripTitleNoise(colonMatch[2]);
    const isLikelyNonArtistPrefix = /^(?:part|chapter|act|vol|episode|ep|scene)\b/i.test(left);
    if (!isLikelyNonArtistPrefix && right) {
      if (!RECORD_LABEL_PREFIX_RE.test(left)) {
        artistFromTitle = left;
      }
      working = right;
    }
  }

  // Handle "Artist - Song" / "Artist – Song" / "Song Full Video - Movie" / multi-dash metadata
  const rawDashParts = rawTitle
    .replace(/\s*(?:\||｜|\/\/|•)\s*.*$/, '')
    .split(/\s+[-–—]\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const dashParts = working
    .split(/\s+[-–—]\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (dashParts.length >= 2) {
    // Drop trailing metadata/label segments
    while (dashParts.length > 1 && isPureJunkSegment(dashParts[dashParts.length - 1])) {
      dashParts.pop();
    }
  }

  if (dashParts.length >= 2) {
    const first = dashParts[0];
    const second = dashParts[1];
    const normKnown = normalizeMatchToken(knownArtist || '');
    const normFirst = normalizeMatchToken(first);
    const normSecond = normalizeMatchToken(second);

    const firstHasSongTag =
      rawDashParts.length >= 2 &&
      /\b(?:full\s*(?:video\s*)?song|full\s*video|full\s*audio|video\s*song|audio\s*song|official\s*(?:music\s*)?(?:video|audio)|lyric(?:al)?\s*video|music\s*video)\b/i.test(
        rawDashParts[0]
      );

    const firstMatchesArtist =
      !firstHasSongTag &&
      Boolean(normKnown) &&
      (normFirst === normKnown || normFirst.includes(normKnown) || normKnown.includes(normFirst));
    const secondMatchesArtist =
      Boolean(normKnown) &&
      (normSecond === normKnown || normSecond.includes(normKnown) || normKnown.includes(normSecond));

    if (firstHasSongTag || (secondMatchesArtist && !firstMatchesArtist)) {
      // Format was "Song Full Video - Movie" or "Song - Artist"
      if (secondMatchesArtist) artistFromTitle = second;
      working = first;
    } else {
      // Standard format "Artist - Song" (ignore extra trailing movie/cast segments beyond index 1)
      if (!RECORD_LABEL_PREFIX_RE.test(first)) {
        artistFromTitle = first;
      }
      working = second;
    }
  } else if (dashParts.length === 1) {
    working = dashParts[0];
  }

  // Second pass cleanup after splitting off artist prefix
  const finalTitle = stripTitleNoise(working);

  return {
    title: finalTitle || baseCleaned || rawTitle.trim(),
    ...(artistFromTitle ? { artistFromTitle: artistFromTitle.replace(/\s+/g, ' ').trim() } : {}),
  };
}

export interface LyricWord {
  time: number;
  endTime?: number;
  text: string;
}

export interface LyricLine {
  time: number; // start time in seconds
  endTime?: number; // end time in seconds for karaoke progress & instrumental gaps
  text: string;
  words?: LyricWord[];
}

/**
 * Parses synchronized LRC lyrics (standard, multi-timestamp, [offset:ms], and Enhanced LRC <mm:ss.xx>)
 * into sorted timestamped lines with accurate endTimes (respecting instrumental breaks).
 */
export function parseLrcLyrics(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split(/\r?\n/);

  // Parse optional LRC [offset:+/-ms] header tag (positive = lyrics appear earlier)
  let headerOffsetSec = 0;
  for (const raw of lines) {
    const offMatch = raw.trim().match(/^\[offset:\s*([+-]?\d+)\s*\]$/i);
    if (offMatch) {
      const ms = parseInt(offMatch[1], 10);
      if (Number.isFinite(ms)) {
        headerOffsetSec = -ms / 1000;
      }
      break;
    }
  }

  const events: Array<{ time: number; text: string; words?: LyricWord[]; isBreak: boolean }> = [];
  // Supports [mm:ss], [mm:ss.xx], [mm:ss.xxx], [mm:ss:xx], and dotless [mm:ssxx] (common in Bollywood/LRCLIB files)
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3})|(\d{2,3}))?\]/g;
  const wordRegex = /<(\d{1,2}):(\d{2})(?:[.:](\d{1,3})|(\d{2,3}))?>([^<]*)/g;
  const creditNoiseRe =
    /^(?:(?:作词|作曲|编曲|制作人|混音|录音|演唱|词|曲)\s*[:：]|(?:lyrics|synced|lrc|timed|uploaded)\s+by\s*[:\-]|www\.\S+|https?:\/\/\S+)/i;

  const parseTimestamp = (minStr: string, secStr: string, fracStr?: string): number => {
    const min = parseInt(minStr, 10);
    const sec = parseInt(secStr, 10);
    const ms = fracStr ? parseInt(fracStr.padEnd(3, '0').slice(0, 3), 10) : 0;
    return Math.max(0, Math.round((min * 60 + sec + ms / 1000 + headerOffsetSec) * 1000) / 1000);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match;
    const timestamps: number[] = [];
    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(trimmed)) !== null) {
      timestamps.push(parseTimestamp(match[1], match[2], match[3] || match[4]));
    }
    if (timestamps.length === 0) continue;

    const rawBody = trimmed.replace(timeRegex, '').trim();

    // Parse optional Enhanced LRC inline word timestamps: <00:15.40> word <00:15.90> next
    let parsedWords: LyricWord[] | undefined;
    let cleanText = rawBody;
    if (rawBody.includes('<') && /<\d{1,2}:\d{2}/.test(rawBody)) {
      const words: LyricWord[] = [];
      let wMatch;
      wordRegex.lastIndex = 0;
      while ((wMatch = wordRegex.exec(rawBody)) !== null) {
        const wTime = parseTimestamp(wMatch[1], wMatch[2], wMatch[3] || wMatch[4]);
        const wText = wMatch[5].replace(/\s+/g, ' ');
        if (wText.trim()) {
          words.push({ time: wTime, text: wText.trim() });
        }
      }
      if (words.length > 0) {
        parsedWords = words;
        cleanText = words.map((w) => w.text).join(' ').trim();
      } else {
        cleanText = rawBody.replace(/<\d{1,2}:\d{2}(?:[.:]?\d{1,3})?>/g, '').replace(/\s+/g, ' ').trim();
      }
    }

    if (cleanText && creditNoiseRe.test(cleanText)) continue;

    const isBreak = !cleanText || /^[♪♫🎵🎶•·.\-\s]+$/.test(cleanText);
    for (const time of timestamps) {
      events.push({
        time,
        text: isBreak ? '' : cleanText,
        words: isBreak ? undefined : parsedWords,
        isBreak,
      });
    }
  }

  events.sort((a, b) => a.time - b.time);

  // Build final sung lyric lines with accurate endTime (using empty timestamp breaks to end lines before solos)
  const result: LyricLine[] = [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.isBreak) continue;

    let nextEventTime: number | undefined;
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].time > ev.time + 0.05) {
        nextEventTime = events[j].time;
        break;
      }
    }

    const endTime = nextEventTime !== undefined ? nextEventTime : ev.time + 5;
    let words = ev.words;
    if (words && words.length > 0) {
      words = words.map((w, idx) => ({
        ...w,
        endTime: idx < words!.length - 1 ? words![idx + 1].time : endTime,
      }));
    }

    result.push({
      time: ev.time,
      endTime,
      text: ev.text,
      ...(words ? { words } : {}),
    });
  }

  return result;
}

/**
 * Generates realistic cadence-weighted timed lines when only plain (unsynced) lyrics exist.
 * Skips [Chorus]/[Verse] headers and weights duration by line length + stanza gaps.
 */
export function synthesizeTimedLyrics(plainLyrics: string, totalDurationSec: number): LyricLine[] {
  if (!plainLyrics || typeof plainLyrics !== 'string') return [];
  const rawLines = plainLyrics.split(/\r?\n/);

  const entries: Array<{ text: string; weight: number; gapAfter: number }> = [];
  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (!trimmed) {
      if (entries.length > 0) {
        entries[entries.length - 1].gapAfter = Math.min(3.5, entries[entries.length - 1].gapAfter + 1.4);
      }
      continue;
    }
    // Skip structural headers like [Verse 1], [Chorus], (Pre-Chorus)
    if (/^[\[\(](?:verse|chorus|pre-?chorus|post-?chorus|bridge|intro|outro|hook|refrain|instrumental|solo|interlude)[^\]\)]*[\]\)]$/i.test(trimmed)) {
      if (entries.length > 0) {
        entries[entries.length - 1].gapAfter = Math.min(4, entries[entries.length - 1].gapAfter + 1.6);
      }
      continue;
    }
    const weight = Math.max(12, Math.min(95, trimmed.length + 10));
    entries.push({ text: trimmed, weight, gapAfter: 0 });
  }

  if (entries.length === 0) return [];

  const totalDur = totalDurationSec > 30 ? totalDurationSec : 210;
  const start = Math.min(14, totalDur * 0.065);
  const end = Math.max(start + 15, totalDur * 0.91);
  const totalGapUnits = entries.reduce((sum, e) => sum + e.gapAfter, 0);
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  const availableSpan = end - start;
  const gapSecPool = Math.min(availableSpan * 0.22, totalGapUnits * 1.1);
  const lyricSecPool = Math.max(10, availableSpan - gapSecPool);

  let cursor = start;
  return entries.map((entry) => {
    const lineStart = Math.round(cursor * 100) / 100;
    const lineDur = (entry.weight / Math.max(1, totalWeight)) * lyricSecPool;
    const gapDur = totalGapUnits > 0 ? (entry.gapAfter / totalGapUnits) * gapSecPool : 0;
    const lineEnd = Math.round((cursor + lineDur) * 100) / 100;
    cursor += lineDur + gapDur;
    return {
      time: lineStart,
      endTime: lineEnd,
      text: entry.text,
    };
  });
}

/**
 * Finds the index of the active lyric line for the current playback position (O(log n) binary search)
 * with optional user sync offset in seconds.
 */
export function findActiveLyricIndex(
  lyrics: LyricLine[],
  currentTime: number,
  offsetSec = 0
): number {
  if (!lyrics || lyrics.length === 0) return -1;
  // 0.22s human visual anticipation so eye reads ahead of vocal onset cleanly
  const target = currentTime + offsetSec + 0.22;

  if (target < lyrics[0].time) return -1;

  let lo = 0;
  let hi = lyrics.length - 1;
  let activeIndex = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (lyrics[mid].time <= target) {
      activeIndex = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return activeIndex;
}

/**
 * Computes normalized [0, 1] progress through the currently active lyric line
 * for silky 60fps karaoke highlight sweep.
 */
export function getLyricLineProgress(
  lyrics: LyricLine[],
  activeIndex: number,
  currentTime: number,
  offsetSec = 0
): number {
  if (activeIndex < 0 || activeIndex >= lyrics.length) return 0;
  const line = lyrics[activeIndex];
  const nextLine = lyrics[activeIndex + 1];
  const start = line.time;
  const rawEnd = line.endTime ?? (nextLine ? nextLine.time : start + 4.5);
  const span = Math.max(0.35, Math.min(14, rawEnd - start));
  const t = currentTime + offsetSec;
  return Math.max(0, Math.min(1, (t - start) / span));
}

/**
 * Extracts clean studio catalog artist name for LRCLIB / Deezer lookups
 * (e.g. "Abel Tesfaye (The Weeknd)" -> "The Weeknd", "Edward Christopher Sheeran" -> "Ed Sheeran")
 */
export function extractCatalogArtistName(rawArtist?: string): string {
  if (!rawArtist || typeof rawArtist !== 'string') return '';
  let s = rawArtist
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/\bOfficial\b/gi, '')
    .trim();

  const parenMatch = s.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1].trim()) {
    const inside = parenMatch[1].trim();
    const isExcluded = /(?:records?|entertainment|label|sony|warner|universal|music|topic|official|remaster|live|audio|video)/i.test(inside);
    if (!isExcluded) {
      s = inside;
    } else {
      s = s.replace(/\s*\([^)]*\)/g, '').trim();
    }
  }

  const lower = s.toLowerCase();
  if (lower.includes('edward christopher sheeran')) return 'Ed Sheeran';
  if (lower.includes('harry edward styles')) return 'Harry Styles';
  if (lower.includes('adele adkins')) return 'Adele';
  if (lower.includes('billie eilish o\'connell')) return 'Billie Eilish';
  if (lower.includes('robyn rihanna fenty')) return 'Rihanna';
  if (lower.includes('beyoncé knowles') || lower.includes('beyonce knowles')) return 'Beyoncé';

  return s.split(/\s*(?:,|&|\bfeat\.?\b|\bft\.?\b|\bx\b|×|\/)\s*/i)[0].trim();
}

/**
 * Generates dynamic genre/mood hashtag for any song based on its title, artist, and views
 */
export function getDynamicTrackTag(title: string, artist: string, views?: string): string {
  const text = `${title} ${artist}`.toLowerCase();
  if (text.includes('synth') || text.includes('retro') || text.includes('wave') || text.includes('80s') || text.includes('neon') || text.includes('midnight') || text.includes('timecop')) return '#SYNTHWAVE';
  if (text.includes('love') || text.includes('someone') || text.includes('heart') || text.includes('alone') || text.includes('kiss') || text.includes('relationship') || text.includes('adele')) return '#RELATIONSHIPS';
  if (text.includes('rock') || text.includes('roll') || text.includes('guitar') || text.includes('punk') || text.includes('metal') || text.includes('brightside') || text.includes('yellow') || text.includes('coldplay') || text.includes('arctic')) return '#ALT-ROCK';
  if (text.includes('chill') || text.includes('lofi') || text.includes('relax') || text.includes('sleep') || text.includes('ambient') || text.includes('resonance') || text.includes('home')) return '#CHILLOUT';
  if (text.includes('dance') || text.includes('club') || text.includes('edm') || text.includes('house') || text.includes('bass') || text.includes('despacito') || text.includes('calvin') || text.includes('marshmello')) return '#ELECTRONIC';
  if (text.includes('rap') || text.includes('hip hop') || text.includes('trap') || text.includes('drill')) return '#HIP-HOP';
  if (text.includes('acoustic') || text.includes('piano') || text.includes('unplugged') || text.includes('folk') || text.includes('bloom') || text.includes('paper kites')) return '#ACOUSTIC';
  if (text.includes('jazz') || text.includes('blues') || text.includes('soul')) return '#SOUL';
  if (views && (views.includes('B views') || views.includes('B'))) return '#GLOBAL-HIT';
  if (views && (views.includes('M views') || views.includes('M'))) return '#TRENDING';
  return '#NOW-PLAYING';
}

/**
 * Known singers directory: maps stage names, bands, and mononyms to the full singer / lead vocalist name
 */
export const SINGER_DIRECTORY: Record<string, string> = {
  // Mononyms & Stage Names
  'adele': 'Adele Adkins',
  'the weeknd': 'Abel Tesfaye (The Weeknd)',
  'abel tesfaye': 'Abel Tesfaye (The Weeknd)',
  'avicii': 'Aloe Blacc (Avicii)',
  'marshmello': 'Christopher Comstock (Marshmello)',
  'post malone': 'Austin Richard Post (Post Malone)',
  'billie eilish': 'Billie Eilish O\'Connell',
  'harry styles': 'Harry Edward Styles',
  'ed sheeran': 'Edward Christopher Sheeran',
  'dua lipa': 'Dua Lipa',
  'rihanna': 'Robyn Rihanna Fenty',
  'beyonce': 'Beyoncé Knowles-Carter',
  'beyoncé': 'Beyoncé Knowles-Carter',
  'bruno mars': 'Peter Gene Hernandez (Bruno Mars)',
  'lady gaga': 'Stefani Germanotta (Lady Gaga)',
  'katy perry': 'Katheryn Elizabeth Hudson (Katy Perry)',
  'daddy yankee': 'Ramón Ayala (Daddy Yankee)',
  'luis fonsi': 'Luis Alfonso Rodríguez (Luis Fonsi)',
  'aloe blacc': 'Aloe Blacc (Egbert Dawkins III)',
  'philip george': 'Philip George',

  // Bands -> Lead Singer & Band Name
  'coldplay': 'Chris Martin (Coldplay)',
  'queen': 'Freddie Mercury (Queen)',
  'the killers': 'Brandon Flowers (The Killers)',
  'arctic monkeys': 'Alex Turner (Arctic Monkeys)',
  'haim': 'Danielle Haim (HAIM)',
  'the midnight': 'Tyler Lyle (The Midnight)',
  'the paper kites': 'Sam Bentley & Christina Lacy (The Paper Kites)',
  'timecop1983': 'Jordy Leenaerts (Timecop1983)',
  'home': 'Randy Goffe (HOME)',
  'linkin park': 'Chester Bennington (Linkin Park)',
  'twenty one pilots': 'Tyler Joseph (Twenty One Pilots)',
  'imagine dragons': 'Dan Reynolds (Imagine Dragons)',
  'maroon 5': 'Adam Levine (Maroon 5)',
  'green day': 'Billie Joe Armstrong (Green Day)',
  'u2': 'Bono (U2)',
  'radiohead': 'Thom Yorke (Radiohead)',
  'the rolling stones': 'Mick Jagger (The Rolling Stones)',
  'nirvana': 'Kurt Cobain (Nirvana)',
  'foo fighters': 'Dave Grohl (Foo Fighters)',
  'pearl jam': 'Eddie Vedder (Pearl Jam)',
  'guns n roses': 'Axl Rose (Guns N\' Roses)',
  'guns n\' roses': 'Axl Rose (Guns N\' Roses)',
};

/**
 * Resolves full name of the singer/vocalist for any artist or track
 */
export function getFullSingerName(artist?: string, title?: string): string {
  if (!artist || typeof artist !== 'string') return 'Unknown Singer';

  const cleanedArtist = artist.trim();
  const lowerArtist = cleanedArtist.toLowerCase();

  // Special track checks (e.g. Wake Me Up is sung by Aloe Blacc)
  if (lowerArtist.includes('avicii') || (title && title.toLowerCase().includes('wake me up'))) {
    return 'Aloe Blacc (Avicii)';
  }

  // Exact directory match
  if (SINGER_DIRECTORY[lowerArtist]) {
    return SINGER_DIRECTORY[lowerArtist];
  }

  // Check if artist already has a full singer format with parentheses (e.g. "Chris Martin (Coldplay)")
  if (cleanedArtist.includes('(') && cleanedArtist.includes(')')) {
    return cleanedArtist;
  }

  // Check if artist string contains a known band or singer
  for (const [key, fullName] of Object.entries(SINGER_DIRECTORY)) {
    if (lowerArtist === key || lowerArtist.startsWith(`${key} `) || lowerArtist.endsWith(` ${key}`)) {
      return fullName;
    }
  }

  // Handling "feat." or "ft."
  if (cleanedArtist.includes(' ft. ') || cleanedArtist.includes(' feat. ')) {
    const separator = cleanedArtist.includes(' ft. ') ? ' ft. ' : ' feat. ';
    const parts = cleanedArtist.split(separator);
    const mainSinger = getFullSingerName(parts[0]);
    const featuredSinger = getFullSingerName(parts[1]);
    return `${mainSinger} ft. ${featuredSinger}`;
  }

  return cleanedArtist;
}

/**
 * Cryptographically strong random integer in [0, max) using Web Crypto API
 */
export function cryptoRandomInt(max: number): number {
  if (max <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let val = 0;
    do {
      window.crypto.getRandomValues(arr);
      val = arr[0];
    } while (val >= limit);
    return val % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * Unbiased Fisher-Yates shuffle backed by Web Crypto entropy
 */
export function cryptoShuffleList<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pick one cryptographically random item from an array
 */
export function pickCryptoRandom<T>(array: T[]): T | undefined {
  if (!array.length) return undefined;
  return array[cryptoRandomInt(array.length)];
}

const GENERIC_CHANNEL_OR_LABEL_RE =
  /\b(t-?series|sony\s*music\w*|zee\s*music\w*|yrf|yash\s*raj|tips|saregama|speed\s*records|universal\s*music|warner\s*music|republic\s*records|atlantic\s*records|columbia\s*records|interscope|def\s*jam|vevo|7clouds|dopelyrics|syrebralvibes|unique\s*vibes|taj\s*tracks|chilltracks|vibe\s*music|latin\s*hype|kidz\s*bop|bbc\s*radio|set\s*india|lyrics?|music\s*hub|youtube\s*artist|unknown\s*artist|topic)\b/i;

const ALTERNATE_EDITION_RE =
  /\b(remix|dance\s*mix|mix|acoustic|live|slowed|reverb|sped\s*up|lofi|lo-?fi|unplugged|cover|karaoke|instrumental|nightcore|8d|mashup|extended|radio\s*edit|version|session|weekend|all\s*stars)\b/i;

function normalizeSongTitleKey(rawTitle: string, searchQuery = ''): string {
  const { title: proper } = cleanTrackTitle(rawTitle || '');
  let key = proper
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Strip lowercase 'l' pipe mimics common on music channels (e.g., "Kesariya l Brahmastra l ...")
  key = key.replace(/\s+l\s+.*$/i, '');

  // Strip featured artist suffixes so "Song (feat. X)" and "Song" deduplicate together
  key = key
    .replace(/\s*[\(\[]\s*(?:feat\.?|ft\.?|featuring|with)\s+[^\)\]]*[\)\]]/gi, '')
    .replace(/\s+(?:feat\.?|ft\.?|featuring)\s+.*$/i, '');

  // Strip dash-attached artist/edition suffix (including missing space after dash like "shape of you -Ed sheeran")
  const queryWantsAlt = ALTERNATE_EDITION_RE.test(searchQuery || '');
  if (!queryWantsAlt) {
    // Strip parenthetical/bracketed variants (e.g., "(The Biggest Weekend)", "( cover by J.Fla )", "(Dance Mix)", "(Remastered)")
    key = key
      .replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '')
      .replace(/\s*[-–—]\s*(?:remix|dance\s*mix|acoustic|live|slowed(?:\s*\+?\s*reverb)?|sped\s*up|lofi|lo-?fi|unplugged|cover|karaoke|instrumental|remaster(?:ed)?|radio\s*edit|single\s*version|album\s*version).*$/i, '')
      .replace(/\s+-[a-z0-9].*$/i, '');
  }

  return key
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\u0900-\u097f\u0600-\u06ff\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePrimaryArtistForDedup(rawArtist: string): { normalized: string; tokens: string[]; isGeneric: boolean } {
  const catalog = extractCatalogArtistName(rawArtist || '') || rawArtist || '';
  const isGeneric = !catalog.trim() || GENERIC_CHANNEL_OR_LABEL_RE.test(catalog);
  const cleaned = catalog
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s*-\s*topic$/i, '')
    .replace(/vevo$/i, '')
    .replace(/\b(official|music|records|entertainment|channel|tv)\b/gi, ' ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\u0900-\u097f\u0600-\u06ff\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned
    .split(' ')
    .filter((t) => t.length >= 2 && t !== 'the' && t !== 'and');

  return { normalized: cleaned, tokens, isGeneric };
}

function artistsLookDistinct(
  a: { normalized: string; tokens: string[]; isGeneric: boolean; isOfficial: boolean; isAltUpload: boolean },
  b: { normalized: string; tokens: string[]; isGeneric: boolean; isOfficial: boolean; isAltUpload: boolean },
  titleMatchesQuery: boolean
): boolean {
  // If the user directly searched for this song title (e.g. "blinding lights" or "shape of you"),
  // never show covers / re-uploads / duplicate copies of the exact same title.
  if (titleMatchesQuery) return false;
  if (a.isGeneric || b.isGeneric || a.isAltUpload || b.isAltUpload) return false;
  if (!a.normalized || !b.normalized) return false;
  if (!a.isOfficial || !b.isOfficial) return false;
  if (a.normalized === b.normalized) return false;
  if (a.normalized.includes(b.normalized) || b.normalized.includes(a.normalized)) return false;
  const setB = new Set(b.tokens);
  if (a.tokens.some((tok) => setB.has(tok))) return false;
  return true;
}

/**
 * Deduplicates a track list so the same song never appears multiple times in search results
 * (collapsing Official Video, Official Audio, Lyric Video, Topic uploads, covers, label re-uploads, etc.)
 * while selecting the highest-quality verified studio version for each song.
 */
export function deduplicateTracksBySong<
  T extends {
    id: string;
    title: string;
    artist?: string;
    durationSec?: number;
    hasSquareArtwork?: boolean;
    thumbnail?: string;
    isOfficial?: boolean;
  }
>(tracks: T[], searchQuery = ''): T[] {
  if (!Array.isArray(tracks) || tracks.length <= 1) return tracks || [];

  const queryWantsAlt = ALTERNATE_EDITION_RE.test(searchQuery || '');
  const normalizedQuery = (searchQuery || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\u0600-\u06ff\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const scoreCandidate = (t: T, originalIndex: number): number => {
    let score = 0;
    if (t.hasSquareArtwork) score += 45;
    if (t.isOfficial) score += 30;
    const raw = (t.title || '').toLowerCase();
    const isAlt = ALTERNATE_EDITION_RE.test(raw) || /\blyrics?\b/i.test(raw) || /\s+l\s+/i.test(raw);
    if (!queryWantsAlt && !isAlt) {
      score += 24;
    }
    const dur = t.durationSec || 0;
    if (dur >= 100 && dur <= 460) score += 10;
    if (!GENERIC_CHANNEL_OR_LABEL_RE.test(t.artist || '')) score += 12;
    // Slight preference for earlier search relevance rank
    score += Math.max(0, 5 - originalIndex * 0.2);
    return score;
  };

  interface KeptEntry {
    track: T;
    score: number;
    titleKey: string;
    artistInfo: { normalized: string; tokens: string[]; isGeneric: boolean; isOfficial: boolean; isAltUpload: boolean };
  }

  const seenIds = new Set<string>();
  const kept: KeptEntry[] = [];

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    if (!track?.id || seenIds.has(track.id)) continue;
    seenIds.add(track.id);

    const { artistFromTitle } = cleanTrackTitle(track.title || '');
    const titleKey = normalizeSongTitleKey(track.title || '', searchQuery);
    const effectiveArtist =
      artistFromTitle && GENERIC_CHANNEL_OR_LABEL_RE.test(track.artist || '')
        ? artistFromTitle
        : track.artist || artistFromTitle || '';
    const baseArtist = normalizePrimaryArtistForDedup(effectiveArtist);
    const isAltUpload =
      ALTERNATE_EDITION_RE.test(track.title || '') ||
      /\blyrics?\b/i.test(track.title || '') ||
      /\s+l\s+/i.test(track.title || '');
    const artistInfo = { ...baseArtist, isOfficial: Boolean(track.isOfficial), isAltUpload };
    const candidateScore = scoreCandidate(track, i);

    if (!titleKey) {
      kept.push({ track, score: candidateScore, titleKey, artistInfo });
      continue;
    }

    const titleMatchesQuery =
      Boolean(normalizedQuery) &&
      titleKey.length >= 3 &&
      (titleKey === normalizedQuery ||
        normalizedQuery.includes(titleKey) ||
        (titleKey.startsWith(normalizedQuery) && titleKey.length - normalizedQuery.length <= 4));

    const dupIdx = kept.findIndex(
      (existing) =>
        existing.titleKey === titleKey &&
        !artistsLookDistinct(existing.artistInfo, artistInfo, titleMatchesQuery)
    );

    if (dupIdx === -1) {
      kept.push({ track, score: candidateScore, titleKey, artistInfo });
    } else {
      const existing = kept[dupIdx];
      if (candidateScore > existing.score) {
        // Keep the higher-scoring version, inheriting verified square artwork if needed
        const mergedTrack: T =
          !track.hasSquareArtwork && existing.track.hasSquareArtwork && existing.track.thumbnail
            ? { ...track, thumbnail: existing.track.thumbnail, hasSquareArtwork: true }
            : track;
        kept[dupIdx] = {
          track: mergedTrack,
          score: candidateScore,
          titleKey,
          artistInfo,
        };
      } else if (!existing.track.hasSquareArtwork && track.hasSquareArtwork && track.thumbnail) {
        kept[dupIdx] = {
          ...existing,
          track: { ...existing.track, thumbnail: track.thumbnail, hasSquareArtwork: true },
        };
      }
    }
  }

  return kept.map((entry) => entry.track);
}
