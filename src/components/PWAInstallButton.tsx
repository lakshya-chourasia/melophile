import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Automatically suppress once running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  // Native Chromium / Android / Desktop one-tap install
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="h-9 px-3 bg-[#00f0ff] hover:bg-[#5ef6ff] text-[#00363a] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-sm tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
        title="Install Melophile for uninterrupted Android background playback"
        aria-label="Install Melophile App"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="hidden sm:inline">INSTALL APP</span>
      </button>
    );
  }

  // Show guided setup button on Android / iOS mobile browsers when native prompt hasn't fired yet
  if (!isAndroid && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="h-9 px-3 bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 font-display text-sm tracking-wider uppercase whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
        title="Install Melophile for full background playback"
        aria-label="Install Melophile App"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#00f0ff]" />
        <span className="hidden sm:inline">INSTALL APP</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install Melophile for Background Play"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1e1f27] border-[3px] border-black p-6 shadow-[8px_8px_0px_#000000] space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="absolute -top-3.5 left-4 bg-[#fde400] text-[#201c00] border-2 border-black px-2 py-0.5 font-display text-xs tracking-wider uppercase -rotate-2 shadow-[2px_2px_0px_#000000]">
              PWA SETUP!
            </span>

            <div className="flex items-start justify-between gap-3 pt-1">
              <div>
                <h3 className="font-display text-2xl tracking-wide text-white uppercase leading-none">
                  {isIOS ? 'Install on iPhone / iPad' : 'Background Play on Android'}
                </h3>
                <p className="text-xs text-[#b9cacb] mt-1.5 font-medium">
                  {isIOS
                    ? 'Add Melophile to your Home Screen for standalone playback.'
                    : 'Install Melophile as an app for dedicated lock-screen controls and screen-off playback.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 bg-[#292931] hover:bg-[#ff506e] text-white border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                aria-label="Close install guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs text-[#e3e1ec] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 bg-[#00f0ff] text-[#00363a] border-2 border-black font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <strong className="text-[#00f0ff]">Share</strong> button in the Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 bg-[#fde400] text-[#201c00] border-2 border-black font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong className="text-[#fde400]">Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-[#e3e1ec] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 bg-[#00f0ff] text-[#00363a] border-2 border-black font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Open the Chrome menu (<strong className="text-white">⋮</strong>) and tap{' '}
                    <strong className="text-[#00f0ff]">Add to Home screen → Install</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 bg-[#fde400] text-[#201c00] border-2 border-black font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Launch <strong className="text-white">Melophile</strong> from your Home Screen. Lock-screen artwork, Play/Pause, Next/Previous, and Bluetooth controls work automatically.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 bg-[#ff506e] text-white border-2 border-black font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>
                    For longest screen-off sessions, set Chrome / Melophile battery usage to{' '}
                    <strong className="text-[#ff506e]">Unrestricted</strong> in Android Settings.
                  </span>
                </li>
              </ol>
            )}

            <div className="pt-3 flex items-center justify-between gap-2 text-[11px] text-[#b9cacb] border-t-2 border-black">
              <span className="flex items-center gap-1.5 text-[#00f0ff] font-bold uppercase tracking-wider">
                <Check className="w-3.5 h-3.5" />
                MediaSession Ready
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-1.5 bg-[#fde400] text-[#201c00] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-sm tracking-wider uppercase cursor-pointer"
              >
                GOT IT!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
