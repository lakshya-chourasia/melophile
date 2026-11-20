import React, { useEffect } from 'react';
import { X, Timer } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sleepTimerRemaining: number | null; // seconds remaining
  onSetTimerMinutes: (minutes: number | null) => void;
}

const TIMER_PRESETS = [15, 30, 45, 60, 90];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  sleepTimerRemaining,
  onSetTimerMinutes,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeMinutes =
    sleepTimerRemaining !== null ? Math.ceil(sleepTimerRemaining / 60) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sleep-timer-title"
      onClick={onClose}
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[#111114] border border-white/[0.1] rounded-2xl shadow-2xl p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h3 id="sleep-timer-title" className="text-base font-bold text-zinc-50 leading-tight">
                Sleep Timer
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically pause playback after a set duration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            aria-label="Close sleep timer modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Countdown */}
        {sleepTimerRemaining !== null && (
          <div className="px-4 py-3 bg-[#1a1710] border border-amber-500/35 rounded-xl flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Pausing audio in</span>
            <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
              {Math.floor(sleepTimerRemaining / 60)}:
              {(sleepTimerRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Preset Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {TIMER_PRESETS.map((minutes) => {
            const isSelected = activeMinutes !== null && activeMinutes === minutes;
            return (
              <button
                key={minutes}
                type="button"
                onClick={() => {
                  onSetTimerMinutes(minutes);
                  onClose();
                }}
                className={`h-11 px-3 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  isSelected
                    ? 'bg-amber-400 text-zinc-950 border-amber-300 font-semibold'
                    : 'bg-[#18181D] hover:bg-[#222229] text-zinc-100 border-white/[0.08] hover:border-amber-400/40'
                }`}
              >
                <span className="font-mono tabular-nums">{minutes}</span>
                <span>min</span>
              </button>
            );
          })}
        </div>

        {/* Cancel Active Timer */}
        {sleepTimerRemaining !== null && (
          <button
            type="button"
            onClick={() => {
              onSetTimerMinutes(null);
              onClose();
            }}
            className="w-full h-10 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 rounded-xl transition-colors cursor-pointer"
          >
            Cancel Sleep Timer
          </button>
        )}
      </div>
    </div>
  );
};
