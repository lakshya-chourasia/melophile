import React from 'react';
import { Track } from '../types/player';
import { cleanTrackTitle, getFullSingerName, formatTime } from '../utils/playerUtils';
import { ArtworkImage } from './ArtworkImage';
import { Play, Pause, Heart, Trash2, ListMusic, Shuffle, Compass } from 'lucide-react';

interface QueueViewProps {
  currentTrack: Track | null;
  queue: Track[];
  favorites: Track[];
  isPlaying: boolean;
  isShuffle: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleFavorite: (track: Track) => void;
  onRemoveFromQueue?: (track: Track) => void;
  onClearQueue?: () => void;
  onToggleShuffle: () => void;
  onBrowseHome: () => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  currentTrack,
  queue,
  favorites,
  isPlaying,
  isShuffle,
  onPlayTrack,
  onTogglePlay,
  onToggleFavorite,
  onRemoveFromQueue,
  onClearQueue,
  onToggleShuffle,
  onBrowseHome,
}) => {
  const currentIndex = currentTrack ? queue.findIndex((t) => t.id === currentTrack.id) : -1;

  // Separate currently playing track from upcoming tracks in logical playback order
  const upNextTracks = React.useMemo(() => {
    if (!currentTrack) return queue;
    if (currentIndex === -1) return queue;
    const afterCurrent = queue.slice(currentIndex + 1);
    const beforeCurrent = queue.slice(0, currentIndex);
    return [...afterCurrent, ...beforeCurrent];
  }, [queue, currentTrack, currentIndex]);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const renderTrackRow = (track: Track, indexLabel: string, isNowPlayingRow: boolean) => {
    const { title: cleanTitle, artistFromTitle } = cleanTrackTitle(track.title);
    const artist = getFullSingerName(track.artist || artistFromTitle || '', cleanTitle);
    const fav = isFavorite(track.id);
    const durationLabel =
      track.duration && track.duration !== 'YouTube Track'
        ? track.duration
        : track.durationSec > 0
        ? formatTime(track.durationSec)
        : '—';

    return (
      <div
        key={`${isNowPlayingRow ? 'now' : 'up'}-${track.id}-${indexLabel}`}
        onClick={() => (isNowPlayingRow ? onTogglePlay() : onPlayTrack(track))}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isNowPlayingRow) onTogglePlay();
            else onPlayTrack(track);
          }
        }}
        className={`group flex items-center gap-2.5 sm:gap-3.5 px-2.5 sm:px-3.5 py-2.5 border-2 border-black transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
          isNowPlayingRow
            ? 'bg-[#292931] shadow-[4px_4px_0px_#00f0ff]'
            : 'bg-[#1e1f27] hover:bg-[#292931] shadow-[3px_3px_0px_#000000] hover:-translate-y-0.5'
        }`}
      >
        {/* Index / Equalizer Column */}
        <div className={`${isNowPlayingRow ? 'flex' : 'hidden sm:flex'} w-7 sm:w-8 items-center justify-center shrink-0`}>
          {isNowPlayingRow && isPlaying ? (
            <div className="flex items-end gap-[2px] h-4" aria-label="Playing">
              <span className="w-[3px] bg-[#00f0ff] animate-bar-1" />
              <span className="w-[3px] bg-[#fde400] animate-bar-2" />
              <span className="w-[3px] bg-[#ff506e] animate-bar-3" />
            </div>
          ) : (
            <span
              className={`font-display text-lg tracking-wider ${
                isNowPlayingRow ? 'text-[#00f0ff]' : 'text-[#fde400] group-hover:hidden'
              }`}
            >
              {isNowPlayingRow ? 'LIVE' : `#${indexLabel}`}
            </span>
          )}
          {!isNowPlayingRow && (
            <Play className="w-4 h-4 text-[#00f0ff] fill-[#00f0ff] hidden group-hover:block" />
          )}
        </div>

        {/* Artwork */}
        <div className="w-12 h-12 border-2 border-black overflow-hidden bg-[#0d0e15] shrink-0 shadow-[2px_2px_0px_#000000]">
          <ArtworkImage
            title={cleanTitle}
            artist={artist}
            trackId={track.id}
            initialSrc={track.thumbnail}
            alt={cleanTitle}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-display text-lg tracking-wide uppercase truncate leading-tight ${
              isNowPlayingRow ? 'text-[#00f0ff]' : 'text-[#e3e1ec]'
            }`}
          >
            {cleanTitle}
          </p>
          <p className="text-xs text-[#b9cacb] font-medium truncate mt-0.5">{artist}</p>
        </div>

        {/* Duration */}
        <span className="text-xs font-mono font-bold tabular-nums text-[#b9cacb] hidden sm:inline shrink-0 mr-1">
          {durationLabel}
        </span>

        {/* Row Actions */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => (isNowPlayingRow ? onTogglePlay() : onPlayTrack(track))}
            className="w-9 h-9 bg-[#00f0ff] text-[#00363a] border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
            title={isNowPlayingRow && isPlaying ? 'Pause' : 'Play'}
            aria-label={isNowPlayingRow && isPlaying ? 'Pause current track' : `Play ${cleanTitle}`}
          >
            {isNowPlayingRow && isPlaying ? (
              <Pause className="w-4 h-4 fill-[#00363a]" />
            ) : (
              <Play className="w-4 h-4 fill-[#00363a] ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(track)}
            className={`w-9 h-9 border-2 border-black flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
              fav
                ? 'bg-[#ff506e] text-white shadow-[2px_2px_0px_#000000]'
                : 'bg-[#12131a] text-[#b9cacb] hover:text-white hover:bg-[#292931]'
            }`}
            title={fav ? 'Remove from vault' : 'Save to vault'}
            aria-label={fav ? `Remove ${cleanTitle} from favorites` : `Save ${cleanTitle} to favorites`}
          >
            <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
          </button>

          {!isNowPlayingRow && onRemoveFromQueue && (
            <button
              type="button"
              onClick={() => onRemoveFromQueue(track)}
              className="w-9 h-9 bg-[#12131a] border-2 border-black text-[#b9cacb] hover:text-white hover:bg-[#ff506e] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff506e]"
              title="Remove from queue"
              aria-label={`Remove ${cleanTitle} from queue`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b-[3px] border-black">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="bg-[#fde400] text-[#201c00] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000]">
              THE COMIC VAULT QUEUE
            </span>
            <span className="text-xs font-mono font-bold text-[#00f0ff]">
              {queue.length} {queue.length === 1 ? 'ISSUE' : 'ISSUES'} LOADED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#b9cacb] font-medium">
            {isShuffle ? 'Multiverse Shuffle Active' : 'Sequential Arc Playback'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleShuffle}
            className={`px-4 py-2 border-2 border-black font-display text-sm tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] ${
              isShuffle
                ? 'bg-[#00f0ff] text-[#00363a]'
                : 'bg-[#1e1f27] text-[#e3e1ec] hover:bg-[#292931]'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isShuffle ? 'SHUFFLE ON' : 'SHUFFLE OFF'}</span>
          </button>

          {onClearQueue && upNextTracks.length > 0 && (
            <button
              type="button"
              onClick={onClearQueue}
              className="px-4 py-2 bg-[#ff506e] hover:bg-[#ff6b85] text-white border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-sm tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff506e]"
            >
              CLEAR UP NEXT
            </button>
          )}
        </div>
      </div>

      {/* Now Playing Section */}
      {currentTrack && (
        <div className="space-y-2.5">
          <h3 className="font-display text-lg tracking-wider uppercase text-[#00f0ff] flex items-center gap-2">
            <span>NOW SPINNING</span>
            <span className="h-[2px] flex-1 bg-black" />
          </h3>
          {renderTrackRow(currentTrack, '00', true)}
        </div>
      )}

      {/* Up Next Section */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg tracking-wider uppercase text-[#fde400]">
            UP NEXT ({upNextTracks.length})
          </h3>
          <span className="h-[2px] flex-1 bg-black" />
        </div>

        {upNextTracks.length === 0 ? (
          <div className="border-[3px] border-black bg-[#1e1f27] shadow-[5px_5px_0px_#000000] px-6 py-12 text-center space-y-4">
            <div className="w-12 h-12 bg-[#00f0ff] text-[#00363a] border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center mx-auto -rotate-3">
              <ListMusic className="w-6 h-6" />
            </div>
            <div>
              <p className="font-display text-2xl tracking-wide text-white uppercase">
                QUEUE DECK IS EMPTY!
              </p>
              <p className="text-xs text-[#b9cacb] mt-1 max-w-sm mx-auto">
                Add tracks from Home Base, Explore, or Search to stack your comic session.
              </p>
            </div>
            <button
              type="button"
              onClick={onBrowseHome}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#fde400] hover:bg-[#ffec42] text-[#201c00] border-2 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-base tracking-wider uppercase transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>BROWSE TRACKS</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upNextTracks.map((track, i) =>
              renderTrackRow(track, String(i + 1).padStart(2, '0'), false)
            )}
          </div>
        )}
      </div>
    </section>
  );
};
