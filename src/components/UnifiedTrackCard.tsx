import React from 'react';
import { Track } from '../types/player';
import { cleanTrackTitle, getFullSingerName, formatTime } from '../utils/playerUtils';
import { ArtworkImage } from './ArtworkImage';
import { Play, Pause, Plus, Check, Heart } from 'lucide-react';

interface UnifiedTrackCardProps {
  track: Track;
  variant: 'shelf' | 'card';
  issueNumber?: string;
  fxLabel?: string;
  isCurrent: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  isInQueue: boolean;
  onPlay: (track: Track) => void;
  onTogglePlay: () => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
}

const FX_BADGE_STYLES = [
  { text: 'BOOM!', cls: 'bg-[#ff506e] text-white rotate-2' },
  { text: 'ZAP!', cls: 'bg-[#00f0ff] text-[#00363a] -rotate-2' },
  { text: 'CRUNCH!', cls: 'bg-[#fde400] text-[#201c00] rotate-2' },
  { text: 'PUNCH!', cls: 'bg-[#ff506e] text-white -rotate-3' },
  { text: 'SLAM!', cls: 'bg-[#00f0ff] text-[#00363a] rotate-1' },
];

export const UnifiedTrackCard: React.FC<UnifiedTrackCardProps> = ({
  track,
  variant,
  issueNumber,
  fxLabel,
  isCurrent,
  isPlaying,
  isFavorite,
  isInQueue,
  onPlay,
  onTogglePlay,
  onAddToQueue,
  onToggleFavorite,
}) => {
  const { title: cleanTitle, artistFromTitle } = cleanTrackTitle(track.title, track.artist);
  const artist = getFullSingerName(track.artist || artistFromTitle || '', cleanTitle);
  const durationLabel =
    track.duration && track.duration !== 'YouTube Track'
      ? track.duration
      : track.durationSec > 0
      ? formatTime(track.durationSec)
      : '';

  // Deterministic comic FX badge per track
  const hash = track.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const fx = FX_BADGE_STYLES[hash % FX_BADGE_STYLES.length];
  const badgeText = fxLabel || fx.text;

  const handlePrimaryAction = () => {
    if (isCurrent) {
      onTogglePlay();
    } else {
      onPlay(track);
    }
  };

  if (variant === 'shelf') {
    return (
      <div
        onClick={handlePrimaryAction}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePrimaryAction();
          }
        }}
        className={`group flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-2.5 rounded border-[2px] border-black transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
          isCurrent
            ? 'bg-[#34343c] shadow-[3px_3px_0px_#000000]'
            : 'bg-[#1a1b22] hover:bg-[#292931] shadow-[2px_2px_0px_#000000]'
        }`}
      >
        {/* Rank + Poster + Title & Speech-Tag Artist */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {issueNumber && (
            <div
              className={`hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 border-[2px] border-black font-display text-lg sm:text-xl items-center justify-center shadow-[2px_2px_0px_#000000] shrink-0 ${
                isCurrent
                  ? 'bg-[#fde400] text-[#201c00] -rotate-2'
                  : 'bg-[#1e1f27] text-[#e3e1ec]'
              }`}
            >
              {issueNumber}
            </div>
          )}

          <div className="relative w-12 h-12 rounded border-[2px] border-black bg-[#0d0e15] shadow-[2px_2px_0px_#000000] shrink-0 overflow-hidden">
            <ArtworkImage
              title={cleanTitle}
              artist={artist}
              trackId={track.id}
              initialSrc={track.thumbnail}
              alt={cleanTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isCurrent && isPlaying && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center gap-[3px]">
                <span className="w-[3px] h-4 bg-[#00f0ff] animate-bar-1" />
                <span className="w-[3px] h-5 bg-[#fde400] animate-bar-2" />
                <span className="w-[3px] h-3.5 bg-[#ff506e] animate-bar-3" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-bold uppercase truncate leading-snug tracking-wide ${
                isCurrent ? 'text-[#dbfcff]' : 'text-[#e3e1ec] group-hover:text-[#00f0ff]'
              }`}
            >
              {cleanTitle}
            </p>
            <div className="inline-block mt-0.5 max-w-full">
              <span className="block bg-[#0d0e15] text-[#b9cacb] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-black/80 shadow-[1px_1px_0px_#000000] truncate">
                {artist}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Comic FX Tag + Duration + Actions */}
        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className={`hidden sm:inline-block font-display text-[13px] px-2 py-0.5 border-[2px] border-black shadow-[2px_2px_0px_#000000] ${fx.cls}`}
          >
            {badgeText}
          </span>

          {durationLabel && (
            <span className="hidden md:inline text-xs font-mono font-bold tabular-nums text-[#b9cacb] min-w-[40px] text-right">
              {durationLabel}
            </span>
          )}

          <button
            type="button"
            onClick={() => onToggleFavorite(track)}
            className={`w-9 h-9 sm:w-8 sm:h-8 rounded border-[2px] border-black flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
              isFavorite
                ? 'bg-[#ff506e] text-white'
                : 'bg-[#1e1f27] text-[#b9cacb] hover:text-[#ff506e] hover:bg-[#292931]'
            }`}
            title={isFavorite ? 'Remove from Vault' : 'Save to Vault'}
            aria-label={isFavorite ? `Remove ${cleanTitle} from Vault` : `Save ${cleanTitle} to Vault`}
          >
            <Heart className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onAddToQueue(track)}
            className={`hidden sm:flex w-8 h-8 rounded border-[2px] border-black items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
              isInQueue
                ? 'bg-[#fde400] text-[#201c00]'
                : 'bg-[#1e1f27] text-[#b9cacb] hover:text-[#00f0ff] hover:bg-[#292931]'
            }`}
            title={isInQueue ? 'In Queue' : 'Add to Queue'}
            aria-label={isInQueue ? `${cleanTitle} is in queue` : `Add ${cleanTitle} to queue`}
          >
            {isInQueue ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handlePrimaryAction}
            className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full border-[2px] border-black flex items-center justify-center transition-transform cursor-pointer shadow-[2px_2px_0px_#000000] hover:scale-105 active:translate-x-0.5 active:translate-y-0.5 ${
              isCurrent
                ? 'bg-[#fde400] text-[#201c00]'
                : 'bg-[#00f0ff] text-[#00363a]'
            }`}
            title={isCurrent && isPlaying ? 'Pause' : `Play ${cleanTitle}`}
            aria-label={isCurrent && isPlaying ? `Pause ${cleanTitle}` : `Play ${cleanTitle}`}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Variant: 'card' (Comic Issue Cover Card) ──
  return (
    <div
      onClick={handlePrimaryAction}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePrimaryAction();
        }
      }}
      className={`group flex flex-col justify-between rounded-lg p-2.5 sm:p-3.5 border-[2px] border-black transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
        isCurrent
          ? 'bg-[#292931] shadow-[4px_4px_0px_#00f0ff] sm:shadow-[6px_6px_0px_#00f0ff]'
          : 'bg-[#1e1f27] shadow-[4px_4px_0px_#000000] sm:shadow-[5px_5px_0px_#000000] hover:-translate-y-1 hover:shadow-[7px_7px_0px_#000000]'
      }`}
    >
      {/* Square Comic Cover Art */}
      <div className="relative aspect-square w-full rounded overflow-hidden border-[2px] border-black bg-[#0d0e15] mb-2.5 sm:mb-3.5">
        <ArtworkImage
          title={cleanTitle}
          artist={artist}
          trackId={track.id}
          initialSrc={track.thumbnail}
          alt={cleanTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top-Left Comic Issue Number */}
        {issueNumber && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex items-center gap-1">
            <span className="bg-[#fde400] text-[#201c00] border-[2px] border-black font-display text-xs sm:text-base px-1.5 sm:px-2 py-0.5 leading-none shadow-[2px_2px_0px_#000000] -rotate-3">
              #{issueNumber}
            </span>
          </div>
        )}

        {/* Bottom-Right Comic Burst Tag */}
        <div
          className={`hidden sm:block absolute bottom-2 right-2 border-[2px] border-black font-display text-sm px-2 py-0.5 leading-none shadow-[2px_2px_0px_#000000] ${fx.cls}`}
        >
          {badgeText}
        </div>

        {/* Center Play Action Burst */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrimaryAction();
          }}
          className={`absolute inset-0 m-auto w-11 h-11 sm:w-13 sm:h-13 rounded-full border-[2px] border-black bg-[#00f0ff] text-[#00363a] shadow-[3px_3px_0px_#000000] flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isCurrent
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
          }`}
          title={isCurrent && isPlaying ? 'Pause' : `Play ${cleanTitle}`}
          aria-label={isCurrent && isPlaying ? `Pause ${cleanTitle}` : `Play ${cleanTitle}`}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* Metadata + Bottom Ink Strip */}
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-1.5 mb-0.5">
          <p
            className={`font-display text-lg sm:text-2xl tracking-wide uppercase truncate leading-tight ${
              isCurrent ? 'text-[#00f0ff]' : 'text-[#dbfcff]'
            }`}
          >
            {cleanTitle}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(track);
            }}
            className={`w-8 h-8 -mr-1.5 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              isFavorite ? 'text-[#ff506e]' : 'text-[#b9cacb] hover:text-[#ff506e]'
            }`}
            aria-label={isFavorite ? 'Remove from Vault' : 'Save to Vault'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        <p className="text-[11px] sm:text-xs text-[#b9cacb] uppercase font-medium truncate">{artist}</p>
      </div>
    </div>
  );
};
