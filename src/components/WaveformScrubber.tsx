import React, { useMemo, useRef, useState } from 'react';
import { formatTime } from '../utils/playerUtils';

interface WaveformScrubberProps {
  trackId: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  barCount?: number;
  showTimestamps?: boolean;
  className?: string;
}

/**
 * Deterministic organic audio waveform scrubber with click & drag seeking.
 * Styled after the midnight-navy studio reference with a vibrant played-bar gradient.
 */
export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  trackId,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  barCount = 42,
  showTimestamps = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  const effectiveDuration = duration > 0 ? duration : 240;
  const progressRatio = Math.min(1, Math.max(0, currentTime / effectiveDuration));

  // Deterministic pseudo-random organic audio envelope per trackId
  const bars = useMemo(() => {
    let seed = 2166136261;
    for (let i = 0; i < trackId.length; i++) {
      seed ^= trackId.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }

    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      seed = Math.imul(seed ^ (i + 17), 1664525) + 1013904223;
      const rand = ((seed >>> 0) % 1000) / 1000;

      // Taper edges naturally like a real studio master waveform
      const pos = i / (barCount - 1);
      const envelope = Math.sin(pos * Math.PI);
      const secondaryWave = 0.55 + 0.45 * Math.sin(pos * Math.PI * 5 + (seed % 7));
      const rawHeight = (0.18 + rand * 0.72) * (0.28 + 0.72 * envelope) * secondaryWave;
      heights.push(Math.max(0.14, Math.min(1, rawHeight)));
    }
    return heights;
  }, [trackId, barCount]);

  const computeTimeFromClientX = (clientX: number): number => {
    const el = containerRef.current;
    if (!el) return currentTime;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * effectiveDuration;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    onSeek(computeTimeFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverPercent(ratio);
    if (isDragging) {
      onSeek(ratio * effectiveDuration);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 5;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSeek(Math.min(effectiveDuration, currentTime + step));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSeek(Math.max(0, currentTime - step));
    }
  };

  const activeBarIndex = Math.floor(progressRatio * barCount);

  return (
    <div className={`w-full select-none ${className}`}>
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label="Seek audio timeline"
        aria-valuemin={0}
        aria-valuemax={Math.round(effectiveDuration)}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(effectiveDuration)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setHoverPercent(null);
          setIsDragging(false);
        }}
        onKeyDown={handleKeyDown}
        className="w-full h-9 flex items-center justify-between gap-[2.5px] cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 rounded-lg px-0.5"
      >
        {bars.map((height, idx) => {
          const ratio = idx / (barCount - 1);
          const isPlayed = ratio <= progressRatio;
          const isHovered = hoverPercent !== null && ratio <= hoverPercent;
          const isActiveEdge = idx === activeBarIndex && isPlaying;

          // Played waveform uses a smooth electric sky -> violet -> coral-pink spectrum matching the reference
          let barColor = 'rgba(255, 255, 255, 0.16)';
          if (isPlayed) {
            if (ratio < 0.35) barColor = '#38BDF8';
            else if (ratio < 0.68) barColor = '#A855F7';
            else barColor = '#FB7185';
          } else if (isHovered) {
            barColor = 'rgba(255, 255, 255, 0.38)';
          }

          return (
            <span
              key={idx}
              style={{
                height: `${Math.round(height * 100)}%`,
                backgroundColor: barColor,
                transform: isActiveEdge ? 'scaleY(1.15)' : undefined,
              }}
              className="w-[2.5px] rounded-full transition-[background-color,transform] duration-150 shrink-0"
            />
          );
        })}
      </div>

      {showTimestamps && (
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#8388A8] mt-1 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(effectiveDuration)}</span>
        </div>
      )}
    </div>
  );
};
