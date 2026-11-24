import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  Track,
  RepeatMode,
  GenreCollection,
  StreamQuality,
  EqPresetKey,
  TrackAudioProfile,
} from '../types/player';
import type { UserTasteProfile } from '../services/userDataService';
import {
  cleanTrackTitle,
  getFullSingerName,
  extractCatalogArtistName,
  parseLrcLyrics,
  synthesizeTimedLyrics,
  findActiveLyricIndex,
  getLyricLineProgress,
  LyricLine,
  formatTime,
  deduplicateTracksBySong,
} from '../utils/playerUtils';
import {
  DEFAULT_AUDIO_PROFILE,
  LiveAudioBeatAnalyzer,
  computePhaseLockedBeatFrame,
  BeatSyncFrame,
} from '../services/beatSyncEngine';
import { STREAM_QUALITY_OPTIONS, getQualityOption } from '../utils/qualityConfig';
import {
  Play,
  Pause,
  Shuffle,
  Heart,
  Search,
  X,
  Film,
  Home,
  Compass,
  ListMusic,
  Mic2,
  Dices,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Music2,
  Zap,
  Radio,
  Disc3,
  Loader2,
  Sparkles,
  Crosshair,
  RotateCcw,
  LogOut,
  Cloud,
} from 'lucide-react';
import { ArtworkImage } from './ArtworkImage';
import { UnifiedTrackCard } from './UnifiedTrackCard';
import { UnifiedPlaybackBar } from './UnifiedPlaybackBar';
import { QueueView } from './QueueView';
import { CinemaModeOverlay, CinemaViewMode } from './CinemaModeOverlay';
import { PWAInstallButton } from './PWAInstallButton';
import { extractColorFromImage, RGBColor } from '../utils/colorUtils';
import {
  getArtwork,
  getCachedArtworkSync,
  hasVerifiedSquareCover,
} from '../services/artworkService';

export interface SpotifyLayoutProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  playbackRate?: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isVideoVisible: boolean;
  videoSlot?: React.ReactNode;
  queue: Track[];
  recommendations: Track[];
  isRecommendationsLoading?: boolean;
  isPersonalizedRecs?: boolean;
  tasteBasis?: string[];
  tasteProfile?: UserTasteProfile;
  listenHistoryCount?: number;
  authUser?: User | null;
  authReady?: boolean;
  isSigningIn?: boolean;
  onGoogleSignIn?: () => void;
  onSignOut?: () => void;
  favorites: Track[];
  searchQuery: string;
  searchResults: Track[];
  isSearching: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onChangeVolume: (volume: number) => void;
  onToggleVideo: () => void;
  onSetVideoVisible?: (visible: boolean) => void;
  onPlayTrack: (track: Track) => void;
  onPlayGenre?: (genre: GenreCollection) => void;
  onPlayTrackList?: (tracks: Track[], title: string, shuffle?: boolean) => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue?: (track: Track) => void;
  onClearQueue?: () => void;
  onToggleFavorite: (track: Track) => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  genres?: GenreCollection[];
  featuredTracks?: Track[];
  popularTracks?: Track[];
  isRandomizingFeed?: boolean;
  isSurpriseLoading?: boolean;
  onRandomizeFeed?: () => void;
  onSurprisePlay?: () => void;
  onRefreshRecommendations?: () => void;
  playbackQuality?: StreamQuality;
  onChangePlaybackQuality?: (quality: StreamQuality) => void;
}

type NavView = 'home' | 'explore' | 'now-playing' | 'liked' | 'queue' | 'equalizer' | 'search';

interface EqPreset {
  id: EqPresetKey;
  label: string;
  tag: string;
  accent: string;
  bands: [number, number, number, number, number];
}

const EQ_BANDS = ['60Hz', '250Hz', '1KHz', '4KHz', '16KHz'] as const;

const EQ_PRESETS: EqPreset[] = [
  {
    id: 'sub-boom',
    label: 'SUB BOOM',
    tag: 'HEAVY 808s',
    accent: '#00f0ff',
    bands: [88, 72, 54, 62, 68],
  },
  {
    id: 'crisp-vocal',
    label: 'CRISP VOCAL',
    tag: 'STUDIO AIR',
    accent: '#fde400',
    bands: [48, 58, 82, 86, 74],
  },
  {
    id: 'lofi-vinyl',
    label: 'LO-FI VINYL',
    tag: 'WARM TAPE',
    accent: '#ff506e',
    bands: [74, 68, 56, 38, 28],
  },
  {
    id: 'rooftop-drop',
    label: 'ROOFTOP DROP',
    tag: 'MAX PUNCH',
    accent: '#00f0ff',
    bands: [92, 66, 62, 78, 90],
  },
];

const LYRIC_FX_BADGES = ['BAM!', 'POW!', 'SNAP!', 'THWIP!', 'ZAP!'];

