import React, { useState, useEffect } from 'react';
import { X, Link2, Loader2, Play, Plus, Check, AlertCircle } from 'lucide-react';
import { Track } from '../types/player';
import { extractYouTubeId } from '../utils/playerUtils';

interface QuickImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export const QuickImportModal: React.FC<QuickImportModalProps> = ({
  isOpen,
  onClose,
  onPlayTrack,
  onAddToQueue,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedTrack, setResolvedTrack] = useState<Track | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleResolve = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    const videoId = extractYouTubeId(trimmed);
    if (!videoId) {
      setErrorMsg('Enter a valid YouTube link or 11-character video ID.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setIsAdded(false);

    try {
      const res = await fetch(`/api/resolve?urlOrId=${encodeURIComponent(videoId)}`);
      if (!res.ok) {
        throw new Error('Unable to resolve video details.');
      }
      const data = await res.json();
      setResolvedTrack({
        id: data.id,
        title: data.title,
        artist: data.artist,
        duration: data.duration || 'YouTube Track',
        durationSec: 0,
        thumbnail: data.thumbnail,
      });
    } catch {
      setResolvedTrack({
        id: videoId,
        title: 'YouTube Track',
        artist: 'YouTube',
        duration: 'YouTube Track',
        durationSec: 0,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayNow = () => {
    if (!resolvedTrack) return;
    onPlayTrack(resolvedTrack);
    onClose();
  };

  const handleQueue = () => {
    if (!resolvedTrack) return;
    onAddToQueue(resolvedTrack);
    setIsAdded(true);
    setTimeout(() => {
      onClose();
    }, 650);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-import-title"
      onClick={onClose}
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#111114] border border-white/[0.1] rounded-2xl shadow-2xl p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="quick-import-title" className="text-base font-bold text-zinc-50 leading-tight">
                Import YouTube Track
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Paste any YouTube URL or 11-character video ID
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            aria-label="Close import modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleResolve} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              autoFocus
              className="flex-1 h-10 px-3.5 text-sm bg-[#18181D] border border-white/[0.09] focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/20 rounded-xl text-zinc-100 placeholder:text-zinc-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="h-10 px-4 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Resolve</span>
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>

        {/* Resolved Preview */}
        {resolvedTrack && (
          <div className="p-3.5 bg-[#18181D] border border-white/[0.08] rounded-xl space-y-3.5">
            <div className="flex items-center gap-3">
              <img
                src={resolvedTrack.thumbnail}
                alt={resolvedTrack.title}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-lg object-cover shrink-0 border border-white/[0.08] bg-[#0c0c0f]"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-zinc-50 truncate">
                  {resolvedTrack.title}
                </h4>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{resolvedTrack.artist}</p>
                <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{resolvedTrack.id}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePlayNow}
                className="flex-1 h-9 px-4 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-zinc-950" />
                <span>Play Now</span>
              </button>

              <button
                type="button"
                onClick={handleQueue}
                disabled={isAdded}
                className="h-9 px-4 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-zinc-100 border border-white/[0.09] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-75"
              >
                {isAdded ? (
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{isAdded ? 'Added' : 'Add to Queue'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
