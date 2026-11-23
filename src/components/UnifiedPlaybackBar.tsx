import React, { useState, useRef, useEffect } from 'react';
import { Track, RepeatMode, StreamQuality } from '../types/player';
import { formatTime, cleanTrackTitle, getFullSingerName } from '../utils/playerUtils';
import { STREAM_QUALITY_OPTIONS, getQualityOption } from '../utils/qualityConfig';
import { ArtworkImage } from './ArtworkImage';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Film,
  Mic2,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Check,
  ListMusic,
} from 'lucide-react';

interface UnifiedPlaybackBarProps {
  isCinemaMode: boolean;
  currentTrack: Track;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isVideoActive: boolean;
  isLyricsActive: boolean;
  isCurrentFavorite: boolean;
  playbackQuality: StreamQuality;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onChangeVolume: (volume: number) => void;
  onToggleFavorite: (track: Track) => void;
  onChangePlaybackQuality?: (quality: StreamQuality) => void;
  onToggleVideo: () => void;
  onToggleLyrics: () => void;
  onToggleCinema: () => void;
  onOpenQueue?: () => void;
}

export const UnifiedPlaybackBar: React.FC<UnifiedPlaybackBarProps> = ({
  isCinemaMode,
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  repeatMode,
  isShuffle,
  isVideoActive,
  isLyricsActive,
  isCurrentFavorite,
  playbackQuality,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onChangeVolume,
  onToggleFavorite,
  onChangePlaybackQuality,
  onToggleVideo,
  onToggleLyrics,
  onToggleCinema,
  onOpenQueue,
}) => {
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const qualityMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isQualityMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setIsQualityMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsQualityMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isQualityMenuOpen]);

  const { title: cleanTitle, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const artist = getFullSingerName(currentTrack.artist || artistFromTitle || '', cleanTitle);
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 240;
  const progressPercent =
    effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const volumePercent = Math.min(100, Math.max(0, volume));
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const activeQuality = getQualityOption(playbackQuality);
  const repeatLabel =
    repeatMode === 'one' ? 'Repeat One' : repeatMode === 'all' ? 'Repeat Queue' : 'Repeat Off';

  return (
    <div className="shrink-0 z-[65] relative select-none">
      {/* ── MOBILE FLOATING COMIC MINI-PLAYER (< md, Home Only) ── */}
      {!isCinemaMode && (
        <div className="md:hidden px-2.5 py-1.5 bg-[#12131a]/95 border-t-[2px] border-black">
          <div
            onClick={onToggleCinema}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleCinema();
              }
            }}
            className="relative overflow-hidden bg-[#292931] border-[2px] border-black rounded-xl p-1.5 pr-2 shadow-[3px_3px_0px_#000000] flex items-center gap-2.5 cursor-pointer"
            aria-label={`Now playing ${cleanTitle} by ${artist}. Tap to expand Action Stage`}
          >
            {/* Slim top edge progress strip */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0d0e15] pointer-events-none">
              <div
                className="h-full bg-[#00f0ff] transition-[width] duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="w-11 h-11 rounded-lg border-[2px] border-black bg-[#0d0e15] shadow-[1px_1px_0px_#000000] overflow-hidden shrink-0">
              <ArtworkImage
                title={cleanTitle}
                artist={artist}
                trackId={currentTrack.id}
                initialSrc={currentTrack.thumbnail}
                alt={cleanTitle}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-bold uppercase text-[#00f0ff] truncate leading-tight">
                {cleanTitle}
              </p>
              <p className="text-[11px] font-bold uppercase text-[#b9cacb] truncate mt-0.5">
                {artist}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onToggleFavorite(currentTrack)}
                className={`w-10 h-10 rounded-lg border-[2px] border-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-transform ${
                  isCurrentFavorite ? 'bg-[#ff506e] text-white' : 'bg-[#1e1f27] text-[#b9cacb]'
                }`}
                aria-label="Save to Vault"
              >
                <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onNext}
                className="w-10 h-10 rounded-lg border-[2px] border-black bg-[#1e1f27] text-[#e3e1ec] flex items-center justify-center shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-transform cursor-pointer"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                className="w-11 h-11 rounded-lg border-[2px] border-black bg-[#fde400] text-[#201c00] flex items-center justify-center shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-transform cursor-pointer shrink-0"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering ? (
                  <div className="w-4 h-4 border-2 border-[#201c00] border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP & CINEMA COMICBEATS PERSISTENT BOTTOM DECK (h-24) ── */}
      <footer
        className={`${
          isCinemaMode
            ? 'flex flex-col md:flex-row py-3 md:py-0 md:h-24 gap-3 md:gap-0 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]'
            : 'hidden md:flex md:h-24'
        } w-full bg-[#1e1f27] border-t-[3px] border-black shadow-[0_-4px_0px_#000000] px-4 sm:px-6 items-center justify-between gap-4`}
      >
        {/* Left Zone: Track Info & Vault Heart */}
        <div
          className={`flex items-center gap-3 ${
            isCinemaMode
              ? 'w-full md:w-[290px] lg:w-[320px] justify-between md:justify-start'
              : 'w-[270px] lg:w-[310px]'
          } shrink-0`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleCinema}
              className="relative w-11 h-11 md:w-14 md:h-14 bg-[#34343c] border-[2px] border-black shadow-[3px_3px_0px_#000000] shrink-0 overflow-hidden cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
              title={isCinemaMode ? 'Exit Fullscreen Stage' : 'Open Action Stage'}
              aria-label={isCinemaMode ? 'Exit Fullscreen Stage' : 'Open Action Stage'}
            >
              <ArtworkImage
                title={cleanTitle}
                artist={artist}
                trackId={currentTrack.id}
                initialSrc={currentTrack.thumbnail}
                alt={cleanTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </button>

            <div className="min-w-0 overflow-hidden text-left">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onToggleCinema}
                  className="text-sm font-bold uppercase text-[#e3e1ec] hover:text-[#00f0ff] truncate leading-tight cursor-pointer transition-colors"
                  title={cleanTitle}
                >
                  {cleanTitle}
                </button>
              </div>
              <p className="text-xs text-[#b9cacb] uppercase truncate mt-0.5">{artist}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(currentTrack)}
            className={`w-10 h-10 md:w-9 md:h-9 border-[2px] border-black flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
              isCurrentFavorite
                ? 'bg-[#ff506e] text-white'
                : 'bg-[#1a1b22] text-[#b9cacb] hover:text-[#ff506e] hover:bg-[#292931]'
            }`}
            title={isCurrentFavorite ? 'Saved in Issue Vault' : 'Save to Issue Vault'}
            aria-label={isCurrentFavorite ? 'Remove from Vault' : 'Save to Vault'}
          >
            <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center Zone: Ink-Bordered Transport Controls & Hard-Bordered Cyan Scrubber */}
        <div className="w-full md:flex-1 md:max-w-xl flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleShuffle}
              className={`w-10 h-10 md:w-8 md:h-8 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                isShuffle
                  ? 'bg-[#fde400] text-[#201c00]'
                  : 'bg-[#1a1b22] text-[#e3e1ec] hover:bg-[#292931]'
              }`}
              title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
              aria-label="Toggle shuffle"
              aria-pressed={isShuffle}
            >
              <Shuffle className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>

            <button
              type="button"
              onClick={onPrev}
              className="w-10 h-10 md:w-8 md:h-8 border-[2px] border-black bg-[#1a1b22] text-[#e3e1ec] hover:bg-[#292931] flex items-center justify-center shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="Previous track (P)"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="w-12 h-12 md:w-11 md:h-11 border-[3px] border-black bg-[#00f0ff] text-[#00363a] flex items-center justify-center shadow-[3px_3px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000000] transition-all cursor-pointer shrink-0"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <div className="w-4.5 h-4.5 border-2 border-[#00363a] border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="w-10 h-10 md:w-8 md:h-8 border-[2px] border-black bg-[#1a1b22] text-[#e3e1ec] hover:bg-[#292931] flex items-center justify-center shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="Next track (N)"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onToggleRepeat}
              className={`w-10 h-10 md:w-8 md:h-8 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                repeatMode !== 'off'
                  ? 'bg-[#fde400] text-[#201c00]'
                  : 'bg-[#1a1b22] text-[#e3e1ec] hover:bg-[#292931]'
              }`}
              title={repeatLabel}
              aria-label={repeatLabel}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4 md:w-3.5 md:h-3.5" />
              ) : (
                <Repeat className="w-4 h-4 md:w-3.5 md:h-3.5" />
              )}
            </button>
          </div>

          {/* Hard-Bordered Cyan Progress Bar */}
          <div className="w-full flex items-center gap-2.5 group/scrubber">
            <span className="text-[11px] font-mono font-bold tabular-nums text-[#b9cacb] min-w-[38px] text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center h-8 md:h-4">
              <div className="w-full h-3 bg-[#0d0e15] border-[2px] border-black p-[1px] overflow-hidden pointer-events-none">
                <div
                  className="h-full bg-[#00f0ff] border-r-[2px] border-black transition-[width] duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={effectiveDuration || 100}
                step={0.5}
                value={Math.min(currentTime, effectiveDuration || 100)}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Seek timeline"
              />
            </div>

            <span className="text-[11px] font-mono font-bold tabular-nums text-[#b9cacb] min-w-[38px]">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Right Zone: Comic EQ Strip, Quality, Video, Lyrics, Volume & Queue */}
        <div
          className={`${
            isCinemaMode
              ? 'flex w-full md:w-[300px] lg:w-[340px] justify-between md:justify-end'
              : 'flex w-[270px] lg:w-[340px] justify-end'
          } items-center gap-2 shrink-0`}
        >
          {/* Live 5-Bar Comic EQ Strip */}
          <div
            aria-hidden="true"
            className="hidden xl:flex items-end gap-1 h-7 px-2 py-1 bg-[#0d0e15] border-[2px] border-black shrink-0"
          >
            <span className={`w-1 bg-[#00f0ff] ${isPlaying ? 'animate-bar-1' : 'h-2'}`} />
            <span className={`w-1 bg-[#fde400] ${isPlaying ? 'animate-bar-2' : 'h-3'}`} />
            <span className={`w-1 bg-[#ff506e] ${isPlaying ? 'animate-bar-3' : 'h-1.5'}`} />
            <span className={`w-1 bg-[#00f0ff] ${isPlaying ? 'animate-bar-2' : 'h-2.5'}`} />
            <span className={`w-1 bg-[#7df4ff] ${isPlaying ? 'animate-bar-1' : 'h-2'}`} />
          </div>

          {onChangePlaybackQuality && (
            <div className="relative" ref={qualityMenuRef}>
              <button
                type="button"
                onClick={() => setIsQualityMenuOpen((o) => !o)}
                className={`h-10 md:h-8 px-2.5 md:px-2 border-[2px] border-black text-[11px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000000] ${
                  isQualityMenuOpen
                    ? 'bg-[#00f0ff] text-[#00363a]'
                    : 'bg-[#1a1b22] text-[#e3e1ec] hover:bg-[#292931]'
                }`}
                title={`Stream quality: ${activeQuality.label}`}
                aria-label={`Stream quality: ${activeQuality.label}`}
                aria-expanded={isQualityMenuOpen}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{activeQuality.shortLabel}</span>
              </button>

              {isQualityMenuOpen && (
                <div
                  role="menu"
                  className="absolute bottom-12 md:bottom-11 left-0 md:left-auto md:right-0 w-60 max-w-[calc(100vw-2rem)] bg-[#1e1f27] border-[2px] border-black shadow-[5px_5px_0px_#000000] p-1.5 z-50"
                >
                  <div className="px-2.5 py-1.5 border-b-[2px] border-black mb-1">
                    <p className="font-display text-lg text-[#00f0ff] tracking-wide leading-none">
                      STREAM QUALITY
                    </p>
                    <p className="text-[10px] text-[#b9cacb] uppercase">YouTube resolution lock</p>
                  </div>
                  {STREAM_QUALITY_OPTIONS.map((option) => {
                    const selected = option.id === activeQuality.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => {
                          onChangePlaybackQuality(option.id);
                          setIsQualityMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#00f0ff] text-[#00363a] font-bold'
                            : 'text-[#e3e1ec] hover:bg-[#292931]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight uppercase">{option.label}</p>
                          <p
                            className={`text-[10px] mt-0.5 leading-tight ${
                              selected ? 'text-[#00363a]/80' : 'text-[#b9cacb]'
                            }`}
                          >
                            {option.detail}
                          </p>
                        </div>
                        {selected && <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleVideo}
              className={`w-10 h-10 md:w-8 md:h-8 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0px_#000000] cursor-pointer transition-colors ${
                isVideoActive
                  ? 'bg-[#ff506e] text-white'
                  : 'bg-[#1a1b22] text-[#e3e1ec] hover:bg-[#292931]'
              }`}
              title={isVideoActive ? 'Hide Video' : 'Fullscreen Video'}
              aria-label={isVideoActive ? 'Hide video' : 'Watch video'}
            >
              <Film className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleLyrics}
              className={`w-10 h-10 md:w-8 md:h-8 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0px_#000000] cursor-pointer transition-colors ${
                isLyricsActive
                  ? 'bg-[#fde400] text-[#201c00]'
                  : 'bg-[#1a1b22] text-[#e3e1ec] hover:bg-[#292931]'
              }`}
              title="Comic Lyrics Stream"
              aria-label="Open synchronized lyrics"
            >
              <Mic2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleCinema}
              className={`w-10 h-10 md:w-8 md:h-8 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0px_#000000] cursor-pointer transition-colors ${
                isCinemaMode
                  ? 'bg-[#00f0ff] text-[#00363a]'
                  : 'bg-[#1a1b22] text-[#e3e1ec] hover:bg-[#292931]'
              }`}
              title={isCinemaMode ? 'Exit Action Stage (Esc)' : 'Open Action Stage'}
              aria-label={isCinemaMode ? 'Exit Action Stage' : 'Open Action Stage'}
            >
              {isCinemaMode ? (
                <Minimize2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
              ) : (
                <Maximize2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
              )}
            </button>
          </div>

          {/* Hard-Bordered Comic Yellow Volume Meter */}
          <div className="hidden lg:flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={() => onChangeVolume(volume === 0 ? 80 : 0)}
              className="text-[#b9cacb] hover:text-[#fde400] cursor-pointer transition-colors"
              title={volume === 0 ? 'Unmute (M)' : `Mute (${volume}%)`}
              aria-label={volume === 0 ? 'Unmute audio' : 'Mute audio'}
            >
              <VolumeIcon className="w-4 h-4" />
            </button>

            <div className="relative w-20 h-4 flex items-center">
              <div className="w-full h-2.5 bg-[#0d0e15] border-[2px] border-black overflow-hidden pointer-events-none">
                <div
                  className="h-full bg-[#fde400] border-r-[2px] border-black"
                  style={{ width: `${volumePercent}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => onChangeVolume(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Volume"
                title={`Volume: ${volume}%`}
              />
            </div>
          </div>

          {onOpenQueue && (
            <button
              type="button"
              onClick={onOpenQueue}
              className="w-10 h-10 md:w-8 md:h-8 border-[2px] border-black bg-[#1a1b22] text-[#e3e1ec] hover:bg-[#00f0ff] hover:text-[#00363a] flex items-center justify-center shadow-[2px_2px_0px_#000000] cursor-pointer transition-colors"
              title="Open Issue Vault Queue"
              aria-label="Open Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