export const SpotifyLayout: React.FC<SpotifyLayoutProps> = ({
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  playbackRate = 1,
  volume,
  repeatMode,
  isShuffle,
  isVideoVisible,
  videoSlot,
  queue,
  recommendations,
  isRecommendationsLoading = false,
  isPersonalizedRecs = false,
  tasteBasis = [],
  tasteProfile,
  listenHistoryCount = 0,
  authUser = null,
  authReady = false,
  isSigningIn = false,
  onGoogleSignIn,
  onSignOut,
  favorites,
  searchQuery,
  searchResults,
  isSearching,
  genres = [],
  featuredTracks = [],
  popularTracks = [],
  isRandomizingFeed = false,
  isSurpriseLoading = false,
  onRandomizeFeed,
  onSurprisePlay,
  onRefreshRecommendations,
  playbackQuality = 'highres',
  onChangePlaybackQuality,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onChangeVolume,
  onToggleVideo,
  onSetVideoVisible,
  onPlayTrack,
  onPlayGenre,
  onPlayTrackList,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
  onToggleFavorite,
  onSearch,
  onClearSearch,
}) => {
  // ── Primary Navigation & Account Popover State ──
  const [activeView, setActiveView] = useState<NavView>('home');
  const [randomSeed, setRandomSeed] = useState<number>(() => Date.now());
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState<boolean>(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isAccountMenuOpen]);

  // ── Interactive Beat-Matched Comic Equalizer FX Console State ──
  const [activeEqPreset, setActiveEqPreset] = useState<EqPresetKey>('sub-boom');
  const [eqBands, setEqBands] = useState<[number, number, number, number, number]>(
    EQ_PRESETS[0].bands
  );

  const [audioProfile, setAudioProfile] = useState<TrackAudioProfile>(DEFAULT_AUDIO_PROFILE);
  const [beatOffsetSec, setBeatOffsetSec] = useState<number>(0);
  const [tapBpmOverride, setTapBpmOverride] = useState<number | null>(null);
  const [liveSyncStatus, setLiveSyncStatus] = useState<'off' | 'tab' | 'mic'>('off');
  const [liveSyncNotice, setLiveSyncNotice] = useState<string | null>(null);
  const tapTimesRef = useRef<number[]>([]);
  const liveAnalyzerRef = useRef<LiveAudioBeatAnalyzer | null>(null);

  const [beatFrame, setBeatFrame] = useState<BeatSyncFrame>({
    bandLevels: [12, 10, 14, 10, 8],
    bandPeaks: [12, 10, 14, 10, 8],
    vuLeft: 2,
    vuRight: 2,
    vuPeakLeft: 2,
    vuPeakRight: 2,
    activeBeat: -1,
    isBeatHit: false,
    effectiveBpm: DEFAULT_AUDIO_PROFILE.bpm,
    isLiveAudioLocked: false,
  });

  // High-precision interpolated playback clock refs (eliminates YouTube's ~250ms polling jitter)
  const songClockRef = useRef<{ anchorTime: number; anchorPerf: number; playing: boolean }>({
    anchorTime: 0,
    anchorPerf: typeof performance !== 'undefined' ? performance.now() : 0,
    playing: false,
  });
  const beatStateRef = useRef<{
    bands: [number, number, number, number, number];
    peaks: [number, number, number, number, number];
    vuPeakL: number;
    vuPeakR: number;
  }>({
    bands: [12, 10, 14, 10, 8],
    peaks: [12, 10, 14, 10, 8],
    vuPeakL: 2,
    vuPeakR: 2,
  });
  const latestEqInputsRef = useRef({
    isPlaying,
    duration,
    volume,
    eqBands,
    audioProfile,
    beatOffsetSec,
    tapBpmOverride,
  });

  latestEqInputsRef.current = {
    isPlaying,
    duration,
    volume,
    eqBands,
    audioProfile,
    beatOffsetSec,
    tapBpmOverride,
  };

  // Sync interpolated clock whenever YouTube reports currentTime or play/pause changes
  useEffect(() => {
    const now = performance.now();
    const currentPred = songClockRef.current.playing
      ? songClockRef.current.anchorTime + (now - songClockRef.current.anchorPerf) / 1000
      : songClockRef.current.anchorTime;
    // Re-anchor smoothly if drift > 120ms, paused, or seeked
    if (!isPlaying || Math.abs(currentTime - currentPred) > 0.12 || currentTime === 0) {
      songClockRef.current = { anchorTime: currentTime, anchorPerf: now, playing: isPlaying };
    } else {
      songClockRef.current.playing = isPlaying;
    }
  }, [currentTime, isPlaying]);

  // Fetch real studio BPM & acoustic rhythm profile from keyless Deezer API whenever track changes
  useEffect(() => {
    if (!currentTrack?.id) return;
    setBeatOffsetSec(0);
    setTapBpmOverride(null);
    tapTimesRef.current = [];

    const controller = new AbortController();
    const { title: ct, artistFromTitle } = cleanTrackTitle(currentTrack.title);
    const singer = getFullSingerName(currentTrack.artist || artistFromTitle || '', ct);
    const params = new URLSearchParams({
      track: ct,
      artist: singer,
      durationSec: String(currentTrack.durationSec || 0),
    });

    fetch(`/api/audio-profile?${params.toString()}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((profile: TrackAudioProfile | null) => {
        if (!controller.signal.aborted && profile && typeof profile.bpm === 'number') {
          setAudioProfile(profile);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [currentTrack?.id]);

  // Cleanup live Web Audio analyzer on unmount
  useEffect(() => {
    return () => {
      liveAnalyzerRef.current?.stop();
    };
  }, []);

  // 60fps Beat-Synchronized Equalizer Animation Loop (Live FFT Lock OR Real Studio BPM Phase-Lock)
  useEffect(() => {
    let rafId = 0;
    let lastCommit = 0;

    const tick = (now: number) => {
      rafId = window.requestAnimationFrame(tick);
      // Throttle React state updates to ~30fps (every ~32ms) for buttery smoothness with tiny CPU footprint
      if (now - lastCommit < 32) return;
      lastCommit = now;

      const inputs = latestEqInputsRef.current;
      const prev = beatStateRef.current;

      // 1. If Live Web Audio FFT Capture is active, read exact real-time sound frequencies & beat onsets
      if (liveAnalyzerRef.current?.isActive()) {
        const liveFrame = liveAnalyzerRef.current.sampleFrame({
          eqBands: inputs.eqBands,
          fallbackBpm: inputs.tapBpmOverride || inputs.audioProfile.bpm,
          prevBands: prev.bands,
          prevPeaks: prev.peaks,
          prevVuPeakL: prev.vuPeakL,
          prevVuPeakR: prev.vuPeakR,
        });
        if (liveFrame) {
          beatStateRef.current = {
            bands: liveFrame.bandLevels,
            peaks: liveFrame.bandPeaks,
            vuPeakL: liveFrame.vuPeakLeft,
            vuPeakR: liveFrame.vuPeakRight,
          };
          setBeatFrame(liveFrame);
          return;
        }
      } else if (liveSyncStatus !== 'off') {
        setLiveSyncStatus('off');
      }

      // 2. Automatic Studio BPM Phase-Locked Engine synced to sub-ms song playback timestamp
      const clock = songClockRef.current;
      const smoothTimeSec = clock.playing
        ? clock.anchorTime + Math.max(0, (now - clock.anchorPerf) / 1000)
        : clock.anchorTime;

      const effectiveProfile: TrackAudioProfile = inputs.tapBpmOverride
        ? { ...inputs.audioProfile, bpm: inputs.tapBpmOverride }
        : inputs.audioProfile;

      const frame = computePhaseLockedBeatFrame({
        smoothTimeSec,
        durationSec: inputs.duration || 220,
        isPlaying: inputs.isPlaying,
        volume: inputs.volume,
        eqBands: inputs.eqBands,
        profile: effectiveProfile,
        beatOffsetSec: inputs.beatOffsetSec,
        prevBands: prev.bands,
        prevPeaks: prev.peaks,
        prevVuPeakL: prev.vuPeakL,
        prevVuPeakR: prev.vuPeakR,
      });

      beatStateRef.current = {
        bands: frame.bandLevels,
        peaks: frame.bandPeaks,
        vuPeakL: frame.vuPeakLeft,
        vuPeakR: frame.vuPeakRight,
      };
      setBeatFrame(frame);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [liveSyncStatus]);

  const handleToggleLiveAudioSync = async () => {
    setLiveSyncNotice(null);
    if (!liveAnalyzerRef.current) {
      liveAnalyzerRef.current = new LiveAudioBeatAnalyzer();
    }
    if (liveAnalyzerRef.current.isActive()) {
      liveAnalyzerRef.current.stop();
      setLiveSyncStatus('off');
      return;
    }
    const result = await liveAnalyzerRef.current.start(true);
    if (result.ok && result.mode) {
      setLiveSyncStatus(result.mode);
    } else {
      setLiveSyncStatus('off');
      setLiveSyncNotice(result.error || 'Using studio BPM beat-lock mode.');
      window.setTimeout(() => setLiveSyncNotice(null), 4000);
    }
  };

  const handleTapBeatSync = () => {
    const now = performance.now();
    const clock = songClockRef.current;
    const smoothSongTime = clock.playing
      ? clock.anchorTime + Math.max(0, (now - clock.anchorPerf) / 1000)
      : clock.anchorTime;

    // Immediately phase-lock downbeat 1 to this exact tap moment
    setBeatOffsetSec(smoothSongTime);

    const recentTaps = tapTimesRef.current.filter((t) => now - t < 2400);
    recentTaps.push(now);
    tapTimesRef.current = recentTaps.slice(-8);

    if (recentTaps.length >= 3) {
      let sum = 0;
      for (let i = 1; i < recentTaps.length; i++) {
        sum += recentTaps[i] - recentTaps[i - 1];
      }
      const avgMs = sum / (recentTaps.length - 1);
      const tappedBpm = Math.round(60000 / avgMs);
      if (tappedBpm >= 60 && tappedBpm <= 195) {
        setTapBpmOverride(tappedBpm);
      }
    }
  };

  const handleSelectEqPreset = (preset: EqPreset) => {
    setActiveEqPreset(preset.id);
    setEqBands([...preset.bands] as [number, number, number, number, number]);
  };

  const handleEqBandChange = (index: number, nextValue: number) => {
    const clamped = Math.max(10, Math.min(100, Math.round(nextValue)));
    setEqBands((prev) => {
      const copy = [...prev] as [number, number, number, number, number];
      copy[index] = clamped;
      return copy;
    });
  };

  const vuLevelLeft = beatFrame.vuLeft;
  const vuLevelRight = beatFrame.vuRight;

  // ── Search State & Quick `/` Shortcut ──
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [localSearchInput, setLocalSearchInput] = useState<string>(searchQuery || '');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('melophile_recent_searches');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string').slice(0, 6) : [];
    } catch {
      return [];
    }
  });
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const suggestCacheRef = useRef<Map<string, string[]>>(new Map());

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem('melophile_recent_searches', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (document.activeElement !== searchInputRef.current) {
      setLocalSearchInput(searchQuery || '');
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.key === '/' &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        setActiveView('search');
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchLiveSuggestions = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const key = trimmed.toLowerCase().replace(/\s+/g, ' ');
    const cached = suggestCacheRef.current.get(key);
    if (cached) {
      setSearchSuggestions(cached);
      return;
    }
    if (suggestAbortRef.current) suggestAbortRef.current.abort();
    const controller = new AbortController();
    suggestAbortRef.current = controller;
    fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
      .then(async (r) => {
        if (r.ok) return r.json();
        const fallbackRes = await fetch(`https://melophile-music.vercel.app/api/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        return fallbackRes.ok ? fallbackRes.json() : null;
      })
      .then((data) => {
        if (!controller.signal.aborted && Array.isArray(data?.suggestions)) {
          const list = data.suggestions.slice(0, 6);
          suggestCacheRef.current.set(key, list);
          setSearchSuggestions(list);
        }
      })
      .catch(() => {});
  };

  const handleSearchChange = (val: string) => {
    setLocalSearchInput(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    const trimmed = val.trim();
    if (!trimmed) {
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      setSearchSuggestions([]);
      onClearSearch();
      return;
    }
    if (activeView !== 'search') {
      setActiveView('search');
    }
    // Fast 100ms autocomplete chips
    suggestDebounceRef.current = setTimeout(() => {
      fetchLiveSuggestions(trimmed);
    }, 100);
    // Smart 210ms live search (prevents request thrashing while typing fast, still feels instant)
    if (trimmed.length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        onSearch(trimmed);
      }, 210);
    }
  };

  const handleSearchSubmitNow = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    setLocalSearchInput(trimmed);
    saveRecentSearch(trimmed);
    if (activeView !== 'search') {
      setActiveView('search');
    }
    fetchLiveSuggestions(trimmed);
    onSearch(trimmed);
  };

  const handleClearSearchInput = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (suggestAbortRef.current) suggestAbortRef.current.abort();
    setSearchSuggestions([]);
    setLocalSearchInput('');
    onClearSearch();
  };

  // ── Fullscreen Action Stage (Cinema Mode) ──
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [cinemaViewMode, setCinemaViewMode] = useState<CinemaViewMode>('poster');

  const syncVideoVisible = (visible: boolean) => {
    if (onSetVideoVisible) {
      onSetVideoVisible(visible);
    } else if (visible !== isVideoVisible) {
      onToggleVideo();
    }
  };

  const openCinema = (mode: CinemaViewMode) => {
    setCinemaViewMode(mode);
    setIsCinemaMode(true);
    syncVideoVisible(mode === 'video');
  };

  const closeCinema = () => {
    setIsCinemaMode(false);
    syncVideoVisible(false);
  };

  const handleCinemaViewModeChange = (mode: CinemaViewMode) => {
    setCinemaViewMode(mode);
    syncVideoVisible(mode === 'video');
  };

  // ── Zero-Unmount 1:1 Live Video Docking (Hero Cover Box on Home Base & Stage Cover on Now Playing) ──
  const [isVideoDocked, setIsVideoDocked] = useState<boolean>(false);
  const [startedVideoTrackId, setStartedVideoTrackId] = useState<string | null>(null);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const dockAnchorRef = useRef<HTMLDivElement | null>(null);
  const videoSlotWrapperRef = useRef<HTMLDivElement | null>(null);

  const isCinemaVideo = Boolean(isCinemaMode && cinemaViewMode === 'video');
  const canDockInMainCanvas = Boolean(
    currentTrack && !isCinemaMode && (activeView === 'home' || activeView === 'now-playing')
  );

  // Reveal live video ONLY after YouTube is genuinely playing (not buffering),
  // real video frames are confirmed advancing for this exact track, AND YouTube's
  // ~3.0s startup/resume/seek HUD (including the centered translucent || pause circle)
  // has completely auto-hidden.
  const confirmedTrackRef = useRef<{ id: string | null; lastTime: number; moving: boolean }>({
    id: null,
    lastTime: 0,
    moving: false,
  });
  const [framesMovingTrackId, setFramesMovingTrackId] = useState<string | null>(null);
  const [hudResetNonce, setHudResetNonce] = useState<number>(0);

  useEffect(() => {
    const id = currentTrack?.id || null;
    if (!id || !isPlaying || isBuffering) {
      confirmedTrackRef.current = { id, lastTime: currentTime, moving: false };
      setFramesMovingTrackId(null);
      setStartedVideoTrackId(null);
      return;
    }

    const tracker = confirmedTrackRef.current;
    if (tracker.id !== id) {
      confirmedTrackRef.current = { id, lastTime: currentTime, moving: false };
      setFramesMovingTrackId(null);
      setStartedVideoTrackId(null);
      return;
    }

    // Detect seeks (which briefly wake YouTube's centered || HUD) and re-cover until HUD hides
    if (tracker.moving && Math.abs(currentTime - tracker.lastTime) > 1.6) {
      tracker.moving = false;
      tracker.lastTime = currentTime;
      setFramesMovingTrackId(null);
      setStartedVideoTrackId(null);
      setHudResetNonce((n) => n + 1);
      return;
    }

    // Confirm real frame advancement (YouTube only advances currentTime while actively painting frames)
    if (!tracker.moving) {
      if (currentTime > 0.2 && currentTime > tracker.lastTime + 0.05) {
        tracker.moving = true;
        tracker.lastTime = currentTime;
        setFramesMovingTrackId(id);
      } else if (currentTime < tracker.lastTime) {
        tracker.lastTime = currentTime;
      }
    } else {
      tracker.lastTime = currentTime;
    }
  }, [currentTrack?.id, isPlaying, isBuffering, currentTime]);

  useEffect(() => {
    const id = currentTrack?.id || null;
    if (!id || !isPlaying || isBuffering || framesMovingTrackId !== id) {
      setStartedVideoTrackId(null);
      return;
    }

    // Wait 3.4s after real frame motion starts so YouTube's centered || pause circle
    // and top/bottom HUD have 100% auto-hidden before crossfading out the studio cover.
    const timer = window.setTimeout(() => {
      setStartedVideoTrackId(id);
    }, 3400);

    return () => window.clearTimeout(timer);
  }, [currentTrack?.id, isPlaying, isBuffering, framesMovingTrackId, hudResetNonce]);

  const isDockedVideoRevealed = Boolean(
    currentTrack &&
      isPlaying &&
      !isBuffering &&
      framesMovingTrackId === currentTrack.id &&
      startedVideoTrackId === currentTrack.id
  );

  useLayoutEffect(() => {
    const slotEl = videoSlotWrapperRef.current;

    const clearDockedStyles = () => {
      if (slotEl) {
        slotEl.style.left = '';
        slotEl.style.top = '';
        slotEl.style.width = '';
        slotEl.style.height = '';
        slotEl.style.clipPath = '';
        slotEl.style.pointerEvents = '';
      }
      setIsVideoDocked(false);
    };

    if (!canDockInMainCanvas) {
      clearDockedStyles();
      return;
    }

    const syncDockedGeometry = () => {
      const anchorEl = dockAnchorRef.current;
      const scrollEl = mainScrollRef.current;
      const wrapperEl = videoSlotWrapperRef.current;
      if (!anchorEl || !scrollEl || !wrapperEl) {
        clearDockedStyles();
        return;
      }

      const anchorRect = anchorEl.getBoundingClientRect();
      const scrollRect = scrollEl.getBoundingClientRect();

      if (anchorRect.width < 40 || anchorRect.height < 40 || scrollRect.width < 40) {
        clearDockedStyles();
        return;
      }

      const clipTop = Math.max(0, scrollRect.top - anchorRect.top);
      const clipRight = Math.max(0, anchorRect.right - scrollRect.right);
      const clipBottom = Math.max(0, anchorRect.bottom - scrollRect.bottom);
      const clipLeft = Math.max(0, scrollRect.left - anchorRect.left);
      const isFullyClipped =
        clipTop >= anchorRect.height ||
        clipBottom >= anchorRect.height ||
        clipLeft >= anchorRect.width ||
        clipRight >= anchorRect.width;

      wrapperEl.style.left = `${anchorRect.left}px`;
      wrapperEl.style.top = `${anchorRect.top}px`;
      wrapperEl.style.width = `${anchorRect.width}px`;
      wrapperEl.style.height = `${anchorRect.height}px`;
      wrapperEl.style.clipPath = `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`;
      wrapperEl.style.pointerEvents = isFullyClipped ? 'none' : '';
      setIsVideoDocked(true);
    };

    syncDockedGeometry();
    const rafId = window.requestAnimationFrame(syncDockedGeometry);

    const scrollEl = mainScrollRef.current;
    const anchorEl = dockAnchorRef.current;

    scrollEl?.addEventListener('scroll', syncDockedGeometry, { passive: true });
    window.addEventListener('resize', syncDockedGeometry);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(syncDockedGeometry);
      if (scrollEl) observer.observe(scrollEl);
      if (anchorEl) observer.observe(anchorEl);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      scrollEl?.removeEventListener('scroll', syncDockedGeometry);
      window.removeEventListener('resize', syncDockedGeometry);
      observer?.disconnect();
    };
  }, [canDockInMainCanvas, activeView, currentTrack?.id]);

  // ── Dynamic Poster Ambient Color (for Cinema Mode) ──
  const [posterColor, setPosterColor] = useState<RGBColor>({ r: 0, g: 240, b: 255 });

  useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;
    const { title: t, artistFromTitle: a } = cleanTrackTitle(currentTrack.title);
    const singer = getFullSingerName(currentTrack.artist || a || '', t);
    const cached = getCachedArtworkSync(t, singer, currentTrack.id);
    extractColorFromImage(cached || currentTrack.thumbnail || '', `${t} ${singer}`).then((col) => {
      if (!cancelled) setPosterColor(col);
    });
    if (!cached) {
      getArtwork(t, singer, currentTrack.id)
        .then((studioUrl) => {
          if (!cancelled && studioUrl) {
            extractColorFromImage(studioUrl, `${t} ${singer}`).then((col) => {
              if (!cancelled) setPosterColor(col);
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id, currentTrack?.thumbnail]);

  // ── High-Precision 60fps Phase-Locked Audio Clock & Synced Lyrics State ──
  const LYRIC_OFFSETS_KEY = 'melophile_lyric_offsets_v1';
  const [lyricOffsetSec, setLyricOffsetSec] = useState<number>(0);
  const [isStageAlignMode, setIsStageAlignMode] = useState<boolean>(false);
  const [stageScrolledAway, setStageScrolledAway] = useState<boolean>(false);
  const stageLyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const stageManualScrollUntilRef = useRef<number>(0);
  const stageActiveLyricRef = useRef<HTMLButtonElement | null>(null);

  // Load saved per-track lyric sync offset
  useEffect(() => {
    setIsStageAlignMode(false);
    setStageScrolledAway(false);
    stageManualScrollUntilRef.current = 0;
    if (!currentTrack?.id) {
      setLyricOffsetSec(0);
      return;
    }
    try {
      const raw = localStorage.getItem(LYRIC_OFFSETS_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const saved = typeof map[currentTrack.id] === 'number' ? map[currentTrack.id] : 0;
      setLyricOffsetSec(saved);
    } catch {
      setLyricOffsetSec(0);
    }
  }, [currentTrack?.id]);

  const persistLyricOffset = (nextOffset: number) => {
    const clamped = Math.max(-45, Math.min(45, Math.round(nextOffset * 100) / 100));
    setLyricOffsetSec(clamped);
    if (!currentTrack?.id) return;
    try {
      const raw = localStorage.getItem(LYRIC_OFFSETS_KEY);
      const map = raw ? JSON.parse(raw) : {};
      if (Math.abs(clamped) < 0.01) {
        delete map[currentTrack.id];
      } else {
        map[currentTrack.id] = clamped;
      }
      // Cap stored entries to latest 150 tracks
      const keys = Object.keys(map);
      if (keys.length > 150) {
        delete map[keys[0]];
      }
      localStorage.setItem(LYRIC_OFFSETS_KEY, JSON.stringify(map));
    } catch {}
  };

  const handleAdjustLyricOffset = (deltaSec: number) => {
    persistLyricOffset(lyricOffsetSec + deltaSec);
  };

  const handleResetLyricOffset = () => {
    persistLyricOffset(0);
  };

  // Phase-locked 60fps audio clock interpolation between YouTube's quantized time ticks
  const [smoothTime, setSmoothTime] = useState<number>(currentTime);
  const clockAnchorRef = useRef<{ audioTime: number; perfNow: number; trackId: string }>({
    audioTime: currentTime,
    perfNow: typeof performance !== 'undefined' ? performance.now() : 0,
    trackId: currentTrack?.id || '',
  });

  useEffect(() => {
    const now = performance.now();
    const anchor = clockAnchorRef.current;
    const trackChanged = anchor.trackId !== (currentTrack?.id || '');
    const estimated = anchor.audioTime + ((now - anchor.perfNow) / 1000) * playbackRate;
    const drift = currentTime - estimated;

    // Snap immediately on track switch, seek/large jump, pause, or forward advance
    if (trackChanged || !isPlaying || isBuffering || Math.abs(drift) > 0.2 || currentTime < anchor.audioTime - 0.12) {
      clockAnchorRef.current = {
        audioTime: currentTime,
        perfNow: now,
        trackId: currentTrack?.id || '',
      };
      setSmoothTime(currentTime);
    } else if (Math.abs(drift) > 0.025) {
      // Gentle phase lock correction so we never jump backwards or jitter
      const blended = estimated + drift * 0.5;
      clockAnchorRef.current = {
        audioTime: Math.max(0, blended),
        perfNow: now,
        trackId: currentTrack?.id || '',
      };
      setSmoothTime(Math.max(0, blended));
    }
  }, [currentTime, currentTrack?.id, isPlaying, isBuffering, playbackRate]);

  useEffect(() => {
    const needsHighFreqClock =
      isPlaying &&
      !isBuffering &&
      (activeView === 'now-playing' || isCinemaMode);
    if (!needsHighFreqClock) return;

    let rafId = 0;
    const tick = (now: number) => {
      const anchor = clockAnchorRef.current;
      const elapsedSec = Math.max(0, (now - anchor.perfNow) / 1000);
      const next = anchor.audioTime + elapsedSec * playbackRate;
      const maxDur = duration > 0 ? duration : currentTrack?.durationSec || 0;
      setSmoothTime(maxDur > 0 ? Math.min(maxDur, next) : next);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, isBuffering, playbackRate, duration, currentTrack?.durationSec, activeView, isCinemaMode]);

  const handleAlignLineToNow = (lineTime: number) => {
    const newOffset = Math.round((lineTime - smoothTime) * 100) / 100;
    persistLyricOffset(newOffset);
  };

  interface SyncVersionOption {
    id: string;
    label: string;
    duration: number;
    firstTs: number;
    lastTs: number;
    syncedLyrics: string;
  }

  const LYRIC_VERSION_PREFS_KEY = 'melophile_lyric_versions_v1';
  const [activeSyncVersionIdx, setActiveSyncVersionIdx] = useState<number>(0);

  const [lyricsData, setLyricsData] = useState<{
    plainLyrics: string | null;
    syncedLyrics: string | null;
    parsedLines: LyricLine[];
    isRealSync?: boolean;
    syncQuality?: 'video-locked' | 'timed' | 'estimated';
    syncVersions?: SyncVersionOption[];
    lrcDuration?: number | null;
    instrumental?: boolean;
    quotaExceeded?: boolean;
    isLoading: boolean;
  }>({
    plainLyrics: null,
    syncedLyrics: null,
    parsedLines: [],
    isRealSync: false,
    syncQuality: 'estimated',
    syncVersions: [],
    lrcDuration: null,
    instrumental: false,
    quotaExceeded: false,
    isLoading: false,
  });
  const lyricsCacheRef = useRef<Map<string, any>>(new Map());
  const lastFetchedDurBucketRef = useRef<Map<string, number>>(new Map());

  // Use tight 2-second duration bucket so Official Music Video (e.g. 4:22) vs Studio Audio (3:20) always get exact sync
  const resolvedDurationSec = duration > 15 ? Math.round(duration) : currentTrack?.durationSec || 0;
  const resolvedDurBucket = resolvedDurationSec > 0 ? Math.round(resolvedDurationSec / 2) * 2 : 0;

  const handleCycleSyncVersion = () => {
    const versions = lyricsData.syncVersions || [];
    if (versions.length < 2) return;
    const nextIdx = (activeSyncVersionIdx + 1) % versions.length;
    const chosen = versions[nextIdx];
    const parsed = parseLrcLyrics(chosen.syncedLyrics);
    if (parsed.length === 0) return;

    setActiveSyncVersionIdx(nextIdx);
    persistLyricOffset(0);
    setStageScrolledAway(false);
    stageManualScrollUntilRef.current = 0;

    setLyricsData((prev) => ({
      ...prev,
      syncedLyrics: chosen.syncedLyrics,
      parsedLines: parsed,
      isRealSync: true,
      lrcDuration: chosen.duration,
      syncQuality:
        resolvedDurationSec > 20 && Math.abs(chosen.duration - resolvedDurationSec) <= 5
          ? 'video-locked'
          : 'timed',
    }));

    if (currentTrack?.id) {
      try {
        const raw = localStorage.getItem(LYRIC_VERSION_PREFS_KEY);
        const map = raw ? JSON.parse(raw) : {};
        map[currentTrack.id] = chosen.id;
        const keys = Object.keys(map);
        if (keys.length > 150) delete map[keys[0]];
        localStorage.setItem(LYRIC_VERSION_PREFS_KEY, JSON.stringify(map));
      } catch {}
    }
  };

  useEffect(() => {
    if (!currentTrack?.id) return;
    const cacheKey = `${currentTrack.id}:${resolvedDurBucket}`;
    const prevBucket = lastFetchedDurBucketRef.current.get(currentTrack.id);

    const applyPayloadWithSavedVersion = (baseData: any) => {
      const versions: SyncVersionOption[] = Array.isArray(baseData.syncVersions) ? baseData.syncVersions : [];
      let chosenIdx = 0;
      if (versions.length > 1) {
        try {
          const raw = localStorage.getItem(LYRIC_VERSION_PREFS_KEY);
          const map = raw ? JSON.parse(raw) : {};
          const savedId = map[currentTrack.id];
          if (savedId) {
            const foundIdx = versions.findIndex((v) => v.id === savedId);
            if (foundIdx >= 0) chosenIdx = foundIdx;
          }
        } catch {}
      }
      setActiveSyncVersionIdx(chosenIdx);
      if (chosenIdx > 0 && versions[chosenIdx]) {
        const chosen = versions[chosenIdx];
        const parsedAlt = parseLrcLyrics(chosen.syncedLyrics);
        if (parsedAlt.length > 0) {
          setLyricsData({
            ...baseData,
            syncedLyrics: chosen.syncedLyrics,
            parsedLines: parsedAlt,
            isRealSync: true,
            lrcDuration: chosen.duration,
            isLoading: false,
          });
          return;
        }
      }
      setLyricsData({ ...baseData, isLoading: false });
    };

    // If we already fetched for this exact 2s duration bucket, apply instantaneously
    if (lyricsCacheRef.current.has(cacheKey)) {
      applyPayloadWithSavedVersion(lyricsCacheRef.current.get(cacheKey));
      return;
    }
    // Skip redundant re-fetch only if live duration is already within ±3s of what we queried (and non-zero)
    if (
      prevBucket !== undefined &&
      prevBucket > 0 &&
      resolvedDurBucket > 0 &&
      Math.abs(prevBucket - resolvedDurBucket) <= 3 &&
      lyricsCacheRef.current.has(`${currentTrack.id}:${prevBucket}`)
    ) {
      return;
    }

    const hadPrevious = prevBucket !== undefined && lyricsCacheRef.current.has(`${currentTrack.id}:${prevBucket}`);
    if (!hadPrevious) {
      setLyricsData((prev) => ({ ...prev, isLoading: true }));
    }
    const controller = new AbortController();

    const { title: t, artistFromTitle: a } = cleanTrackTitle(currentTrack.title, currentTrack.artist);
    // CRITICAL: Send clean studio stage artist name (e.g. "The Weeknd", "Ed Sheeran"), NOT legal full name
    const catalogArtist = extractCatalogArtistName(currentTrack.artist || a || '');

    const queryParams = new URLSearchParams({
      track: t,
      artist: catalogArtist,
      durationSec: resolvedDurationSec.toString(),
    });

    fetch(`/api/lyrics?${queryParams.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        let parsed = data.syncedLyrics ? parseLrcLyrics(data.syncedLyrics) : [];
        const isRealSync = parsed.length > 0;
        if (!isRealSync && data.plainLyrics) {
          parsed = synthesizeTimedLyrics(
            data.plainLyrics,
            resolvedDurationSec || currentTrack.durationSec || 210
          );
        }

        const resData = {
          plainLyrics: data.plainLyrics || null,
          syncedLyrics: data.syncedLyrics || null,
          parsedLines: parsed,
          isRealSync,
          syncQuality: (isRealSync ? data.syncQuality || 'timed' : 'estimated') as
            | 'video-locked'
            | 'timed'
            | 'estimated',
          syncVersions: Array.isArray(data.syncVersions) ? data.syncVersions : [],
          lrcDuration: typeof data.lrcDuration === 'number' ? data.lrcDuration : null,
          instrumental: !!data.instrumental,
          quotaExceeded: !!data.quotaExceeded,
        };
        lastFetchedDurBucketRef.current.set(currentTrack.id, resolvedDurBucket);
        lyricsCacheRef.current.set(cacheKey, resData);
        applyPayloadWithSavedVersion(resData);
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        if (!hadPrevious) {
          setLyricsData({
            plainLyrics: null,
            syncedLyrics: null,
            parsedLines: [],
            isRealSync: false,
            syncQuality: 'estimated',
            syncVersions: [],
            lrcDuration: null,
            instrumental: false,
            quotaExceeded: false,
            isLoading: false,
          });
        }
      });

    return () => {
      controller.abort();
    };
  }, [currentTrack?.id, resolvedDurBucket]);

  const activeLyricIndex = findActiveLyricIndex(lyricsData.parsedLines, smoothTime, lyricOffsetSec);
  const activeLyricProgress = getLyricLineProgress(
    lyricsData.parsedLines,
    activeLyricIndex,
    smoothTime,
    lyricOffsetSec
  );

  // Smooth container-scoped auto-scroll centered in Action Lyric Stream (never scrolls outer page)
  useEffect(() => {
    if (
      activeView !== 'now-playing' ||
      !stageActiveLyricRef.current ||
      !stageLyricsContainerRef.current
    ) {
      return;
    }
    if (Date.now() < stageManualScrollUntilRef.current) return;

    const container = stageLyricsContainerRef.current;
    const el = stageActiveLyricRef.current;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const targetTop =
      container.scrollTop +
      (elRect.top - containerRect.top) -
      container.clientHeight * 0.38 +
      elRect.height * 0.5;

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });
  }, [activeLyricIndex, activeView, lyricsData.parsedLines.length, activeSyncVersionIdx]);

  const lyricsContextLines = useMemo<[string, string, string]>(() => {
    if (lyricsData.isLoading) {
      return ['', 'Loading synchronized lyrics...', ''];
    }
    if (lyricsData.instrumental) {
      return ['', 'Instrumental track — no vocal lyrics.', ''];
    }
    if (lyricsData.parsedLines.length > 0) {
      if (activeLyricIndex >= 0 && activeLyricIndex < lyricsData.parsedLines.length) {
        const prev = activeLyricIndex > 0 ? lyricsData.parsedLines[activeLyricIndex - 1].text : '';
        const cur = lyricsData.parsedLines[activeLyricIndex].text;
        const nxt = lyricsData.parsedLines[activeLyricIndex + 1]?.text || '';
        return [prev, cur, nxt];
      }
      return [
        '',
        lyricsData.parsedLines[0]?.text || '',
        lyricsData.parsedLines[1]?.text || '',
      ];
    }
    if (lyricsData.plainLyrics) {
      const lines = lyricsData.plainLyrics
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      return ['', lines[0] || '', lines[1] || ''];
    }
    return ['', 'No synchronized lyrics found for this track.', ''];
  }, [
    lyricsData.isLoading,
    lyricsData.instrumental,
    lyricsData.parsedLines,
    lyricsData.plainLyrics,
    activeLyricIndex,
  ]);

  // Deterministic seeded ordering (FNV-1a) so lists NEVER re-shuffle during playback,
  // seeking, liking, or track switching — only when the user explicitly clicks Reroll/Shuffle.
  const deterministicOrderBySeed = useCallback((tracks: Track[], seed: number): Track[] => {
    const hashId = (id: string): number => {
      let h = (2166136261 ^ seed) >>> 0;
      for (let i = 0; i < id.length; i++) {
        h ^= id.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      return h;
    };
    return [...tracks].sort((a, b) => hashId(a.id) - hashId(b.id));
  }, []);

  // ── Stable Catalog & Curated Collections (Decoupled from queue/favorites/currentTrack) ──
  const allCatalogPool = useMemo(() => {
    const map = new Map<string, Track>();
    for (const list of [featuredTracks, popularTracks]) {
      for (const t of list) {
        if (!map.has(t.id)) map.set(t.id, t);
      }
    }
    for (const g of genres) {
      for (const t of g.tracks || []) {
        if (!map.has(t.id)) map.set(t.id, t);
      }
    }
    return Array.from(map.values());
  }, [featuredTracks, popularTracks, genres]);

  const squareCatalogPool = useMemo(() => {
    return allCatalogPool.filter((t) => hasVerifiedSquareCover(t));
  }, [allCatalogPool]);

  const videoOnlyCatalogPool = useMemo(() => {
    return allCatalogPool.filter((t) => !hasVerifiedSquareCover(t));
  }, [allCatalogPool]);

  const heroTrack = useMemo(() => {
    if (currentTrack && hasVerifiedSquareCover(currentTrack)) return currentTrack;
    const firstSquareFeatured = featuredTracks.find((t) => hasVerifiedSquareCover(t));
    if (firstSquareFeatured) return firstSquareFeatured;
    const firstSquarePopular = popularTracks.find((t) => hasVerifiedSquareCover(t));
    if (firstSquarePopular) return firstSquarePopular;
    return squareCatalogPool[0] || currentTrack || null;
  }, [currentTrack, featuredTracks, popularTracks, squareCatalogPool]);

  const heroTrackMeta = useMemo(() => {
    if (!heroTrack) return null;
    const { title, artistFromTitle } = cleanTrackTitle(heroTrack.title);
    const artist = getFullSingerName(heroTrack.artist || artistFromTitle || '', title);
    return { title, artist };
  }, [heroTrack]);

  // Heavy Rotation stays 100% stable when playing any track (never removes or shifts the playing song)
  const heavyRotationTracks = useMemo(() => {
    const primary = featuredTracks.filter((t) => hasVerifiedSquareCover(t));
    const source = primary.length > 0 ? primary : squareCatalogPool;
    const dedup = new Map<string, Track>();
    for (const t of [...source, ...squareCatalogPool]) {
      if (!hasVerifiedSquareCover(t)) continue;
      if (!dedup.has(t.id)) dedup.set(t.id, t);
      if (dedup.size >= 6) break;
    }
    return Array.from(dedup.values());
  }, [featuredTracks, squareCatalogPool]);

  // Top Charts ("The Hit Squad") stays 100% stable when playing any track (never jumps playing song to #1)
  const hitSquadTracks = useMemo(() => {
    const base = popularTracks.filter((t) => hasVerifiedSquareCover(t));
    const fallbackBase = base.length > 0 ? base : squareCatalogPool;
    const seen = new Set<string>();
    const list: Track[] = [];
    for (const t of [...fallbackBase, ...squareCatalogPool]) {
      if (!hasVerifiedSquareCover(t)) continue;
      if (!seen.has(t.id)) {
        seen.add(t.id);
        list.push(t);
      }
      if (list.length >= 6) break;
    }
    return list;
  }, [popularTracks, squareCatalogPool]);

  const curatedPlaylists = useMemo(() => {
    const valid = genres
      .map((g) => ({
        raw: g,
        squareTracks: (g.tracks || []).filter((t) => hasVerifiedSquareCover(t)),
      }))
      .filter((entry) => entry.squareTracks.length > 0);

    return valid.slice(0, 6).map(({ raw: g, squareTracks }) => {
      const artists = Array.from(
        new Set(
          squareTracks
            .map((t) => {
              const { title: ct, artistFromTitle } = cleanTrackTitle(t.title);
              return getFullSingerName(t.artist || artistFromTitle || '', ct);
            })
            .filter(Boolean)
        )
      );
      return {
        raw: { ...g, tracks: squareTracks },
        id: g.id,
        name: g.name,
        tracks: squareTracks,
        previewTracks: squareTracks.slice(0, 2),
        artistsLine: artists.slice(0, 3).join(', '),
      };
    });
  }, [genres]);

  const discoverGridTracks = useMemo(() => {
    const used = new Set(hitSquadTracks.map((t) => t.id));
    const remaining = squareCatalogPool.filter((t) => !used.has(t.id));
    const source = remaining.length >= 6 ? remaining : squareCatalogPool;
    return deterministicOrderBySeed(source, randomSeed).slice(0, 12);
  }, [squareCatalogPool, hitSquadTracks, randomSeed, deterministicOrderBySeed]);

  const musicVideoTracks = useMemo(() => {
    const seen = new Set<string>();
    const list: Track[] = [];
    // Prioritize tracks without 1:1 cover art so they live exclusively in the 16:9 video showcase
    const fallbackVideos = deterministicOrderBySeed(allCatalogPool, randomSeed + 17);
    for (const t of [...videoOnlyCatalogPool, ...fallbackVideos]) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        list.push(t);
      }
      if (list.length >= 6) break;
    }
    return list;
  }, [videoOnlyCatalogPool, allCatalogPool, randomSeed, deterministicOrderBySeed]);

  const uniqueSearchResults = useMemo(
    () => deduplicateTracksBySong(searchResults, searchQuery || localSearchInput),
    [searchResults, searchQuery, localSearchInput]
  );

  const searchSquareResults = useMemo(
    () => uniqueSearchResults.filter((t) => hasVerifiedSquareCover(t)),
    [uniqueSearchResults]
  );

  const searchVideoResults = useMemo(
    () => uniqueSearchResults.filter((t) => !hasVerifiedSquareCover(t)),
    [uniqueSearchResults]
  );

  const upNextQueueTracks = useMemo(() => {
    if (!currentTrack) return queue.slice(0, 7);
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx === -1) return queue.filter((t) => t.id !== currentTrack.id).slice(0, 7);
    const ordered = [...queue.slice(idx + 1), ...queue.slice(0, idx)];
    return ordered.slice(0, 7);
  }, [queue, currentTrack]);

  // Fast lookups
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const queueIds = useMemo(() => new Set(queue.map((q) => q.id)), [queue]);
  const isCurrentFavorite = currentTrack ? favoriteIds.has(currentTrack.id) : false;
  const isCurrentInQueue = currentTrack ? queueIds.has(currentTrack.id) : false;
  const isHeroFavorite = heroTrack ? favoriteIds.has(heroTrack.id) : false;
  const activeQuality = getQualityOption(playbackQuality);

  const currentTrackMeta = useMemo(() => {
    if (!currentTrack) return null;
    const { title, artistFromTitle } = cleanTrackTitle(currentTrack.title);
    const artist = getFullSingerName(currentTrack.artist || artistFromTitle || '', title);
    return { title, artist };
  }, [currentTrack]);

  const handleRefreshMix = () => {
    setRandomSeed(Date.now());
    onRandomizeFeed?.();
  };

  const handleSelectNav = (id: NavView) => {
    setActiveView(id);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (id === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  };

  const sidebarNavItems: Array<{
    id: NavView;
    label: string;
    badge?: string;
    Icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'home', label: 'HOME BASE', Icon: Home },
    { id: 'explore', label: 'COMICS / EXPLORE', Icon: Compass },
    { id: 'now-playing', label: 'NOW PLAYING', badge: isPlaying ? 'LIVE' : undefined, Icon: Disc3 },
    {
      id: 'liked',
      label: 'ISSUE VAULT',
      badge: favorites.length > 0 ? String(favorites.length) : undefined,
      Icon: Heart,
    },
    {
      id: 'queue',
      label: 'QUEUE DECK',
      badge: queue.length > 0 ? String(queue.length) : undefined,
      Icon: ListMusic,
    },
    { id: 'equalizer', label: 'EQUALIZER STUDIO', Icon: SlidersHorizontal },
  ];

  const mobileNavItems: Array<{
    id: NavView;
    label: string;
    Icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'home', label: 'HOME', Icon: Home },
    { id: 'explore', label: 'EXPLORE', Icon: Compass },
    { id: 'now-playing', label: 'STAGE', Icon: Disc3 },
    { id: 'queue', label: 'QUEUE', Icon: ListMusic },
    { id: 'liked', label: 'VAULT', Icon: Heart },
  ];

  // Reusable Beat-Matched Equalizer FX Console Panel (used in Home Base 4-col and expanded in Equalizer Studio)
  const renderEqualizerPanel = (expanded = false) => (
    <div className="bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] p-4 sm:p-5 space-y-4 relative overflow-hidden">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 border-b-2 border-black pb-3">
        <div>
          <span className="inline-block bg-[#ff506e] text-white border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000]">
            {beatFrame.isLiveAudioLocked ? 'LIVE FFT LOCK' : 'BEAT LOCKED'}
          </span>
          <h3 className="font-display text-2xl tracking-wide uppercase text-white mt-1 leading-none">
            EQUALIZER FX
          </h3>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end gap-1.5">
            <span
              className={`w-2.5 h-2.5 border border-black transition-transform duration-75 ${
                beatFrame.isBeatHit
                  ? 'bg-[#fde400] scale-125'
                  : isPlaying || beatFrame.isLiveAudioLocked
                  ? 'bg-[#00f0ff]'
                  : 'bg-[#292931]'
              }`}
            />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#fde400] tabular-nums">
              {beatFrame.effectiveBpm} BPM
            </span>
          </div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#00f0ff] block">
            {beatFrame.isLiveAudioLocked
              ? liveSyncStatus === 'tab'
                ? 'TAB AUDIO FFT'
                : 'MIC AUDIO FFT'
              : audioProfile.source === 'deezer-bpm'
              ? 'STUDIO TEMPO SYNC'
              : activeQuality.shortLabel}
          </span>
        </div>
      </div>

      {/* 4-Beat Bar Pulse Strip + TAP / LIVE SYNC Controls */}
      <div className="flex items-center justify-between gap-2 bg-[#12131a] border-2 border-black px-2.5 py-2">
        <div className="flex items-center gap-1.5" aria-label="Beat phase indicator">
          {[0, 1, 2, 3].map((b) => {
            const isCurrentBeat = beatFrame.activeBeat === b;
            return (
              <span
                key={b}
                className={`w-5 h-5 border border-black font-mono text-[10px] font-bold flex items-center justify-center transition-all duration-75 ${
                  isCurrentBeat
                    ? b === 0
                      ? 'bg-[#ff506e] text-white scale-105'
                      : 'bg-[#00f0ff] text-[#00363a]'
                    : 'bg-[#292931] text-[#7a828e]'
                }`}
              >
                {b + 1}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTapBeatSync}
            className="px-2 py-1 bg-[#1e1f27] hover:bg-[#fde400] hover:text-[#201c00] text-[#e3e1ec] border border-black font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Tap along with the song to lock beat 1 & BPM"
          >
            TAP
          </button>
          <button
            type="button"
            onClick={handleToggleLiveAudioSync}
            className={`px-2 py-1 border border-black font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              beatFrame.isLiveAudioLocked
                ? 'bg-[#ff506e] text-white'
                : 'bg-[#00f0ff] text-[#00363a] hover:bg-[#5ef6ff]'
            }`}
            title="Lock equalizer directly to live tab or mic audio FFT"
          >
            {beatFrame.isLiveAudioLocked ? 'STOP FFT' : 'LIVE FFT'}
          </button>
        </div>
      </div>

      {liveSyncNotice && (
        <p className="font-mono text-[10px] text-[#fde400] bg-[#12131a] border border-black px-2.5 py-1.5">
          {liveSyncNotice}
        </p>
      )}

      {/* Live 12-Segment Dual Stereo Comic VU Meter with Peak-Hold */}
      <div className="bg-[#12131a] border-2 border-black p-2.5 space-y-1.5 shadow-[inset_0_2px_0_#000000]">
        {[
          { ch: 'L', level: vuLevelLeft, peak: Math.round(beatFrame.vuPeakLeft) },
          { ch: 'R', level: vuLevelRight, peak: Math.round(beatFrame.vuPeakRight) },
        ].map(({ ch, level, peak }) => (
          <div key={ch} className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-[#b9cacb] w-3">{ch}</span>
            <div className="flex-1 grid grid-cols-12 gap-1">
              {Array.from({ length: 12 }).map((_, segIdx) => {
                const active = segIdx < level;
                const isPeak = !active && peak > 0 && segIdx === Math.min(11, peak - 1);
                const segColor =
                  segIdx >= 10
                    ? 'bg-[#ff506e]'
                    : segIdx >= 7
                    ? 'bg-[#fde400]'
                    : 'bg-[#00f0ff]';
                return (
                  <div
                    key={segIdx}
                    className={`h-2.5 border border-black transition-colors duration-75 ${
                      active ? segColor : isPeak ? 'bg-white' : 'bg-[#292931]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 5-Band Beat-Reactive Vertical Frequency Spectrum + Draggable Gain Faders */}
      <div
        className={`grid grid-cols-5 gap-2 sm:gap-3 pt-1 ${
          expanded ? 'h-56' : 'h-40'
        }`}
      >
        {EQ_BANDS.map((bandLabel, idx) => {
          const gainVal = eqBands[idx];
          const liveLevel = Math.max(4, Math.min(100, Math.round(beatFrame.bandLevels[idx] || 0)));
          const peakLevel = Math.max(liveLevel, Math.min(100, Math.round(beatFrame.bandPeaks[idx] || 0)));
          const barColor =
            idx === 0 || idx === 4
              ? 'bg-[#00f0ff]'
              : idx === 2
              ? 'bg-[#fde400]'
              : 'bg-[#ff506e]';

          return (
            <div key={bandLabel} className="flex flex-col items-center gap-2 h-full">
              <span className="font-mono text-[10px] font-bold text-[#e3e1ec] tabular-nums">
                {gainVal > 50 ? `+${Math.round((gainVal - 50) / 4)}` : Math.round((gainVal - 50) / 4)}dB
              </span>

              {/* Clickable / Touch-Draggable Track with Live Beat-Reactive Spectrum Meter */}
              <div
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = ((rect.bottom - e.clientY) / rect.height) * 100;
                  handleEqBandChange(idx, pct);
                }}
                onPointerMove={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = ((rect.bottom - e.clientY) / rect.height) * 100;
                  handleEqBandChange(idx, pct);
                }}
                role="slider"
                tabIndex={0}
                aria-label={`${bandLabel} equalizer band`}
                aria-valuemin={10}
                aria-valuemax={100}
                aria-valuenow={gainVal}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleEqBandChange(idx, gainVal + 6);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleEqBandChange(idx, gainVal - 6);
                  }
                }}
                className="relative flex-1 w-full max-w-[40px] bg-[#12131a] border-2 border-black cursor-ns-resize flex items-end p-0.5 select-none touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] overflow-visible"
              >
                {/* Static subtle EQ gain backdrop */}
                <div
                  className={`absolute inset-x-0.5 bottom-0.5 ${barColor} opacity-20 pointer-events-none`}
                  style={{ height: `${gainVal}%` }}
                />
                {/* Live Beat-Matched Energy Column */}
                <div
                  className={`relative z-10 w-full ${barColor} border-t-2 border-black transition-[height] duration-75`}
                  style={{ height: `${liveLevel}%` }}
                />
                {/* Peak-Hold Tick */}
                {(isPlaying || beatFrame.isLiveAudioLocked) && peakLevel > 8 && (
                  <div
                    className="absolute inset-x-0.5 h-[3px] bg-white z-20 pointer-events-none"
                    style={{ bottom: `calc(${Math.min(97, peakLevel)}% - 1px)` }}
                  />
                )}
                {/* Draggable EQ Gain Fader Knob */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 z-30 w-[calc(100%+6px)] h-2.5 bg-white border-2 border-black shadow-[1px_1px_0px_#000000] pointer-events-none"
                  style={{ bottom: `calc(${gainVal}% - 5px)` }}
                />
              </div>

              <span className="font-mono text-[10px] font-bold text-[#b9cacb] tracking-tight">
                {bandLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4 Preset Chips */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {EQ_PRESETS.map((preset) => {
          const isSelected = activeEqPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectEqPreset(preset)}
              className={`px-2.5 py-2 border-2 border-black text-left transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
                isSelected
                  ? 'bg-[#fde400] text-[#201c00]'
                  : 'bg-[#12131a] text-[#e3e1ec] hover:bg-[#292931]'
              }`}
            >
              <span className="font-display text-sm tracking-wider uppercase block leading-none">
                {preset.label}
              </span>
              <span
                className={`font-mono text-[9px] font-bold uppercase tracking-wider block mt-0.5 ${
                  isSelected ? 'text-[#201c00]/80' : 'text-[#b9cacb]'
                }`}
              >
                {preset.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#0d0e15] text-[#e3e1ec] select-none overflow-hidden font-sans relative">
      {/* ══════════════════════════════════════════════════
          MAIN WORKSPACE: LEFT COMIC SIDEBAR + MAIN STAGE
         ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* ────────────────────────────────────────────────
            ZONE 1: LEFT COMIC SIDEBAR (Desktop md+)
           ──────────────────────────────────────────────── */}
        <aside
          aria-label="ComicBeats navigation"
          className="hidden md:flex flex-col justify-between w-[256px] lg:w-[272px] bg-[#1a1b22] border-r-[3px] border-black shrink-0 z-30"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          {/* Brand Crest + Nav Links */}
          <div className="p-4 space-y-5 overflow-y-auto no-scrollbar">
            {/* KAPOW! / MELOPHILE Comic Brand Crest */}
            <button
              type="button"
              onClick={() => handleSelectNav('home')}
              className="w-full text-left bg-[#1e1f27] hover:bg-[#292931] border-[3px] border-black p-3.5 shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer relative group"
              aria-label="Melophile Home Base"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="bg-[#fde400] text-[#201c00] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-3 shadow-[2px_2px_0px_#000000]">
                  KAPOW!
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="font-display text-3xl tracking-wider uppercase text-white leading-none group-hover:text-[#00f0ff] transition-colors">
                  MELOPHILE
                </span>
                <span className="font-mono text-[10px] font-bold text-[#ff506e] uppercase">
                  AUDIO
                </span>
              </div>
            </button>

            {/* Primary Navigation Items */}
            <nav className="space-y-2">
              {sidebarNavItems.map(({ id, label, badge, Icon }) => {
                const isActive = activeView === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectNav(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full px-3.5 py-2.5 border-2 border-black flex items-center justify-between gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
                      isActive
                        ? 'bg-[#00f0ff] text-[#00363a] shadow-[4px_4px_0px_#000000] -translate-x-0.5 -translate-y-0.5'
                        : 'bg-[#1e1f27] text-[#e3e1ec] hover:bg-[#292931] shadow-[2px_2px_0px_#000000]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 stroke-[2.25]" />
                      <span className="font-display text-lg tracking-wider uppercase truncate leading-none mt-0.5">
                        {label}
                      </span>
                    </span>
                    {badge && (
                      <span
                        className={`px-1.5 py-0.5 border border-black font-mono text-[10px] font-bold uppercase shrink-0 ${
                          isActive
                            ? 'bg-[#fde400] text-[#201c00]'
                            : badge === 'LIVE'
                            ? 'bg-[#ff506e] text-white'
                            : 'bg-[#12131a] text-[#00f0ff]'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Action Box */}
          <div className="p-4 border-t-[3px] border-black bg-[#12131a] space-y-2.5">
            {currentTrack && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openCinema('lyrics')}
                  className="py-2 px-2.5 bg-[#1e1f27] hover:bg-[#fde400] hover:text-[#201c00] text-[#e3e1ec] border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-display text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Mic2 className="w-3.5 h-3.5" />
                  <span>LYRICS</span>
                </button>
                <button
                  type="button"
                  onClick={() => openCinema('video')}
                  className="py-2 px-2.5 bg-[#1e1f27] hover:bg-[#ff506e] hover:text-white text-[#e3e1ec] border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-display text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>VIDEO</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ────────────────────────────────────────────────
            ZONE 2: CENTER HEADER + SCROLLABLE COMIC STAGE
           ──────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 bg-[#0d0e15] flex flex-col overflow-hidden relative">
          {/* STICKY TOP COMIC HEADER (Safe-Area Aware) */}
          <header
            className="bg-[#1a1b22] border-b-[3px] border-black shrink-0 z-30"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
              {/* Mobile Brand Crest */}
              <button
                type="button"
                onClick={() => handleSelectNav('home')}
                className="md:hidden flex items-center shrink-0 cursor-pointer"
                aria-label="Melophile Home"
              >
                <span className="bg-[#fde400] text-[#201c00] border-2 border-black px-1.5 sm:px-2 py-0.5 font-display text-sm tracking-wider uppercase -rotate-3 shadow-[2px_2px_0px_#000000]">
                  KAPOW!
                </span>
              </button>

              {/* Always-Ready Ink-Bordered Search Bar (16px on mobile prevents iOS Safari auto-zoom) */}
              <div className="flex-1 min-w-0 max-w-xl">
                <div className="relative flex items-center w-full h-10 px-2.5 sm:px-3 bg-[#12131a] border-2 border-black shadow-[3px_3px_0px_#000000] focus-within:border-[#00f0ff] transition-colors">
                  <Search className="w-4 h-4 text-[#00f0ff] shrink-0 mr-1.5 sm:mr-2" />
                  <input
                    ref={searchInputRef}
                    id="soundstream-search-input"
                    type="text"
                    value={localSearchInput}
                    onFocus={() => {
                      if (localSearchInput.trim()) setActiveView('search');
                    }}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchSubmitNow(localSearchInput);
                      } else if (e.key === 'Escape' && localSearchInput) {
                        e.preventDefault();
                        handleClearSearchInput();
                      }
                    }}
                    placeholder="Search songs, artists..."
                    className="w-full min-w-0 bg-transparent text-base sm:text-sm font-medium text-[#e3e1ec] placeholder:text-[#7a828e] focus:outline-none"
                    aria-label="Search official singers, tracks, or albums"
                  />
                  {isSearching && localSearchInput.trim() && (
                    <Loader2 className="w-3.5 h-3.5 text-[#00f0ff] animate-spin shrink-0 ml-1" />
                  )}
                  {localSearchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearchInput}
                      className="p-1.5 sm:p-1 bg-[#292931] hover:bg-[#ff506e] text-white border border-black transition-colors cursor-pointer ml-1 shrink-0"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Comic Utility Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <PWAInstallButton />

                {onSurprisePlay && (
                  <button
                    type="button"
                    onClick={onSurprisePlay}
                    disabled={isSurpriseLoading}
                    className="h-10 sm:h-9 px-2.5 sm:px-3 bg-[#fde400] hover:bg-[#ffec42] text-[#201c00] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none -rotate-1 hover:rotate-0 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5 font-display text-sm tracking-wider uppercase whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fde400]"
                    title="Surprise Me — Play a random official track"
                    aria-label="Surprise Me"
                  >
                    <Dices className={`w-4 h-4 ${isSurpriseLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">SURPRISE ME</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRefreshMix}
                  disabled={isRandomizingFeed}
                  className="hidden sm:flex h-9 px-2.5 sm:px-3 bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-60 items-center gap-1.5 font-display text-sm tracking-wider uppercase whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                  title="Reroll Random Official Mix"
                  aria-label="Reroll Random Official Mix"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[#00f0ff] ${isRandomizingFeed ? 'animate-spin' : ''}`}
                  />
                  <span className="hidden lg:inline">REROLL MIX</span>
                </button>

                {/* Google Account & Cloud Taste Vault Button */}
                {authReady && (
                  <div ref={accountMenuRef} className="relative">
                  {authUser ? (
                    <button
                      type="button"
                      onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                      className="h-10 sm:h-9 pl-1.5 pr-2.5 bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                      title="Account & Saved Taste Vault"
                      aria-label="Account and Taste Profile"
                      aria-expanded={isAccountMenuOpen}
                    >
                      {authUser.photoURL ? (
                        <img
                          src={authUser.photoURL}
                          alt={authUser.displayName || 'Profile'}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 object-cover border border-black shrink-0"
                        />
                      ) : (
                        <span className="w-6 h-6 bg-[#00f0ff] text-[#00363a] border border-black font-display text-xs flex items-center justify-center shrink-0">
                          {(authUser.displayName || authUser.email || 'M').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="hidden xl:inline font-display text-sm tracking-wider uppercase max-w-[96px] truncate">
                        {authUser.displayName?.split(' ')[0] || 'ACCOUNT'}
                      </span>
                      <span className="w-2 h-2 bg-[#00f0ff] border border-black shrink-0" />
                    </button>
                  ) : (
                    onGoogleSignIn && (
                      <button
                        type="button"
                        onClick={onGoogleSignIn}
                        disabled={isSigningIn}
                        className="h-10 sm:h-9 px-2.5 sm:px-3 bg-white hover:bg-[#f2f4f8] text-[#111318] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2 font-display text-sm tracking-wider uppercase whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                        title="Sign in with Google to save favorites, history & personalized taste"
                        aria-label="Sign in with Google"
                      >
                        {isSigningIn ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#111318]" />
                        ) : (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              fill="#4285F4"
                              d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                            />
                          </svg>
                        )}
                        <span className="hidden sm:inline">SIGN IN</span>
                      </button>
                    )
                  )}

                  {/* Account & Saved Taste Popover */}
                  {authUser && isAccountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] bg-[#1a1b22] border-[3px] border-black shadow-[6px_6px_0px_#000000] p-4 z-50 space-y-3.5">
                      <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
                        {authUser.photoURL ? (
                          <img
                            src={authUser.photoURL}
                            alt={authUser.displayName || 'Profile'}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 object-cover border-2 border-black shrink-0"
                          />
                        ) : (
                          <span className="w-11 h-11 bg-[#00f0ff] text-[#00363a] border-2 border-black font-display text-xl flex items-center justify-center shrink-0">
                            {(authUser.displayName || authUser.email || 'M').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-lg uppercase tracking-wide text-white truncate leading-tight">
                            {authUser.displayName || 'Melophile Listener'}
                          </p>
                          <p className="text-[11px] text-[#b9cacb] truncate">
                            {authUser.email}
                          </p>
                          <span className="inline-flex items-center gap-1 mt-1 bg-[#00f0ff] text-[#00363a] border border-black px-1.5 py-0.5 font-display text-[10px] tracking-wider uppercase">
                            <Cloud className="w-3 h-3" />
                            <span>CLOUD SAVED</span>
                          </span>
                        </div>
                      </div>

                      {/* Taste Vault Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#12131a] border-2 border-black p-2.5">
                          <p className="text-[10px] font-mono uppercase text-[#b9cacb]">LIKED SONGS</p>
                          <p className="font-display text-2xl text-[#fde400] leading-none mt-1">
                            {favorites.length}
                          </p>
                        </div>
                        <div className="bg-[#12131a] border-2 border-black p-2.5">
                          <p className="text-[10px] font-mono uppercase text-[#b9cacb]">PLAYS LOGGED</p>
                          <p className="font-display text-2xl text-[#00f0ff] leading-none mt-1">
                            {Math.max(tasteProfile?.totalPlays || 0, listenHistoryCount)}
                          </p>
                        </div>
                      </div>

                      {/* Top Taste Artists */}
                      {tasteProfile && tasteProfile.topArtists.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#b9cacb]">
                            YOUR TOP TASTE ARTISTS
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {tasteProfile.topArtists.slice(0, 4).map((artist) => (
                              <span
                                key={artist}
                                className="bg-[#292931] text-white border border-black px-2 py-0.5 text-[11px] font-bold uppercase truncate max-w-[125px]"
                              >
                                {artist}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 pt-1">
                        {onRefreshRecommendations && (
                          <button
                            type="button"
                            onClick={() => {
                              onRefreshRecommendations();
                              setIsAccountMenuOpen(false);
                            }}
                            className="w-full h-9 px-3 bg-[#00f0ff] hover:bg-[#5ef6ff] text-[#00363a] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-display text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>REFRESH MY TASTE MIX</span>
                          </button>
                        )}
                        {onSignOut && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              onSignOut();
                            }}
                            className="w-full h-9 px-3 bg-[#12131a] hover:bg-[#ff506e] text-white border-2 border-black shadow-[2px_2px_0px_#000000] font-display text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>SIGN OUT</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </header>

          {/* SCROLLABLE MAIN STAGE BODY */}
          <div
            ref={mainScrollRef}
            className="flex-1 overflow-y-auto no-scrollbar px-3 sm:px-7 py-4 sm:py-6 pb-8 sm:pb-20"
          >
            {/* ══════════════════════════════════════════════
                VIEW 1: HOME BASE (ISSUE #01)
               ══════════════════════════════════════════════ */}
            {activeView === 'home' && (
              <div className="space-y-8 max-w-[1440px] mx-auto">
                {/* 1. HERO SPLASH BANNER WITH 1:1 LIVE VIDEO COMIC COVER BOX */}
                {heroTrack && heroTrackMeta && (
                  <section
                    aria-label="Featured Issue"
                    className="relative bg-[#1e1f27] border-[3px] border-black shadow-[6px_6px_0px_#000000] overflow-hidden"
                  >
                    {/* Blurred High-Res Studio Poster Backdrop */}
                    <div className="absolute inset-0 pointer-events-none">
                      <ArtworkImage
                        title={heroTrackMeta.title}
                        artist={heroTrackMeta.artist}
                        trackId={heroTrack.id}
                        initialSrc={heroTrack.thumbnail}
                        alt=""
                        priority
                        className="w-full h-full object-cover scale-110 blur-[22px] opacity-35 saturate-150"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e15]/95 via-[#0d0e15]/75 to-[#0d0e15]/60" />
                    </div>

                    <div className="relative z-10 p-4 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-7">
                      {/* Left Hero Copy & Actions */}
                      <div className="flex-1 min-w-0 space-y-4 text-center lg:text-left">
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                          <span className="bg-[#fde400] text-[#201c00] border-2 border-black px-2.5 py-0.5 font-display text-sm tracking-wider uppercase -rotate-2 shadow-[3px_3px_0px_#000000]">
                            FEATURED ISSUE #01
                          </span>
                          <span className="bg-[#00f0ff] text-[#00363a] border-2 border-black px-2.5 py-0.5 font-display text-sm tracking-wider uppercase rotate-1 shadow-[3px_3px_0px_#000000]">
                            OFFICIAL RELEASES
                          </span>
                          {isPlaying && currentTrack?.id === heroTrack.id && (
                            <span className="bg-[#ff506e] text-white border-2 border-black px-2.5 py-0.5 font-display text-sm tracking-wider uppercase shadow-[3px_3px_0px_#000000] flex items-center gap-1">
                              <Radio className="w-3.5 h-3.5 animate-pulse" />
                              <span>SPINNING LIVE</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl uppercase tracking-wide leading-[0.95] text-white drop-shadow-[3px_3px_0px_#000000] line-clamp-2">
                            {heroTrackMeta.title}
                          </h1>
                          <p className="text-sm sm:text-lg font-bold uppercase tracking-wider text-[#00f0ff]">
                            {heroTrackMeta.artist}
                          </p>
                        </div>

                        {/* Hero Action Row */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentTrack?.id === heroTrack.id) onTogglePlay();
                              else onPlayTrack(heroTrack);
                            }}
                            className="relative h-12 px-6 bg-[#00f0ff] hover:bg-[#5ef6ff] text-[#00363a] border-[3px] border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-xl tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer"
                          >
                            {currentTrack?.id === heroTrack.id && isPlaying ? (
                              <>
                                <Pause className="w-5 h-5 fill-[#00363a]" />
                                <span>PAUSE ISSUE</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5 fill-[#00363a]" />
                                <span>PLAY ISSUE ARC</span>
                              </>
                            )}
                            <span className="hidden sm:inline-block absolute -top-3.5 -right-4 bg-[#fde400] text-[#201c00] border-2 border-black px-1.5 py-0.5 font-display text-[11px] tracking-wider uppercase rotate-12 shadow-[2px_2px_0px_#000000]">
                              KAPOW!
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={onToggleShuffle}
                            className={`h-12 px-4 border-[3px] border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-lg tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer ${
                              isShuffle
                                ? 'bg-[#fde400] text-[#201c00]'
                                : 'bg-[#12131a] hover:bg-[#292931] text-white'
                            }`}
                          >
                            <Shuffle className="w-4 h-4" />
                            <span>SHUFFLE MIX</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleFavorite(heroTrack)}
                            className={`h-12 w-12 border-[3px] border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-all cursor-pointer ${
                              isHeroFavorite
                                ? 'bg-[#ff506e] text-white'
                                : 'bg-[#12131a] hover:bg-[#292931] text-[#e3e1ec]'
                            }`}
                            aria-label={isHeroFavorite ? 'Remove from Vault' : 'Save to Vault'}
                            title={isHeroFavorite ? 'Saved in Vault' : 'Save to Issue Vault'}
                          >
                            <Heart className={`w-5 h-5 ${isHeroFavorite ? 'fill-current' : ''}`} />
                          </button>

                          {currentTrack && (
                            <button
                              type="button"
                              onClick={() => handleSelectNav('now-playing')}
                              className="h-12 px-4 bg-[#12131a] hover:bg-[#292931] text-[#fde400] border-[3px] border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-lg tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Mic2 className="w-4 h-4" />
                              <span>LYRICS STAGE</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right 1:1 Comic Cover Box (Docks Zero-Unmount 1:1 Live Video!) */}
                      <div className="relative shrink-0">
                        {/* Tilted Magenta Back Accent Plate */}
                        <div className="absolute -inset-2 bg-[#ff506e] border-[3px] border-black rotate-2 shadow-[5px_5px_0px_#000000] pointer-events-none" />

                        <div className="relative z-10 bg-[#12131a] border-[3px] border-black p-2 shadow-[5px_5px_0px_#000000]">
                          {/* Exact 1:1 Anchor Box for Zero-Unmount YouTube Live Video */}
                          <div
                            ref={dockAnchorRef}
                            onClick={() => {
                              if (currentTrack) onTogglePlay();
                              else onPlayTrack(heroTrack);
                            }}
                            className="w-48 h-48 sm:w-64 sm:h-64 bg-black border-2 border-black overflow-hidden relative cursor-pointer"
                          >
                            <ArtworkImage
                              title={heroTrackMeta.title}
                              artist={heroTrackMeta.artist}
                              trackId={heroTrack.id}
                              initialSrc={heroTrack.thumbnail}
                              alt={heroTrackMeta.title}
                              priority
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Comic Barcode Footer */}
                          <div className="flex items-center justify-between pt-1.5 px-1 text-[9px] font-mono font-bold uppercase text-[#b9cacb]">
                            <span>|||| ||| || ||||</span>
                            <span className="text-white">MELOPHILE STUDIO</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 1B. PERSONALIZED FOR YOU — TASTE-MATCHED RECOMMENDATIONS */}
                {(recommendations.length > 0 || isRecommendationsLoading) && (
                  <section aria-label="Recommended For Your Taste" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="bg-[#00f0ff] text-[#00363a] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-1 shadow-[2px_2px_0px_#000000] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>{isPersonalizedRecs ? 'FOR YOUR TASTE' : 'FOR YOU'}</span>
                          </span>
                          <h2 className="font-display text-3xl tracking-wide uppercase text-white leading-none">
                            RECOMMENDED FOR YOU
                          </h2>
                          {authUser && (
                            <span className="bg-[#fde400] text-[#201c00] border-2 border-black px-2 py-0.5 font-display text-[11px] tracking-wider uppercase shadow-[2px_2px_0px_#000000]">
                              CLOUD SYNCED
                            </span>
                          )}
                        </div>
                        {tasteBasis.length > 0 ? (
                          <p className="text-xs font-bold uppercase tracking-wider text-[#b9cacb] truncate">
                            TUNED TO YOUR TASTE:{' '}
                            <span className="text-[#00f0ff]">{tasteBasis.join(' · ')}</span>
                          </p>
                        ) : (
                          <p className="text-xs font-medium text-[#b9cacb]">
                            Play or like tracks to tune your personal mix
                            {!authUser && onGoogleSignIn ? ' — sign in with Google to save across devices.' : '.'}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!authUser && onGoogleSignIn && (
                          <button
                            type="button"
                            onClick={onGoogleSignIn}
                            disabled={isSigningIn}
                            className="px-3 py-1.5 bg-[#fde400] hover:bg-[#ffec42] text-[#201c00] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-display text-xs tracking-wider uppercase transition-all cursor-pointer"
                          >
                            SAVE TASTE WITH GOOGLE
                          </button>
                        )}
                        {onRefreshRecommendations && (
                          <button
                            type="button"
                            onClick={onRefreshRecommendations}
                            disabled={isRecommendationsLoading}
                            className="px-3.5 py-1.5 bg-[#1e1f27] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#e3e1ec] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-display text-sm tracking-wider uppercase transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRecommendationsLoading ? 'animate-spin' : ''}`} />
                            <span>REFRESH TASTE</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isRecommendationsLoading && recommendations.length === 0 ? (
                      <div className="bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] p-8 flex items-center justify-center gap-2.5 text-[#00f0ff] font-display text-xl tracking-wider uppercase">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>CURATING YOUR PERSONAL MIX...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                        {recommendations.slice(0, 6).map((track, idx) => (
                          <UnifiedTrackCard
                            key={`rec-${track.id}`}
                            track={track}
                            variant="card"
                            issueNumber={String(idx + 1).padStart(2, '0')}
                            isCurrent={currentTrack?.id === track.id}
                            isPlaying={isPlaying}
                            isFavorite={favoriteIds.has(track.id)}
                            isInQueue={queueIds.has(track.id)}
                            onPlay={onPlayTrack}
                            onTogglePlay={onTogglePlay}
                            onAddToQueue={onAddToQueue}
                            onToggleFavorite={onToggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* 2. HEAVY ROTATION ISSUES (3-COLUMN COMIC ISSUE GRID) */}
                {heavyRotationTracks.length > 0 && (
                  <section aria-label="Heavy Rotation Issues" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#ff506e] text-white border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000]">
                          HOT DROPS
                        </span>
                        <h2 className="font-display text-3xl tracking-wide uppercase text-white leading-none">
                          HEAVY ROTATION ISSUES
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectNav('explore')}
                        className="px-3.5 py-1.5 bg-[#1e1f27] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#e3e1ec] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-display text-sm tracking-wider uppercase transition-all cursor-pointer"
                      >
                        EXPLORE ALL →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                      {heavyRotationTracks.map((track, idx) => (
                        <UnifiedTrackCard
                          key={`heavy-${track.id}`}
                          track={track}
                          variant="card"
                          issueNumber={String(idx + 1).padStart(2, '0')}
                          isCurrent={currentTrack?.id === track.id}
                          isPlaying={isPlaying}
                          isFavorite={favoriteIds.has(track.id)}
                          isInQueue={queueIds.has(track.id)}
                          onPlay={onPlayTrack}
                          onTogglePlay={onTogglePlay}
                          onAddToQueue={onAddToQueue}
                          onToggleFavorite={onToggleFavorite}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. BOTTOM 12-COL SPLIT: TOP CHARTS (8-COL) + EQUALIZER FX CONSOLE (4-COL) */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left 8-Col: TOP CHARTS — THE HIT SQUAD */}
                  <div className="lg:col-span-8 space-y-4 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#00f0ff] text-[#00363a] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase rotate-2 shadow-[2px_2px_0px_#000000]">
                          TOP CHARTS
                        </span>
                        <h2 className="font-display text-3xl tracking-wide uppercase text-white leading-none">
                          THE HIT SQUAD
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={handleRefreshMix}
                        className="px-3 py-1.5 bg-[#1e1f27] hover:bg-[#fde400] hover:text-[#201c00] text-[#b9cacb] border-2 border-black shadow-[2px_2px_0px_#000000] font-display text-xs tracking-wider uppercase transition-colors cursor-pointer"
                      >
                        SHUFFLE CHARTS
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {hitSquadTracks.map((track, idx) => (
                        <UnifiedTrackCard
                          key={`squad-${track.id}`}
                          track={track}
                          variant="shelf"
                          issueNumber={String(idx + 1).padStart(2, '0')}
                          isCurrent={currentTrack?.id === track.id}
                          isPlaying={isPlaying}
                          isFavorite={favoriteIds.has(track.id)}
                          isInQueue={queueIds.has(track.id)}
                          onPlay={onPlayTrack}
                          onTogglePlay={onTogglePlay}
                          onAddToQueue={onAddToQueue}
                          onToggleFavorite={onToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right 4-Col: CONSOLE — EQUALIZER FX */}
                  <div className="lg:col-span-4 min-w-0">
                    {renderEqualizerPanel(false)}
                  </div>
                </section>

                {/* 4. 16:9 VIDEO REELS FOR TRACKS WITHOUT 1:1 SQUARE COVER ART */}
                {videoOnlyCatalogPool.length > 0 && (
                  <section aria-label="Official Video Reels" className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#ff506e] text-white border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase rotate-2 shadow-[2px_2px_0px_#000000]">
                          16:9 VIDEO ONLY
                        </span>
                        <h2 className="font-display text-3xl tracking-wide uppercase text-white leading-none">
                          MUSIC VIDEO REELS
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectNav('explore')}
                        className="px-3.5 py-1.5 bg-[#1e1f27] hover:bg-[#ff506e] hover:text-white text-[#e3e1ec] border-2 border-black shadow-[3px_3px_0px_#000000] font-display text-sm tracking-wider uppercase transition-all cursor-pointer"
                      >
                        ALL VIDEOS →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {videoOnlyCatalogPool.slice(0, 6).map((track) => {
                        const { title: ct, artistFromTitle } = cleanTrackTitle(track.title);
                        const art = getFullSingerName(track.artist || artistFromTitle || '', ct);
                        return (
                          <button
                            key={`home-mv-${track.id}`}
                            type="button"
                            onClick={() => {
                              onPlayTrack(track);
                              openCinema('video');
                            }}
                            className="group text-left bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
                          >
                            <div className="aspect-video w-full bg-black border-b-[3px] border-black relative overflow-hidden">
                              <ArtworkImage
                                title={ct}
                                artist={art}
                                trackId={track.id}
                                aspectRatio="video"
                                initialSrc={
                                  track.videoThumbnail ||
                                  `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`
                                }
                                alt={ct}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-2.5 left-2.5 bg-[#ff506e] text-white border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1">
                                <Film className="w-3 h-3" />
                                <span>WATCH VIDEO</span>
                              </span>
                              <span className="absolute bottom-3 right-3 w-11 h-11 bg-[#00f0ff] text-[#00363a] border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center">
                                <Play className="w-5 h-5 fill-[#00363a] ml-0.5" />
                              </span>
                            </div>
                            <div className="p-3.5">
                              <p className="font-display text-xl tracking-wide uppercase text-white group-hover:text-[#00f0ff] truncate">
                                {ct}
                              </p>
                              <p className="text-xs text-[#b9cacb] font-medium truncate mt-0.5">
                                {art}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════
                VIEW 2: NOW PLAYING & LYRICS STAGE (SCREEN 2)
               ══════════════════════════════════════════════ */}
            {activeView === 'now-playing' && (
              <div className="max-w-[1440px] mx-auto">
                {currentTrack && currentTrackMeta ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left 8-Col: Hero Now Playing Panel + Live Comic Speech-Bubble Lyrics */}
                    <div className="lg:col-span-8 space-y-6 min-w-0">
                      {/* Hero Now Playing Card */}
                      <section className="bg-[#1e1f27] border-[3px] border-black shadow-[6px_6px_0px_#000000] p-4 sm:p-7 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
                          {/* Tilted Layered 1:1 Live Video / Artwork Frame */}
                          <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-[#00f0ff] border-[3px] border-black translate-x-2.5 translate-y-2.5 rotate-2 pointer-events-none" />
                            <div className="absolute inset-0 bg-[#ff506e] border-[3px] border-black -translate-x-2 translate-y-1.5 -rotate-2 pointer-events-none" />

                            <div
                              ref={dockAnchorRef}
                              onClick={onTogglePlay}
                              className="relative z-10 w-44 h-44 sm:w-60 sm:h-60 bg-black border-[3px] border-black shadow-[4px_4px_0px_#000000] overflow-hidden cursor-pointer"
                            >
                              <ArtworkImage
                                title={currentTrackMeta.title}
                                artist={currentTrackMeta.artist}
                                trackId={currentTrack.id}
                                initialSrc={currentTrack.thumbnail}
                                alt={currentTrackMeta.title}
                                priority
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <span className="absolute -top-3.5 -right-3 z-20 bg-[#fde400] text-[#201c00] border-2 border-black px-2.5 py-0.5 font-display text-sm tracking-wider uppercase rotate-6 shadow-[2px_2px_0px_#000000] pointer-events-none">
                              {isPlaying ? 'THWIP!' : 'PAUSED'}
                            </span>
                          </div>

                          {/* Chromatic Aberration Track Title + Actions */}
                          <div className="flex-1 min-w-0 text-center sm:text-left space-y-4">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                              <span className="bg-[#00f0ff] text-[#00363a] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2">
                                NOW SPINNING
                              </span>
                              <span className="bg-[#12131a] text-[#fde400] border-2 border-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                                {activeQuality.shortLabel}
                              </span>
                            </div>

                            {/* 3-Layer Chromatic Headline */}
                            <div className="relative">
                              <h1
                                aria-hidden="true"
                                className="font-display text-4xl sm:text-5xl uppercase tracking-wide leading-[0.95] text-[#00f0ff] select-none pointer-events-none absolute inset-0 -translate-x-[2px] -translate-y-[2px] opacity-80 line-clamp-2"
                              >
                                {currentTrackMeta.title}
                              </h1>
                              <h1
                                aria-hidden="true"
                                className="font-display text-4xl sm:text-5xl uppercase tracking-wide leading-[0.95] text-[#ff506e] select-none pointer-events-none absolute inset-0 translate-x-[2px] translate-y-[2px] opacity-80 line-clamp-2"
                              >
                                {currentTrackMeta.title}
                              </h1>
                              <h1 className="relative font-display text-4xl sm:text-5xl uppercase tracking-wide leading-[0.95] text-white line-clamp-2">
                                {currentTrackMeta.title}
                              </h1>
                            </div>

                            <p className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#fde400]">
                              {currentTrackMeta.artist}
                            </p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={onTogglePlay}
                                className="h-10 px-5 bg-[#00f0ff] hover:bg-[#5ef6ff] text-[#00363a] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-base tracking-wider uppercase flex items-center gap-1.5 cursor-pointer"
                              >
                                {isPlaying ? (
                                  <>
                                    <Pause className="w-4 h-4 fill-[#00363a]" />
                                    <span>PAUSE</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 fill-[#00363a]" />
                                    <span>PLAY</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => openCinema('video')}
                                className="h-10 px-4 bg-[#ff506e] hover:bg-[#ff6b85] text-white border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-base tracking-wider uppercase flex items-center gap-1.5 cursor-pointer"
                              >
                                <Film className="w-4 h-4" />
                                <span>CINEMA VIDEO</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onToggleFavorite(currentTrack)}
                                className={`h-10 px-3.5 border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-base tracking-wider uppercase flex items-center gap-1.5 cursor-pointer ${
                                  isCurrentFavorite
                                    ? 'bg-[#fde400] text-[#201c00]'
                                    : 'bg-[#12131a] text-white hover:bg-[#292931]'
                                }`}
                              >
                                <Heart
                                  className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`}
                                />
                                <span>{isCurrentFavorite ? 'SAVED' : 'VAULT'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* LIVE ACTION COMIC SPEECH-BUBBLE LYRIC STREAM */}
                      <section className="bg-[#1e1f27] border-[3px] border-black shadow-[6px_6px_0px_#000000] p-3.5 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b-2 border-black pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-[#fde400] text-[#201c00] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000]">
                              LIVE SCRIPT
                            </span>
                            <div className="flex items-center gap-2">
                              <h2 className="font-display text-xl sm:text-2xl tracking-wide uppercase text-white leading-none">
                                ACTION LYRIC STREAM
                              </h2>
                              {!lyricsData.isLoading && lyricsData.parsedLines.length > 0 && (
                                <span
                                  className={`px-1.5 py-0.5 border border-black font-display text-[10px] tracking-wider uppercase ${
                                    lyricsData.syncQuality === 'video-locked'
                                      ? 'bg-[#00f0ff] text-[#00363a]'
                                      : lyricsData.isRealSync
                                      ? 'bg-[#00f0ff] text-[#00363a]'
                                      : 'bg-[#fde400] text-[#201c00]'
                                  }`}
                                >
                                  {lyricsData.syncQuality === 'video-locked'
                                    ? 'SYNC LOCKED'
                                    : lyricsData.isRealSync
                                    ? 'TIMED'
                                    : 'ESTIMATED'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {!lyricsData.isLoading && lyricsData.parsedLines.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 bg-[#12131a] border-2 border-black p-1">
                                {lyricsData.syncVersions && lyricsData.syncVersions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={handleCycleSyncVersion}
                                    className="px-2 py-1 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] font-display tracking-wider uppercase bg-[#292931] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#00f0ff] cursor-pointer"
                                    title={`Switch synced timing (${lyricsData.syncVersions[activeSyncVersionIdx]?.label || 'Primary'}) — click to try alternate timeline`}
                                  >
                                    SYNC {activeSyncVersionIdx + 1}/{lyricsData.syncVersions.length}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAdjustLyricOffset(-0.5)}
                                  className="px-2 py-1 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] font-mono font-bold bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] cursor-pointer"
                                  title="Delay lyrics 0.5s"
                                >
                                  -0.5s
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustLyricOffset(-0.1)}
                                  className="px-2 py-1 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] font-mono font-bold bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] cursor-pointer"
                                  title="Delay lyrics 0.1s"
                                >
                                  -0.1s
                                </button>
                                <span className="px-1.5 text-[11px] sm:text-[10px] font-mono font-bold tabular-nums text-[#00f0ff]">
                                  {lyricOffsetSec >= 0 ? '+' : ''}
                                  {lyricOffsetSec.toFixed(1)}s
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustLyricOffset(0.1)}
                                  className="px-2 py-1 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] font-mono font-bold bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] cursor-pointer"
                                  title="Advance lyrics 0.1s"
                                >
                                  +0.1s
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustLyricOffset(0.5)}
                                  className="px-2 py-1 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] font-mono font-bold bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] cursor-pointer"
                                  title="Advance lyrics 0.5s"
                                >
                                  +0.5s
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsStageAlignMode((v) => !v)}
                                  className={`px-2 py-1 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] font-display tracking-wider uppercase flex items-center gap-0.5 cursor-pointer ${
                                    isStageAlignMode
                                      ? 'bg-[#fde400] text-[#201c00]'
                                      : 'bg-[#292931] hover:bg-[#00f0ff] hover:text-[#00363a] text-white'
                                  }`}
                                  title="Tap the lyric line currently being sung to align sync instantly"
                                >
                                  <Crosshair className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                                  <span>{isStageAlignMode ? 'CANCEL' : 'ALIGN'}</span>
                                </button>
                                {Math.abs(lyricOffsetSec) >= 0.05 && (
                                  <button
                                    type="button"
                                    onClick={handleResetLyricOffset}
                                    className="p-1 sm:p-0.5 bg-[#292931] hover:bg-[#ff506e] text-white cursor-pointer"
                                    title="Reset sync offset"
                                    aria-label="Reset sync offset"
                                  >
                                    <RotateCcw className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                                  </button>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => openCinema('lyrics')}
                              className="px-3 py-1.5 sm:py-1 bg-[#12131a] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#00f0ff] border-2 border-black shadow-[2px_2px_0px_#000000] font-display text-xs tracking-wider uppercase transition-colors cursor-pointer"
                            >
                              FULLSCREEN →
                            </button>
                          </div>
                        </div>

                        {isStageAlignMode && (
                          <p className="text-[11px] font-bold text-[#fde400] bg-[#12131a] border-2 border-black px-3 py-1.5">
                            Tap whichever line is being sung right now to lock lyrics to this video.
                          </p>
                        )}

                        <div className="relative">
                          <div
                            ref={stageLyricsContainerRef}
                            onWheel={() => {
                              stageManualScrollUntilRef.current = Date.now() + 4500;
                              setStageScrolledAway(true);
                            }}
                            onTouchStart={() => {
                              stageManualScrollUntilRef.current = Date.now() + 4500;
                              setStageScrolledAway(true);
                            }}
                            className="max-h-[440px] overflow-y-auto no-scrollbar space-y-3.5 pr-1 py-4"
                          >
                            {lyricsData.isLoading ? (
                              <div className="py-12 flex items-center justify-center gap-3 text-[#00f0ff] font-display text-2xl tracking-wider uppercase">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>SYNCING SPEECH BUBBLES...</span>
                              </div>
                            ) : lyricsData.parsedLines.length > 0 ? (
                              lyricsData.parsedLines.map((line, idx) => {
                                const isActive = idx === activeLyricIndex;
                                const isPast = activeLyricIndex >= 0 && idx < activeLyricIndex;
                                const isRight = idx % 2 === 1;
                                const badge = LYRIC_FX_BADGES[idx % LYRIC_FX_BADGES.length];
                                const effectiveTime = smoothTime + lyricOffsetSec;

                                return (
                                  <div
                                    key={`stage-lyric-${idx}-${line.time}`}
                                    className={`flex w-full ${
                                      isRight ? 'justify-end' : 'justify-start'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      ref={isActive ? stageActiveLyricRef : null}
                                      onClick={() => {
                                        if (isStageAlignMode) {
                                          handleAlignLineToNow(line.time);
                                          setIsStageAlignMode(false);
                                          setStageScrolledAway(false);
                                          stageManualScrollUntilRef.current = 0;
                                        } else {
                                          onSeek(Math.max(0, line.time - lyricOffsetSec));
                                          setStageScrolledAway(false);
                                          stageManualScrollUntilRef.current = 0;
                                        }
                                      }}
                                      className={`relative overflow-hidden max-w-[92%] sm:max-w-[82%] text-left px-4 py-3 border-2 border-black transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
                                        isStageAlignMode
                                          ? 'bg-[#292931] hover:bg-[#fde400] text-white hover:text-[#201c00] shadow-[3px_3px_0px_#000000] border-[#fde400]'
                                          : isActive
                                          ? 'bg-[#00f0ff] text-[#00363a] shadow-[4px_4px_0px_#000000] -rotate-1'
                                          : isPast
                                          ? 'bg-[#12131a] text-[#7a828e] shadow-[2px_2px_0px_#000000] hover:text-white'
                                          : 'bg-[#292931] text-[#e3e1ec] shadow-[3px_3px_0px_#000000] hover:bg-[#34343c]'
                                      }`}
                                    >
                                      {isActive && !isStageAlignMode && (
                                        <span className="absolute -top-3 -right-2 bg-[#fde400] text-[#201c00] border-2 border-black px-1.5 py-0.5 font-display text-[11px] tracking-wider uppercase rotate-6 shadow-[2px_2px_0px_#000000]">
                                          {badge}
                                        </span>
                                      )}
                                      <div className="flex items-baseline gap-2.5">
                                        <span
                                          className={`font-mono text-[10px] font-bold tabular-nums shrink-0 ${
                                            isActive && !isStageAlignMode ? 'text-[#00363a]/80' : 'text-[#fde400]'
                                          }`}
                                        >
                                          {formatTime(Math.max(0, line.time - lyricOffsetSec))}
                                        </span>
                                        <span
                                          className={`font-display uppercase tracking-wide leading-tight ${
                                            isActive ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                                          }`}
                                        >
                                          {isActive && line.words && line.words.length > 0 && !isStageAlignMode
                                            ? line.words.map((w, wIdx) => {
                                                const sung = effectiveTime >= w.time - 0.08;
                                                return (
                                                  <span
                                                    key={wIdx}
                                                    className={`transition-opacity duration-100 ${
                                                      sung ? 'opacity-100 text-[#001f22]' : 'opacity-45'
                                                    }`}
                                                  >
                                                    {w.text}
                                                    {wIdx < line.words!.length - 1 ? ' ' : ''}
                                                  </span>
                                                );
                                              })
                                            : line.text}
                                        </span>
                                      </div>

                                      {/* 60fps Live Karaoke Line Progress Bar */}
                                      {isActive && !isStageAlignMode && (
                                        <div className="absolute left-0 right-0 bottom-0 h-1 bg-black/20">
                                          <div
                                            className="h-full bg-[#fde400] transition-[width] duration-75 ease-linear"
                                            style={{ width: `${Math.round(activeLyricProgress * 100)}%` }}
                                          />
                                        </div>
                                      )}
                                    </button>
                                  </div>
                                );
                              })
                            ) : lyricsData.plainLyrics ? (
                              <p className="text-sm sm:text-base text-[#e3e1ec] whitespace-pre-line leading-relaxed p-2">
                                {lyricsData.plainLyrics}
                              </p>
                            ) : (
                              <div className="py-10 text-center space-y-2">
                                <p className="font-display text-2xl text-white uppercase">
                                  {lyricsData.instrumental
                                    ? 'INSTRUMENTAL EDITION — NO VOCAL SCRIPT'
                                    : 'NO SYNCHRONIZED LYRICS AVAILABLE'}
                                </p>
                                <p className="text-xs text-[#b9cacb]">
                                  Tap Cinema Video above to watch the unobstructed official visual!
                                </p>
                              </div>
                            )}
                          </div>

                          {stageScrolledAway && lyricsData.parsedLines.length > 0 && (
                            <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  stageManualScrollUntilRef.current = 0;
                                  setStageScrolledAway(false);
                                  if (stageActiveLyricRef.current && stageLyricsContainerRef.current) {
                                    const container = stageLyricsContainerRef.current;
                                    const el = stageActiveLyricRef.current;
                                    const elRect = el.getBoundingClientRect();
                                    const containerRect = container.getBoundingClientRect();
                                    const targetTop =
                                      container.scrollTop +
                                      (elRect.top - containerRect.top) -
                                      container.clientHeight * 0.38 +
                                      elRect.height * 0.5;
                                    container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
                                  }
                                }}
                                className="pointer-events-auto px-3 py-1 bg-[#fde400] hover:bg-white text-[#201c00] border-2 border-black shadow-[2px_2px_0px_#000000] font-display text-xs tracking-wider uppercase cursor-pointer"
                              >
                                JUMP TO LIVE LINE
                              </button>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Right 4-Col: Audio Preset Chips + THE COMIC VAULT QUEUE */}
                    <div className="lg:col-span-4 space-y-6 min-w-0">
                      {/* Quick Audio Preset Chips */}
                      <section className="bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-xl tracking-wider uppercase text-white">
                            FX SOUND PROFILE
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleSelectNav('equalizer')}
                            className="font-mono text-[10px] font-bold uppercase text-[#00f0ff] hover:underline cursor-pointer"
                          >
                            OPEN STUDIO →
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {EQ_PRESETS.map((preset) => {
                            const selected = activeEqPreset === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleSelectEqPreset(preset)}
                                className={`px-2.5 py-2 border-2 border-black text-left transition-all cursor-pointer shadow-[2px_2px_0px_#000000] ${
                                  selected
                                    ? 'bg-[#fde400] text-[#201c00]'
                                    : 'bg-[#12131a] text-[#e3e1ec] hover:bg-[#292931]'
                                }`}
                              >
                                <span className="font-display text-sm tracking-wider uppercase block leading-none">
                                  {preset.label}
                                </span>
                                <span className="font-mono text-[9px] font-bold uppercase opacity-75">
                                  {preset.tag}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      {/* THE COMIC VAULT QUEUE */}
                      <section className="bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] p-4 space-y-3.5">
                        <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                          <div>
                            <span className="bg-[#ff506e] text-white border border-black px-1.5 py-0.5 font-display text-[11px] tracking-wider uppercase -rotate-2 inline-block">
                              UP NEXT
                            </span>
                            <h3 className="font-display text-2xl tracking-wide uppercase text-white leading-none mt-1">
                              THE COMIC VAULT QUEUE
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectNav('queue')}
                            className="px-2.5 py-1 bg-[#12131a] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#e3e1ec] border-2 border-black font-display text-xs tracking-wider uppercase cursor-pointer"
                          >
                            ALL ({queue.length})
                          </button>
                        </div>

                        {upNextQueueTracks.length === 0 ? (
                          <p className="text-xs text-[#b9cacb] py-6 text-center">
                            No upcoming tracks queued. Explore tracks to stack your deck!
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {upNextQueueTracks.map((qt, idx) => {
                              const { title: qTitle, artistFromTitle } = cleanTrackTitle(qt.title);
                              const qArtist = getFullSingerName(
                                qt.artist || artistFromTitle || '',
                                qTitle
                              );
                              return (
                                <button
                                  key={`vault-q-${qt.id}-${idx}`}
                                  type="button"
                                  onClick={() => onPlayTrack(qt)}
                                  className="w-full flex items-center gap-3 p-2 bg-[#12131a] hover:bg-[#292931] border-2 border-black shadow-[2px_2px_0px_#000000] text-left transition-all cursor-pointer group"
                                >
                                  <span className="font-display text-base text-[#fde400] w-6 text-center shrink-0">
                                    #{String(idx + 1).padStart(2, '0')}
                                  </span>
                                  <div className="w-10 h-10 border-2 border-black overflow-hidden shrink-0 bg-black">
                                    <ArtworkImage
                                      title={qTitle}
                                      artist={qArtist}
                                      trackId={qt.id}
                                      initialSrc={qt.thumbnail}
                                      alt={qTitle}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-display text-base tracking-wide uppercase text-white group-hover:text-[#00f0ff] truncate leading-tight">
                                      {qTitle}
                                    </p>
                                    <p className="text-[11px] text-[#b9cacb] truncate">{qArtist}</p>
                                  </div>
                                  <span className="w-7 h-7 bg-[#00f0ff] text-[#00363a] border-2 border-black flex items-center justify-center shrink-0">
                                    <Play className="w-3.5 h-3.5 fill-[#00363a] ml-0.5" />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1e1f27] border-[3px] border-black shadow-[6px_6px_0px_#000000] p-12 text-center space-y-4 max-w-lg mx-auto my-10">
                    <div className="w-14 h-14 bg-[#00f0ff] text-[#00363a] border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center mx-auto -rotate-3">
                      <Music2 className="w-7 h-7" />
                    </div>
                    <h2 className="font-display text-3xl uppercase text-white tracking-wide">
                      STAGE IS STANDING BY!
                    </h2>
                    <p className="text-sm text-[#b9cacb]">
                      Pick any official release or hit Surprise Me to fire up the Now Playing Stage.
                    </p>
                    <button
                      type="button"
                      onClick={() => (onSurprisePlay ? onSurprisePlay() : handleSelectNav('home'))}
                      className="px-5 py-2.5 bg-[#fde400] text-[#201c00] border-2 border-black shadow-[4px_4px_0px_#000000] font-display text-lg tracking-wider uppercase cursor-pointer"
                    >
                      DROP A RANDOM TRACK!
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════
                VIEW 3: COMICS / EXPLORE
               ══════════════════════════════════════════════ */}
            {activeView === 'explore' && (
              <div className="space-y-9 max-w-[1440px] mx-auto">
                {/* Curated Comic Arcs (Genre Collections) */}
                {curatedPlaylists.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#fde400] text-[#201c00] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000]">
                          CURATED ARCS
                        </span>
                        <h2 className="font-display text-3xl tracking-wide uppercase text-white leading-none">
                          MULTIVERSE COLLECTIONS
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {curatedPlaylists.map((pl, idx) => (
                        <div
                          key={pl.id}
                          onClick={() => onPlayGenre?.(pl.raw)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onPlayGenre?.(pl.raw);
                            }
                          }}
                          className="group bg-[#1e1f27] hover:bg-[#292931] border-[3px] border-black shadow-[5px_5px_0px_#000000] hover:-translate-y-1 p-4 transition-all cursor-pointer flex items-center gap-4"
                        >
                          <div className="w-14 h-14 shrink-0 bg-[#12131a] border-2 border-black shadow-[3px_3px_0px_#000000] flex flex-col items-center justify-center">
                            <span className="font-mono text-[9px] font-bold uppercase text-[#00f0ff] leading-none">
                              ARC
                            </span>
                            <span className="font-display text-2xl text-[#fde400] leading-none mt-0.5">
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-[10px] font-bold uppercase text-[#00f0ff]">
                              {pl.tracks.length} ORIGINAL TRACKS
                            </span>
                            <h3 className="font-display text-2xl tracking-wide uppercase text-white group-hover:text-[#fde400] truncate leading-tight">
                              {pl.name}
                            </h3>
                            <p className="text-xs text-[#b9cacb] truncate mt-0.5">
                              {pl.artistsLine}
                            </p>
                          </div>

                          <span className="w-10 h-10 bg-[#00f0ff] text-[#00363a] border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center shrink-0">
                            <Play className="w-4 h-4 fill-[#00363a] ml-0.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Official Music Video Spotlight */}
                {musicVideoTracks.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#ff506e] text-white border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase rotate-2 shadow-[2px_2px_0px_#000000]">
                        CINEMA REELS
                      </span>
                      <h2 className="font-display text-3xl tracking-wide uppercase text-white leading-none">
                        OFFICIAL MUSIC VIDEOS
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {musicVideoTracks.map((track) => {
                        const { title: ct, artistFromTitle } = cleanTrackTitle(track.title);
                        const art = getFullSingerName(track.artist || artistFromTitle || '', ct);
                        return (
                          <button
                            key={`mv-${track.id}`}
                            type="button"
                            onClick={() => {
                              onPlayTrack(track);
                              openCinema('video');
                            }}
                            className="group text-left bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
                          >
                            <div className="aspect-video w-full bg-black border-b-[3px] border-black relative overflow-hidden">
                              <ArtworkImage
                                title={ct}
                                artist={art}
                                trackId={track.id}
                                aspectRatio="video"
                                initialSrc={
                                  track.videoThumbnail ||
                                  `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`
                                }
                                alt={ct}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-2.5 left-2.5 bg-[#ff506e] text-white border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1">
                                <Film className="w-3 h-3" />
                                <span>HD VIDEO</span>
                              </span>
                              <span className="absolute bottom-3 right-3 w-11 h-11 bg-[#00f0ff] text-[#00363a] border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center">
                                <Play className="w-5 h-5 fill-[#00363a] ml-0.5" />
                              </span>
                            </div>
                            <div className="p-3.5">
                              <p className="font-display text-xl tracking-wide uppercase text-white group-hover:text-[#00f0ff] truncate">
                                {ct}
                              </p>
                              <p className="text-xs text-[#b9cacb] font-medium truncate mt-0.5">
                                {art}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Fresh Official Discovery Grid */}
                {discoverGridTracks.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#00f0ff] text-[#00363a] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000]">
                          FRESH DROPS
                        </span>
                        <h2 className="font-display text-3xl tracking-wide uppercase text-white leading-none">
                          DISCOVER ISSUES
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={handleRefreshMix}
                        className="px-3.5 py-1.5 bg-[#fde400] text-[#201c00] border-2 border-black shadow-[3px_3px_0px_#000000] font-display text-sm tracking-wider uppercase cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>REROLL UNIVERSE</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                      {discoverGridTracks.map((track, idx) => (
                        <UnifiedTrackCard
                          key={`disc-${track.id}`}
                          track={track}
                          variant="card"
                          issueNumber={String(idx + 1).padStart(2, '0')}
                          isCurrent={currentTrack?.id === track.id}
                          isPlaying={isPlaying}
                          isFavorite={favoriteIds.has(track.id)}
                          isInQueue={queueIds.has(track.id)}
                          onPlay={onPlayTrack}
                          onTogglePlay={onTogglePlay}
                          onAddToQueue={onAddToQueue}
                          onToggleFavorite={onToggleFavorite}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════
                VIEW 4: ISSUE VAULT (LIKED SONGS)
               ══════════════════════════════════════════════ */}
            {activeView === 'liked' && (
              <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-black pb-4">
                  <div>
                    <span className="bg-[#ff506e] text-white border-2 border-black px-2.5 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000] inline-block mb-1.5">
                      PERSONAL ARCHIVE
                    </span>
                    <h2 className="font-display text-4xl tracking-wide uppercase text-white leading-none">
                      ISSUE VAULT ({favorites.length})
                    </h2>
                  </div>
                  {favorites.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onPlayTrack(favorites[0])}
                      className="px-5 py-2.5 bg-[#00f0ff] text-[#00363a] border-2 border-black shadow-[4px_4px_0px_#000000] font-display text-base tracking-wider uppercase flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-[#00363a]" />
                      <span>PLAY VAULT</span>
                    </button>
                  )}
                </div>

                {favorites.length === 0 ? (
                  <div className="bg-[#1e1f27] border-[3px] border-black shadow-[6px_6px_0px_#000000] p-12 text-center space-y-4">
                    <div className="w-14 h-14 bg-[#ff506e] text-white border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center mx-auto rotate-3">
                      <Heart className="w-7 h-7" />
                    </div>
                    <h3 className="font-display text-3xl uppercase text-white">
                      YOUR ISSUE VAULT IS EMPTY!
                    </h3>
                    <p className="text-sm text-[#b9cacb] max-w-md mx-auto">
                      Tap the heart icon on any track to stash your favorite official issues right here.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectNav('home')}
                      className="px-5 py-2.5 bg-[#fde400] text-[#201c00] border-2 border-black shadow-[4px_4px_0px_#000000] font-display text-base tracking-wider uppercase cursor-pointer"
                    >
                      BACK TO HOME BASE
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {favorites.map((track, idx) => (
                      <UnifiedTrackCard
                        key={`fav-${track.id}`}
                        track={track}
                        variant="shelf"
                        issueNumber={String(idx + 1).padStart(2, '0')}
                        isCurrent={currentTrack?.id === track.id}
                        isPlaying={isPlaying}
                        isFavorite={true}
                        isInQueue={queueIds.has(track.id)}
                        onPlay={onPlayTrack}
                        onTogglePlay={onTogglePlay}
                        onAddToQueue={onAddToQueue}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════
                VIEW 5: QUEUE DECK
               ══════════════════════════════════════════════ */}
            {activeView === 'queue' && (
              <div className="max-w-5xl mx-auto">
                <QueueView
                  currentTrack={currentTrack}
                  queue={queue}
                  favorites={favorites}
                  isPlaying={isPlaying}
                  isShuffle={isShuffle}
                  onPlayTrack={onPlayTrack}
                  onTogglePlay={onTogglePlay}
                  onToggleFavorite={onToggleFavorite}
                  onRemoveFromQueue={onRemoveFromQueue}
                  onClearQueue={onClearQueue}
                  onToggleShuffle={onToggleShuffle}
                  onBrowseHome={() => handleSelectNav('home')}
                />
              </div>
            )}

            {/* ══════════════════════════════════════════════
                VIEW 6: EQUALIZER STUDIO & STREAM QUALITY
               ══════════════════════════════════════════════ */}
            {activeView === 'equalizer' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="border-b-[3px] border-black pb-4">
                  <span className="bg-[#00f0ff] text-[#00363a] border-2 border-black px-2.5 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000] inline-block mb-1.5">
                    SOUND LAB
                  </span>
                  <h2 className="font-display text-4xl tracking-wide uppercase text-white leading-none">
                    EQUALIZER FX &amp; STREAM QUALITY
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7">{renderEqualizerPanel(true)}</div>

                  {/* Stream Quality Selector Console */}
                  <div className="lg:col-span-5 bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] p-5 space-y-4">
                    <div className="border-b-2 border-black pb-3">
                      <span className="bg-[#fde400] text-[#201c00] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase rotate-2 inline-block">
                        BITRATE ENGINE
                      </span>
                      <h3 className="font-display text-2xl tracking-wide uppercase text-white mt-1 leading-none">
                        STREAM QUALITY
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {STREAM_QUALITY_OPTIONS.map((opt) => {
                        const selected = playbackQuality === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChangePlaybackQuality?.(opt.id)}
                            className={`w-full p-3 border-2 border-black text-left transition-all cursor-pointer flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                              selected
                                ? 'bg-[#00f0ff] text-[#00363a]'
                                : 'bg-[#12131a] text-[#e3e1ec] hover:bg-[#292931]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display text-lg tracking-wider uppercase leading-none">
                                  {opt.label}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 border border-black font-mono text-[10px] font-bold uppercase ${
                                    selected
                                      ? 'bg-[#fde400] text-[#201c00]'
                                      : 'bg-[#292931] text-[#00f0ff]'
                                  }`}
                                >
                                  {opt.shortLabel}
                                </span>
                              </div>
                              <p
                                className={`text-xs mt-1 ${
                                  selected ? 'text-[#00363a]/85 font-semibold' : 'text-[#b9cacb]'
                                }`}
                              >
                                {opt.detail}
                              </p>
                            </div>
                            {selected && <Check className="w-5 h-5 shrink-0 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════
                VIEW 7: LIVE SEARCH RESULTS
               ══════════════════════════════════════════════ */}
            {activeView === 'search' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-black pb-4">
                  <div>
                    <span className="bg-[#00f0ff] text-[#00363a] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 inline-block mb-1">
                      LIVE RADAR
                    </span>
                    <h2 className="font-display text-4xl tracking-wide uppercase text-white leading-none">
                      {localSearchInput.trim()
                        ? `RESULTS FOR "${localSearchInput.trim()}"`
                        : 'SEARCH OFFICIAL CATALOG'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSearching && searchResults.length > 0 && (
                      <span className="px-2.5 py-1 bg-[#1e1f27] text-[#00f0ff] border-2 border-black font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>LIVE</span>
                      </span>
                    )}
                    {localSearchInput && (
                      <button
                        type="button"
                        onClick={handleClearSearchInput}
                        className="px-3.5 py-1.5 bg-[#ff506e] text-white border-2 border-black shadow-[3px_3px_0px_#000000] font-display text-sm tracking-wider uppercase cursor-pointer"
                      >
                        CLEAR QUERY
                      </button>
                    )}
                  </div>
                </div>

                {/* Realtime Autocomplete Quick Chips */}
                {searchSuggestions.length > 0 && localSearchInput.trim() && (
                  <div className="flex flex-wrap items-center gap-2">
                    {searchSuggestions.map((suggestion) => (
                      <button
                        key={`sug-${suggestion}`}
                        type="button"
                        onClick={() => handleSearchSubmitNow(suggestion)}
                        className="px-2.5 py-1 bg-[#1e1f27] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#e3e1ec] border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {isSearching && searchResults.length === 0 ? (
                  <div className="bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] p-12 flex items-center justify-center gap-3 text-[#00f0ff] font-display text-2xl tracking-wider uppercase">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>SCANNING OFFICIAL CATALOG...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className={`space-y-8 transition-opacity duration-150 ${isSearching ? 'opacity-80' : 'opacity-100'}`}>
                    {/* Songs with Verified 1:1 Studio Cover Art */}
                    {searchSquareResults.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <span className="bg-[#00f0ff] text-[#00363a] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-1">
                            1:1 STUDIO COVERS
                          </span>
                          <h3 className="font-display text-2xl tracking-wide uppercase text-white">
                            SONGS ({searchSquareResults.length})
                          </h3>
                        </div>
                        <div className="space-y-2.5">
                          {searchSquareResults.map((track, idx) => (
                            <UnifiedTrackCard
                              key={`search-${track.id}`}
                              track={track}
                              variant="shelf"
                              issueNumber={String(idx + 1).padStart(2, '0')}
                              isCurrent={currentTrack?.id === track.id}
                              isPlaying={isPlaying}
                              isFavorite={favoriteIds.has(track.id)}
                              isInQueue={queueIds.has(track.id)}
                              onPlay={onPlayTrack}
                              onTogglePlay={onTogglePlay}
                              onAddToQueue={onAddToQueue}
                              onToggleFavorite={onToggleFavorite}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video-Only Tracks (Shown in Native 16:9 Video Cards — Never Pushed to 1:1 Squares) */}
                    {searchVideoResults.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <span className="bg-[#ff506e] text-white border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase rotate-1">
                            16:9 VIDEOS
                          </span>
                          <h3 className="font-display text-2xl tracking-wide uppercase text-white">
                            MUSIC VIDEOS ({searchVideoResults.length})
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          {searchVideoResults.map((track) => {
                            const { title: ct, artistFromTitle } = cleanTrackTitle(track.title);
                            const art = getFullSingerName(track.artist || artistFromTitle || '', ct);
                            return (
                              <button
                                key={`search-mv-${track.id}`}
                                type="button"
                                onClick={() => {
                                  onPlayTrack(track);
                                  openCinema('video');
                                }}
                                className="group text-left bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
                              >
                                <div className="aspect-video w-full bg-black border-b-[3px] border-black relative overflow-hidden">
                                  <ArtworkImage
                                    title={ct}
                                    artist={art}
                                    trackId={track.id}
                                    aspectRatio="video"
                                    initialSrc={
                                      track.videoThumbnail ||
                                      `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`
                                    }
                                    alt={ct}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <span className="absolute top-2.5 left-2.5 bg-[#ff506e] text-white border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-1">
                                    <Film className="w-3 h-3" />
                                    <span>WATCH VIDEO</span>
                                  </span>
                                  <span className="absolute bottom-3 right-3 w-11 h-11 bg-[#00f0ff] text-[#00363a] border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center">
                                    <Play className="w-5 h-5 fill-[#00363a] ml-0.5" />
                                  </span>
                                </div>
                                <div className="p-3.5">
                                  <p className="font-display text-xl tracking-wide uppercase text-white group-hover:text-[#00f0ff] truncate">
                                    {ct}
                                  </p>
                                  <p className="text-xs text-[#b9cacb] font-medium truncate mt-0.5">
                                    {art}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : localSearchInput.trim() ? (
                  <div className="bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] p-10 text-center space-y-2">
                    <p className="font-display text-2xl uppercase text-white">
                      NO MATCHES FOUND FOR &ldquo;{localSearchInput.trim()}&rdquo;
                    </p>
                    <p className="text-xs text-[#b9cacb]">
                      Try searching by official singer name, song title, or album.
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] p-6 sm:p-10 text-center space-y-5">
                    <div className="space-y-2">
                      <Zap className="w-8 h-8 text-[#fde400] mx-auto" />
                      <p className="font-display text-2xl uppercase text-white">
                        SEARCH ANY OFFICIAL SONG, ARTIST, OR LYRIC
                      </p>
                      <p className="text-xs text-[#b9cacb]">
                        Direct studio audio, verified 1:1 album artwork, and synced lyrics.
                      </p>
                    </div>

                    {recentSearches.length > 0 && (
                      <div className="space-y-2 pt-2 border-t-2 border-black/60">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#b9cacb]">
                            RECENT SEARCHES
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setRecentSearches([]);
                              try {
                                localStorage.removeItem('melophile_recent_searches');
                              } catch {}
                            }}
                            className="font-mono text-[10px] font-bold uppercase text-[#ff506e] hover:underline cursor-pointer"
                          >
                            CLEAR
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {recentSearches.map((term) => (
                            <button
                              key={`recent-${term}`}
                              type="button"
                              onClick={() => handleSearchSubmitNow(term)}
                              className="px-3 py-1.5 bg-[#12131a] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#e3e1ec] border-2 border-black shadow-[2px_2px_0px_#000000] font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00f0ff] block">
                        QUICK PICKS
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {['The Weeknd', 'Arijit Singh', 'Die With A Smile', 'Billie Eilish', 'Diljit Dosanjh', 'Taylor Swift'].map((pick) => (
                          <button
                            key={`pick-${pick}`}
                            type="button"
                            onClick={() => handleSearchSubmitNow(pick)}
                            className="px-3 py-1.5 bg-[#292931] hover:bg-[#fde400] hover:text-[#201c00] text-white border-2 border-black shadow-[2px_2px_0px_#000000] font-display text-sm tracking-wider uppercase transition-all cursor-pointer"
                          >
                            {pick}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ══════════════════════════════════════════════════
            FULLSCREEN ACTION STAGE OVERLAY (CINEMA MODE)
           ══════════════════════════════════════════════════ */}
        {isCinemaMode && currentTrack && (
          <CinemaModeOverlay
            currentTrack={currentTrack}
            viewMode={cinemaViewMode}
            posterColor={posterColor}
            isPlaying={isPlaying}
            duration={duration}
            smoothTime={smoothTime}
            lyricOffsetSec={lyricOffsetSec}
            onAdjustLyricOffset={handleAdjustLyricOffset}
            onResetLyricOffset={handleResetLyricOffset}
            onAlignLineToNow={handleAlignLineToNow}
            isCurrentFavorite={isCurrentFavorite}
            isCurrentInQueue={isCurrentInQueue}
            playbackQuality={playbackQuality}
            lyricsData={lyricsData}
            activeSyncVersionIdx={activeSyncVersionIdx}
            onCycleSyncVersion={handleCycleSyncVersion}
            activeLyricIndex={activeLyricIndex}
            lyricsContextLines={lyricsContextLines}
            onChangeViewMode={handleCinemaViewModeChange}
            onClose={closeCinema}
            onTogglePlay={onTogglePlay}
            onSeek={onSeek}
            onPrev={onPrev}
            onNext={onNext}
            onToggleFavorite={onToggleFavorite}
            onAddToQueue={onAddToQueue}
          />
        )}

        {/* ══════════════════════════════════════════════════
            PERSISTENT ZERO-UNMOUNT YOUTUBE VIDEO SLOT
            - Constant DOM depth across Home 1:1 Cover, Now Playing 1:1 Cover,
              Cinema Video 16:9, and Android-safe 200x112 hidden background slot
            - Overscan (+200px / +184px) crops 100% of YouTube overlays
            - Artwork curtain hides pause/loading overlays cleanly
           ══════════════════════════════════════════════════ */}
        <div
          ref={videoSlotWrapperRef}
          className={
            isCinemaVideo
              ? 'absolute inset-0 z-[60] flex items-center justify-center px-3 sm:px-6 md:px-10 pt-16 pb-4 pointer-events-none'
              : canDockInMainCanvas && isVideoDocked
              ? 'fixed z-20 overflow-hidden bg-black flex items-center justify-center'
              : 'fixed bottom-0 right-0 w-[640px] h-[360px] opacity-[0.001] pointer-events-none z-0 overflow-hidden'
          }
        >
          {/* Outer frame */}
          <div
            className={
              isCinemaVideo
                ? 'w-full max-w-5xl max-h-full aspect-video overflow-hidden shadow-[8px_8px_0px_#000000] bg-black border-[3px] border-black relative pointer-events-auto flex items-center justify-center'
                : canDockInMainCanvas && isVideoDocked
                ? 'w-full h-full relative overflow-hidden bg-black flex items-center justify-center'
                : 'w-[640px] h-[360px] overflow-hidden'
            }
          >
            {/* Constant-depth overscan stage crops 100% of YouTube's top title bar, bottom watermark & corner chrome */}
            <div
              className={
                isCinemaVideo
                  ? 'h-[calc(100%+184px)] aspect-video shrink-0 relative pointer-events-none'
                  : canDockInMainCanvas && isVideoDocked
                  ? 'h-[calc(100%+200px)] aspect-video shrink-0 relative pointer-events-none'
                  : 'w-[640px] h-[360px] overflow-hidden'
              }
            >
              {videoSlot}
            </div>

            {/* Artwork Curtain (on pause/load/track switch) + Transparent Click & Scroll Shield */}
            {(isCinemaVideo || (canDockInMainCanvas && isVideoDocked)) &&
              currentTrack &&
              currentTrackMeta && (
                <div
                  onClick={onTogglePlay}
                  onDoubleClick={() => {
                    if (!isCinemaVideo) openCinema('video');
                  }}
                  onWheel={(e) => {
                    if (!isCinemaVideo && mainScrollRef.current) {
                      mainScrollRef.current.scrollTop += e.deltaY;
                    }
                  }}
                  className="absolute inset-0 z-10 cursor-pointer select-none touch-pan-y"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  <div
                    className={`absolute inset-0 bg-[#12131a] pointer-events-none transition-opacity ${
                      isDockedVideoRevealed ? 'opacity-0 duration-500' : 'opacity-100 duration-75'
                    }`}
                  >
                    <ArtworkImage
                      title={currentTrackMeta.title}
                      artist={currentTrackMeta.artist}
                      trackId={currentTrack.id}
                      initialSrc={currentTrack.thumbnail}
                      alt={currentTrackMeta.title}
                      priority
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          PERSISTENT BOTTOM COMIC PLAYBACK DECK
         ══════════════════════════════════════════════════ */}
      {currentTrack && (
        <UnifiedPlaybackBar
          isCinemaMode={isCinemaMode}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          repeatMode={repeatMode}
          isShuffle={isShuffle}
          isVideoActive={isCinemaMode && cinemaViewMode === 'video'}
          isLyricsActive={isCinemaMode && cinemaViewMode === 'lyrics'}
          isCurrentFavorite={isCurrentFavorite}
          playbackQuality={playbackQuality}
          onTogglePlay={onTogglePlay}
          onSeek={onSeek}
          onPrev={onPrev}
          onNext={onNext}
          onToggleShuffle={onToggleShuffle}
          onToggleRepeat={onToggleRepeat}
          onChangeVolume={onChangeVolume}
          onToggleFavorite={onToggleFavorite}
          onChangePlaybackQuality={onChangePlaybackQuality}
          onToggleVideo={() => {
            if (isCinemaMode && cinemaViewMode === 'video') {
              handleCinemaViewModeChange('poster');
            } else {
              openCinema('video');
            }
          }}
          onToggleLyrics={() => {
            if (isCinemaMode && cinemaViewMode === 'lyrics') {
              handleCinemaViewModeChange('poster');
            } else {
              openCinema('lyrics');
            }
          }}
          onToggleCinema={() => {
            if (isCinemaMode) {
              closeCinema();
            } else {
              openCinema('poster');
            }
          }}
          onOpenQueue={() => {
            if (isCinemaMode) closeCinema();
            handleSelectNav('queue');
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════
          MOBILE 5-TAB COMIC BOTTOM NAVIGATION (< md)
         ══════════════════════════════════════════════════ */}
      {!isCinemaMode && (
        <nav
          aria-label="Mobile comic navigation"
          className="md:hidden bg-[#1a1b22] border-t-[3px] border-black grid grid-cols-5 items-center shrink-0 z-40 select-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {mobileNavItems.map(({ id, label, Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={`mobile-${id}`}
                type="button"
                onClick={() => handleSelectNav(id)}
                className={`h-14 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors border-r-2 last:border-r-0 border-black ${
                  active
                    ? 'bg-[#00f0ff] text-[#00363a]'
                    : 'bg-[#1a1b22] text-[#b9cacb] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span className="font-display text-[11px] tracking-wider uppercase leading-none">
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
