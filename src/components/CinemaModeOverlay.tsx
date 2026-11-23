import React, { useEffect, useRef, useState } from 'react';
import { Track, StreamQuality } from '../types/player';
import {
  cleanTrackTitle,
  getFullSingerName,
  formatTime,
  LyricLine,
  getLyricLineProgress,
} from '../utils/playerUtils';
import { getQualityOption } from '../utils/qualityConfig';
import { RGBColor } from '../utils/colorUtils';
import { ArtworkImage } from './ArtworkImage';
import {
  ChevronDown,
  Disc,
  Film,
  Mic2,
  Loader2,
  Play,
  Pause,
  Zap,
  Crosshair,
  RotateCcw,
} from 'lucide-react';

export type CinemaViewMode = 'poster' | 'video' | 'lyrics';

interface CinemaModeOverlayProps {
  currentTrack: Track;
  viewMode: CinemaViewMode;
  posterColor: RGBColor;
  isPlaying: boolean;
  duration: number;
  smoothTime: number;
  lyricOffsetSec: number;
  onAdjustLyricOffset: (deltaSec: number) => void;
  onResetLyricOffset: () => void;
  onAlignLineToNow: (lineTime: number) => void;
  isCurrentFavorite: boolean;
  isCurrentInQueue: boolean;
  playbackQuality: StreamQuality;
  lyricsData: {
    plainLyrics: string | null;
    syncedLyrics: string | null;
    parsedLines: LyricLine[];
    isRealSync?: boolean;
    syncQuality?: 'video-locked' | 'timed' | 'estimated';
    syncVersions?: Array<{ id: string; label: string; duration: number; firstTs: number; lastTs: number; syncedLyrics: string }>;
    lrcDuration?: number | null;
    instrumental?: boolean;
    quotaExceeded?: boolean;
    isLoading: boolean;
  };
  activeSyncVersionIdx?: number;
  onCycleSyncVersion?: () => void;
  activeLyricIndex: number;
  lyricsContextLines: [string, string, string];
  onChangeViewMode: (mode: CinemaViewMode) => void;
  onClose: () => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

const LYRIC_FX_STAMPS = ['BAM!', 'POW!', 'SNAP!', 'THWIP!', 'ZAP!'];

export const CinemaModeOverlay: React.FC<CinemaModeOverlayProps> = ({
  currentTrack,
  viewMode,
  posterColor,
  isPlaying,
  duration,
  smoothTime,
  lyricOffsetSec,
  onAdjustLyricOffset,
  onResetLyricOffset,
  onAlignLineToNow,
  isCurrentFavorite,
  isCurrentInQueue,
  playbackQuality,
  lyricsData,
  activeSyncVersionIdx = 0,
  onCycleSyncVersion,
  activeLyricIndex,
  lyricsContextLines,
  onChangeViewMode,
  onClose,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onToggleFavorite,
  onAddToQueue,
}) => {
  const lyricsScrollRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const manualScrollUntilRef = useRef<number>(0);
  const [userScrolledAway, setUserScrolledAway] = useState(false);
  const [isAlignMode, setIsAlignMode] = useState(false);

  const { title: cleanTitle, artistFromTitle } = cleanTrackTitle(currentTrack.title, currentTrack.artist);
  const artist = getFullSingerName(currentTrack.artist || artistFromTitle || '', cleanTitle);
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 0;
  const activeQuality = getQualityOption(playbackQuality);

  const activeLineProgress = getLyricLineProgress(
    lyricsData.parsedLines,
    activeLyricIndex,
    smoothTime,
    lyricOffsetSec
  );

  // Reset align mode on track switch
  useEffect(() => {
    setIsAlignMode(false);
    setUserScrolledAway(false);
    manualScrollUntilRef.current = 0;
  }, [currentTrack.id]);

  // Smooth container-scoped auto-scroll centered at ~38% viewport height (respects manual user scroll)
  useEffect(() => {
    if (viewMode !== 'lyrics' || !activeLineRef.current || !lyricsScrollRef.current) return;
    if (Date.now() < manualScrollUntilRef.current) return;

    const container = lyricsScrollRef.current;
    const el = activeLineRef.current;
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
  }, [activeLyricIndex, viewMode]);

  const handleManualScrollIntent = () => {
    manualScrollUntilRef.current = Date.now() + 4500;
    setUserScrolledAway(true);
  };

  const handleResyncScroll = () => {
    manualScrollUntilRef.current = 0;
    setUserScrolledAway(false);
    if (activeLineRef.current && lyricsScrollRef.current) {
      const container = lyricsScrollRef.current;
      const el = activeLineRef.current;
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const targetTop =
        container.scrollTop +
        (elRect.top - containerRect.top) -
        container.clientHeight * 0.38 +
        elRect.height * 0.5;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAlignMode) {
          setIsAlignMode(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, isAlignMode]);

  const [prevLyric, currentLyric, nextLyric] = lyricsContextLines;
  const formattedOffset = `${lyricOffsetSec >= 0 ? '+' : ''}${lyricOffsetSec.toFixed(1)}s`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Action Stage Player: ${cleanTitle}`}
      className="absolute inset-0 z-50 flex flex-col justify-between overflow-hidden select-none bg-[#0d0e15]"
    >
      {/* Subtle Ambient Poster Glow behind Halftone Dots */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none blur-[120px] transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 25% 35%, rgb(${posterColor.r}, ${posterColor.g}, ${posterColor.b}) 0%, transparent 55%), radial-gradient(circle at 80% 70%, rgba(0, 240, 255, 0.35) 0%, transparent 50%)`,
        }}
      />

      {/* ── FLOATING STAGE BUTTONS (No Header Bar) ── */}
      <div
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none px-4 sm:px-8 pt-3.5 flex items-center justify-between gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.875rem)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto w-10 h-10 bg-[#292931] hover:bg-[#00f0ff] text-[#e3e1ec] hover:text-[#00363a] border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
          title="Exit Action Stage (Esc)"
          aria-label="Exit Action Stage"
        >
          <ChevronDown className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div
          role="tablist"
          aria-label="Stage display mode"
          className="pointer-events-auto flex items-center gap-1 p-1 bg-[#12131a] border-2 border-black shadow-[3px_3px_0px_#000000] shrink-0"
        >
          {(
            [
              { id: 'poster', label: 'COVER ART', mobileLabel: 'ART', Icon: Disc },
              { id: 'video', label: 'VIDEO', mobileLabel: 'VIDEO', Icon: Film },
              { id: 'lyrics', label: 'LYRICS', mobileLabel: 'LYRICS', Icon: Mic2 },
            ] as const
          ).map(({ id, label, mobileLabel, Icon }) => {
            const active = viewMode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeViewMode(id)}
                className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 font-display text-xs sm:text-sm tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
                  active
                    ? 'bg-[#00f0ff] text-[#00363a] border-black shadow-[2px_2px_0px_#000000]'
                    : 'bg-transparent text-[#b9cacb] border-transparent hover:text-white hover:bg-[#292931]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">{mobileLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CENTER ACTION STAGE ── */}
      <div className="relative z-10 flex-1 w-full overflow-hidden flex flex-col justify-center">
        {/* MODE 1: COMIC SPEECH-BUBBLE SYNCED LYRICS */}
        {viewMode === 'lyrics' && (
          <div className="relative w-full h-full flex flex-col pt-16 sm:pt-18">
            {/* Precision Lyric Sync & Tap-to-Align Bar */}
            {!lyricsData.isLoading && lyricsData.parsedLines.length > 0 && (
              <div className="shrink-0 z-20 px-3 sm:px-10 md:px-16 lg:px-28 pb-2.5 flex flex-wrap items-center justify-between gap-2 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 border-2 border-black font-display text-[11px] tracking-wider uppercase shadow-[2px_2px_0px_#000000] ${
                      lyricsData.isRealSync
                        ? 'bg-[#00f0ff] text-[#00363a]'
                        : 'bg-[#fde400] text-[#201c00]'
                    }`}
                  >
                    {lyricsData.syncQuality === 'video-locked'
                      ? 'SYNC LOCKED'
                      : lyricsData.isRealSync
                      ? 'TIMED SYNC'
                      : 'ESTIMATED SYNC'}
                  </span>
                  {isAlignMode && (
                    <span className="text-xs font-bold text-[#fde400] animate-pulse">
                      Tap the line being sung now
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 bg-[#12131a] border-2 border-black p-1 shadow-[3px_3px_0px_#000000]">
                  {onCycleSyncVersion && lyricsData.syncVersions && lyricsData.syncVersions.length > 1 && (
                    <button
                      type="button"
                      onClick={onCycleSyncVersion}
                      className="px-2 py-1.5 sm:py-1 text-[11px] font-display tracking-wider uppercase bg-[#292931] hover:bg-[#00f0ff] hover:text-[#00363a] text-[#00f0ff] border border-black cursor-pointer"
                      title={`Switch synced timing (${lyricsData.syncVersions[activeSyncVersionIdx]?.label || 'Primary'})`}
                    >
                      SYNC {activeSyncVersionIdx + 1}/{lyricsData.syncVersions.length}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onAdjustLyricOffset(-0.5)}
                    className="px-2 py-1.5 sm:py-1 text-[11px] font-mono font-bold bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] border border-black cursor-pointer"
                    title="Delay lyrics by 0.5s"
                  >
                    -0.5s
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustLyricOffset(-0.1)}
                    className="px-2 py-1.5 sm:py-1 text-[11px] font-mono font-bold bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] border border-black cursor-pointer"
                    title="Delay lyrics by 0.1s"
                  >
                    -0.1s
                  </button>
                  <span className="px-1.5 font-mono text-[11px] font-bold tabular-nums text-[#00f0ff] min-w-[42px] text-center">
                    {formattedOffset}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdjustLyricOffset(0.1)}
                    className="px-2 py-1.5 sm:py-1 text-[11px] font-mono font-bold bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] border border-black cursor-pointer"
                    title="Advance lyrics by 0.1s"
                  >
                    +0.1s
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustLyricOffset(0.5)}
                    className="px-2 py-1.5 sm:py-1 text-[11px] font-mono font-bold bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] border border-black cursor-pointer"
                    title="Advance lyrics by 0.5s"
                  >
                    +0.5s
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAlignMode((v) => !v)}
                    className={`px-2 py-1.5 sm:py-1 text-[11px] font-display tracking-wider uppercase border border-black flex items-center gap-1 cursor-pointer transition-colors ${
                      isAlignMode
                        ? 'bg-[#fde400] text-[#201c00]'
                        : 'bg-[#292931] hover:bg-[#00f0ff] hover:text-[#00363a] text-white'
                    }`}
                    title="Tap whichever lyric line is currently sung to lock sync instantly"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>{isAlignMode ? 'CANCEL' : 'ALIGN'}</span>
                  </button>
                  {Math.abs(lyricOffsetSec) >= 0.05 && (
                    <button
                      type="button"
                      onClick={onResetLyricOffset}
                      className="p-1.5 sm:p-1 bg-[#292931] hover:bg-[#ff506e] text-white border border-black cursor-pointer"
                      title="Reset lyric sync offset to 0.0s"
                      aria-label="Reset lyric sync offset"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div
              ref={lyricsScrollRef}
              onWheel={handleManualScrollIntent}
              onTouchStart={handleManualScrollIntent}
              className="flex-1 w-full overflow-y-auto no-scrollbar px-4 sm:px-10 md:px-16 lg:px-28 py-6 sm:py-10"
            >
              <div className="max-w-3xl space-y-4 sm:space-y-5 select-text mx-auto w-full pb-28">
                {lyricsData.isLoading ? (
                  <div className="flex items-center justify-center gap-3 bg-[#1e1f27] border-[3px] border-black shadow-[5px_5px_0px_#000000] p-6 text-[#00f0ff] font-display text-2xl tracking-wider uppercase">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>LOADING SPEECH-BUBBLE LYRICS...</span>
                  </div>
                ) : lyricsData.parsedLines.length > 0 ? (
                  lyricsData.parsedLines.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    const isPast = activeLyricIndex >= 0 && idx < activeLyricIndex;
                    const isRight = idx % 2 === 1;
                    const fxWord = LYRIC_FX_STAMPS[idx % LYRIC_FX_STAMPS.length];
                    const effectiveTime = smoothTime + lyricOffsetSec;

                    return (
                      <div
                        key={`${idx}-${line.time}`}
                        className={`flex w-full ${isRight ? 'justify-end' : 'justify-start'}`}
                      >
                        <button
                          type="button"
                          ref={isActive ? activeLineRef : null}
                          onClick={() => {
                            if (isAlignMode) {
                              onAlignLineToNow(line.time);
                              setIsAlignMode(false);
                              setUserScrolledAway(false);
                              manualScrollUntilRef.current = 0;
                            } else {
                              onSeek(Math.max(0, line.time - lyricOffsetSec));
                              setUserScrolledAway(false);
                              manualScrollUntilRef.current = 0;
                            }
                          }}
                          className={`group/bubble relative overflow-hidden max-w-[90%] sm:max-w-[80%] text-left cursor-pointer border-[3px] border-black px-5 py-3.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
                            isAlignMode
                              ? 'bg-[#1e1f27] hover:bg-[#fde400] text-white hover:text-[#201c00] shadow-[4px_4px_0px_#000000] border-[#fde400]'
                              : isActive
                              ? 'bg-[#00f0ff] text-[#00363a] shadow-[6px_6px_0px_#000000] -rotate-1 scale-[1.02]'
                              : isPast
                              ? 'bg-[#1a1b22] text-[#7a828e] shadow-[3px_3px_0px_#000000] hover:bg-[#292931] hover:text-[#e3e1ec]'
                              : 'bg-[#1e1f27] text-[#e3e1ec] shadow-[4px_4px_0px_#000000] hover:bg-[#292931] hover:-translate-y-0.5'
                          }`}
                        >
                          {isActive && !isAlignMode && (
                            <span className="absolute -top-3.5 -right-3 bg-[#fde400] text-[#201c00] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase rotate-6 shadow-[2px_2px_0px_#000000]">
                              {fxWord}
                            </span>
                          )}
                          <div className="flex items-baseline gap-3">
                            <span
                              className={`text-[11px] font-mono font-bold tabular-nums shrink-0 ${
                                isActive && !isAlignMode ? 'text-[#00363a]/80' : 'text-[#fde400]'
                              }`}
                            >
                              {formatTime(Math.max(0, line.time - lyricOffsetSec))}
                            </span>
                            <span
                              className={`font-display tracking-wide leading-tight uppercase ${
                                isActive
                                  ? 'text-2xl sm:text-4xl'
                                  : 'text-xl sm:text-2xl'
                              }`}
                            >
                              {isActive && line.words && line.words.length > 0 && !isAlignMode
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
                          {isActive && !isAlignMode && (
                            <div className="absolute left-0 right-0 bottom-0 h-1.5 bg-black/20">
                              <div
                                className="h-full bg-[#fde400] transition-[width] duration-75 ease-linear"
                                style={{ width: `${Math.round(activeLineProgress * 100)}%` }}
                              />
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : lyricsData.plainLyrics ? (
                  <div className="bg-[#1e1f27] border-[3px] border-black shadow-[6px_6px_0px_#000000] p-6 sm:p-8 text-[#e3e1ec] text-base sm:text-xl font-medium leading-relaxed whitespace-pre-line">
                    {lyricsData.plainLyrics}
                  </div>
                ) : (
                  <div className="bg-[#1e1f27] border-[3px] border-black shadow-[6px_6px_0px_#000000] p-8 sm:p-12 text-center space-y-4">
                    <span className="inline-block bg-[#ff506e] text-white border-2 border-black px-3 py-1 font-display text-sm tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000]">
                      {lyricsData.instrumental ? 'INSTRUMENTAL CUT' : 'NO SCRIPT FOUND'}
                    </span>
                    <p className="font-display text-2xl sm:text-3xl text-white uppercase tracking-wide">
                      {lyricsData.instrumental
                        ? 'PURE INSTRUMENTAL ISSUE — NO VOCAL LYRICS'
                        : 'SYNCHRONIZED LYRICS UNAVAILABLE FOR THIS TRACK'}
                    </p>
                    <p className="text-[#b9cacb] text-sm max-w-md mx-auto">
                      {lyricsData.instrumental
                        ? 'Enjoy the instrumental soundscape. Switch to Cover Art or Cinema Video anytime.'
                        : lyricsData.quotaExceeded
                        ? 'Lyrics were not found in the catalog right now. Playback continues uninterrupted.'
                        : 'Playback continues uninterrupted. Jump back to Cover Art or Cinema Video.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => onChangeViewMode('poster')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00f0ff] text-[#00363a] border-2 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-base tracking-wider uppercase cursor-pointer"
                    >
                      <Disc className="w-4 h-4" />
                      <span>SHOW COVER ART</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {userScrolledAway && lyricsData.parsedLines.length > 0 && (
              <div className="pointer-events-none absolute bottom-5 left-0 right-0 flex justify-center z-20">
                <button
                  type="button"
                  onClick={handleResyncScroll}
                  className="pointer-events-auto px-4 py-1.5 bg-[#fde400] hover:bg-white text-[#201c00] border-2 border-black shadow-[3px_3px_0px_#000000] font-display text-sm tracking-wider uppercase cursor-pointer"
                >
                  JUMP TO LIVE LINE
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: FULLSCREEN VIDEO PLACEHOLDER (zero-unmount videoSlot docks over this exact area) */}
        {viewMode === 'video' && (
          <div className="w-full h-full flex items-center justify-center px-3 sm:px-6 md:px-10 py-4">
            <div
              id="soundstream-cinema-video-container"
              className="w-full max-w-5xl max-h-full aspect-video bg-black border-[3px] border-black shadow-[8px_8px_0px_#000000]"
            />
          </div>
        )}

        {/* MODE 3: SCREEN 4 ACTION STAGE PLAYER (Tilted Layered Artwork + POW! Burst + Chromatic Title) */}
        {viewMode === 'poster' && (
          <div className="w-full h-full flex flex-col p-4 pt-18 sm:p-10 overflow-y-auto no-scrollbar">
            <div className="my-auto mx-auto w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-7 sm:gap-10 lg:gap-16 py-2">
              {/* Left: Spider-Verse Layered Tilted Comic Cover Art with Yellow POW! Burst */}
              <div className="relative shrink-0 w-52 h-52 sm:w-72 sm:h-72 lg:w-[370px] lg:h-[370px] group">
                {/* Back Cyan Offset Layer */}
                <div className="absolute inset-0 bg-[#00f0ff] border-[3px] border-black translate-x-3 translate-y-3 rotate-3" />
                {/* Mid Magenta Offset Layer */}
                <div className="absolute inset-0 bg-[#ff506e] border-[3px] border-black -translate-x-2.5 translate-y-2 -rotate-2" />

                {/* Front Main Cover Frame */}
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="relative z-10 w-full h-full border-[4px] border-black bg-[#12131a] shadow-[6px_6px_0px_#000000] overflow-hidden cursor-pointer block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                  aria-label={isPlaying ? 'Pause track' : 'Play track'}
                >
                  <ArtworkImage
                    title={cleanTitle}
                    artist={artist}
                    trackId={currentTrack.id}
                    initialSrc={currentTrack.thumbnail}
                    alt={cleanTitle}
                    priority
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle Play/Pause Stamp on Hover or Pause */}
                  <div
                    className={`absolute inset-0 bg-black/35 flex items-center justify-center transition-opacity ${
                      isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                    }`}
                  >
                    <span className="w-16 h-16 bg-[#00f0ff] text-[#00363a] border-[3px] border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center">
                      {isPlaying ? (
                        <Pause className="w-8 h-8 fill-[#00363a]" />
                      ) : (
                        <Play className="w-8 h-8 fill-[#00363a] ml-1" />
                      )}
                    </span>
                  </div>
                </button>

                {/* Yellow POW! Burst Stamp */}
                <div className="absolute -top-5 -right-5 z-20 bg-[#fde400] text-[#201c00] border-[3px] border-black px-3.5 py-1.5 font-display text-2xl tracking-wider uppercase rotate-12 shadow-[4px_4px_0px_#000000] flex items-center gap-1 pointer-events-none">
                  <Zap className="w-5 h-5 fill-[#201c00]" />
                  <span>{isPlaying ? 'POW!' : 'READY!'}</span>
                </div>

                {/* Bottom-Left Issue Barcode Strip */}
                <div className="absolute -bottom-4 left-4 z-20 bg-white text-black border-2 border-black px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest uppercase -rotate-2 shadow-[3px_3px_0px_#000000] pointer-events-none">
                  OFFICIAL EDITION · {activeQuality.shortLabel}
                </div>
              </div>

              {/* Right: Chromatic 3-Layer Bebas Neue Title + Quick Action Controls + Comic Speech Preview */}
              <div className="flex-1 min-w-0 max-w-lg text-center lg:text-left space-y-6">
                <div className="space-y-3">
                  <span className="inline-block bg-[#ff506e] text-white border-2 border-black px-2.5 py-0.5 font-display text-sm tracking-wider uppercase -rotate-2 shadow-[3px_3px_0px_#000000]">
                    NOW ON STAGE
                  </span>

                  {/* 3-Layer Chromatic Aberration Headline */}
                  <div className="relative inline-block w-full">
                    <h2
                      aria-hidden="true"
                      className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wide leading-[0.95] text-[#00f0ff] select-none pointer-events-none absolute inset-0 -translate-x-[3px] -translate-y-[2px] opacity-80 line-clamp-2"
                    >
                      {cleanTitle}
                    </h2>
                    <h2
                      aria-hidden="true"
                      className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wide leading-[0.95] text-[#ff506e] select-none pointer-events-none absolute inset-0 translate-x-[3px] translate-y-[2px] opacity-80 line-clamp-2"
                    >
                      {cleanTitle}
                    </h2>
                    <h2 className="relative font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wide leading-[0.95] text-white line-clamp-2">
                      {cleanTitle}
                    </h2>
                  </div>

                  <p className="text-base sm:text-xl text-[#fde400] font-bold uppercase tracking-wider">
                    {artist}
                  </p>
                </div>

                {/* Live Comic Speech-Bubble Lyrics Preview */}
                {currentLyric && (
                  <button
                    type="button"
                    onClick={() => onChangeViewMode('lyrics')}
                    className="relative w-full text-left p-4 bg-[#1e1f27] hover:bg-[#292931] border-[3px] border-black shadow-[5px_5px_0px_#000000] transition-all cursor-pointer space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                  >
                    <div className="flex items-center justify-between gap-2 pb-1 border-b-2 border-black/60">
                      <span className="bg-[#00f0ff] text-[#00363a] border border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase">
                        LIVE LYRIC BUBBLE
                      </span>
                      <span className="font-display text-xs tracking-wider uppercase text-[#fde400]">
                        FULL SCRIPT →
                      </span>
                    </div>
                    {prevLyric && (
                      <p className="text-xs text-[#7a828e] truncate">{prevLyric}</p>
                    )}
                    <p className="font-display text-xl sm:text-2xl tracking-wide uppercase text-white leading-tight line-clamp-2">
                      “{currentLyric}”
                    </p>
                    {nextLyric && (
                      <p className="text-xs text-[#b9cacb] truncate">{nextLyric}</p>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
