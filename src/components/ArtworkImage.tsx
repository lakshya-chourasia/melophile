import React, { useState, useEffect, useRef } from 'react';
import {
  getArtwork,
  getCachedArtworkSync,
  isHighResStudioPoster,
  isArtworkKnownMissSync,
  optimizePosterUrl,
  isImageDecoded,
  markImageDecoded,
} from '../services/artworkService';
import { Disc3 } from 'lucide-react';

interface ArtworkImageProps {
  title: string;
  artist?: string;
  trackId?: string;
  initialSrc?: string;
  alt?: string;
  className?: string;
  aspectRatio?: 'square' | 'video';
  priority?: boolean;
  onArtworkLoaded?: (url: string) => void;
}

const UNSPLASH_MOTION_BLUR_COVERS = [
  'https://images.unsplash.com/photo-1589194837853-340f4a2f6559?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1788126926223-c6c347f983de?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1786785712260-c45edee3b3cc?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1786619208084-5de18c4bb727?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1791299086799-4dec6aa00152?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1655657120325-f336aa4a853f?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1785920223184-c644f44f4eb6?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1794310044691-04afe02faa44?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1783542784568-31ec90b54206?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1794310044713-a1b1de19a87f?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1790918891296-dae6e7b99948?auto=format&fit=crop&w=480&q=75',
  'https://images.unsplash.com/photo-1787612498856-b8bb946c1967?auto=format&fit=crop&w=480&q=75',
];

const COLOURFUL_COVER_GRADIENTS = [
  'bg-gradient-to-br from-[#ff2e63] via-[#ff7b00] to-[#fde400]',
  'bg-gradient-to-tr from-[#00f0ff] via-[#3b82f6] to-[#7c3aed]',
  'bg-gradient-to-br from-[#ec4899] via-[#a855f7] to-[#6366f1]',
  'bg-gradient-to-bl from-[#10b981] via-[#06b6d4] to-[#3b82f6]',
  'bg-gradient-to-br from-[#f97316] via-[#ef4444] to-[#ec4899]',
  'bg-gradient-to-tr from-[#8b5cf6] via-[#ec4899] to-[#f43f5e]',
  'bg-gradient-to-br from-[#06b6d4] via-[#10b981] to-[#84cc16]',
  'bg-gradient-to-tl from-[#f59e0b] via-[#ec4899] to-[#6366f1]',
  'bg-gradient-to-br from-[#14b8a6] via-[#6366f1] to-[#a855f7]',
  'bg-gradient-to-tr from-[#fb7185] via-[#f97316] to-[#facc15]',
  'bg-gradient-to-bl from-[#22d3ee] via-[#818cf8] to-[#f472b6]',
  'bg-gradient-to-br from-[#34d399] via-[#3b82f6] to-[#8b5cf6]',
  'bg-gradient-to-tr from-[#f43f5e] via-[#d946ef] to-[#00f0ff]',
  'bg-gradient-to-br from-[#fde047] via-[#10b981] to-[#06b6d4]',
];

function hashCoverSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function getColourfulGradientClass(seed: string): string {
  const index = hashCoverSeed(seed) % COLOURFUL_COVER_GRADIENTS.length;
  return COLOURFUL_COVER_GRADIENTS[index];
}

function getMotionBlurCoverUrl(seed: string, size: 'card' | 'hero'): string {
  const index = hashCoverSeed(seed) % UNSPLASH_MOTION_BLUR_COVERS.length;
  return optimizePosterUrl(UNSPLASH_MOTION_BLUR_COVERS[index], size);
}

/**
 * Ultra-Fast Studio Poster Component
 * - Serves edge-optimized 400px/600px WebP posters (~20KB, ~14ms) with automatic raw-URL fallback.
 * - Paints cached/pre-decoded posters at opacity-100 on Frame 0 (zero fade delay).
 * - Falls back deterministically to Unsplash motion-blur photography when no studio cover exists.
 */
export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  title,
  artist = '',
  trackId,
  initialSrc,
  alt,
  className = '',
  aspectRatio = 'square',
  priority = false,
  onArtworkLoaded,
}) => {
  const isVideoMode = aspectRatio === 'video';
  const sizeTier: 'card' | 'hero' = priority ? 'hero' : 'card';
  const seed = `${trackId || ''}|${title || ''}|${artist || ''}`;
  const gradientClass = getColourfulGradientClass(seed);
  const motionBlurFallbackUrl = getMotionBlurCoverUrl(seed, sizeTier);

  const getInitialRawCandidate = () => {
    if (isVideoMode) {
      if (initialSrc) return initialSrc;
      if (trackId && !trackId.startsWith('http')) {
        return `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`;
      }
      return '';
    }
    const cachedSyncUrl = getCachedArtworkSync(title, artist, trackId);
    if (cachedSyncUrl && isHighResStudioPoster(cachedSyncUrl)) return cachedSyncUrl;
    if (initialSrc && isHighResStudioPoster(initialSrc)) return initialSrc;
    return '';
  };

  const initialRaw = getInitialRawCandidate();
  const initialOptimized = initialRaw ? optimizePosterUrl(initialRaw, sizeTier) : '';
  const initialKnownMiss = !isVideoMode && !initialRaw && isArtworkKnownMissSync(title, artist);

  const [rawSrc, setRawSrc] = useState<string>(initialRaw);
  const [src, setSrc] = useState<string>(initialOptimized);
  const [isLoaded, setIsLoaded] = useState<boolean>(isImageDecoded(initialOptimized));
  const [hasError, setHasError] = useState<boolean>(initialKnownMiss);
  const [isResolved, setIsResolved] = useState<boolean>(
    Boolean(initialOptimized) || isVideoMode || initialKnownMiss
  );
  const [fallbackLoaded, setFallbackLoaded] = useState<boolean>(isImageDecoded(motionBlurFallbackUrl));
  const [fallbackError, setFallbackError] = useState<boolean>(false);
  const primaryImgRef = useRef<HTMLImageElement | null>(null);
  const fallbackImgRef = useRef<HTMLImageElement | null>(null);
  const onArtworkLoadedRef = useRef(onArtworkLoaded);
  onArtworkLoadedRef.current = onArtworkLoaded;

  useEffect(() => {
    setFallbackLoaded(isImageDecoded(motionBlurFallbackUrl));
    setFallbackError(false);
  }, [motionBlurFallbackUrl]);

  useEffect(() => {
    let isCancelled = false;

    const applyCandidate = (rawUrl: string) => {
      const optimized = optimizePosterUrl(rawUrl, sizeTier);
      setRawSrc(rawUrl);
      setSrc(optimized);
      setHasError(false);
      setIsResolved(true);
      setIsLoaded(isImageDecoded(optimized));
      onArtworkLoadedRef.current?.(rawUrl);
    };

    if (isVideoMode) {
      const videoCandidate =
        initialSrc ||
        (trackId && !trackId.startsWith('http')
          ? `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`
          : '');
      if (videoCandidate) {
        setRawSrc(videoCandidate);
        setSrc(videoCandidate);
        setHasError(false);
        setIsResolved(true);
        setIsLoaded(isImageDecoded(videoCandidate));
        onArtworkLoadedRef.current?.(videoCandidate);
      } else {
        setRawSrc('');
        setSrc('');
        setHasError(true);
        setIsResolved(true);
        setIsLoaded(false);
      }
      return;
    }

    const syncHit = getCachedArtworkSync(title, artist, trackId);
    if (syncHit && isHighResStudioPoster(syncHit)) {
      applyCandidate(syncHit);
      return;
    }

    if (initialSrc && isHighResStudioPoster(initialSrc)) {
      applyCandidate(initialSrc);
      return;
    }

    if (isArtworkKnownMissSync(title, artist)) {
      setRawSrc('');
      setSrc('');
      setHasError(true);
      setIsResolved(true);
      setIsLoaded(false);
      return;
    }

    // Never push a YouTube thumbnail into a 1:1 square cover slot while resolving
    setRawSrc('');
    setSrc('');
    setIsLoaded(false);
    setHasError(false);
    setIsResolved(false);

    getArtwork(title, artist, trackId)
      .then((artUrl) => {
        if (!isCancelled) {
          if (artUrl && isHighResStudioPoster(artUrl)) {
            applyCandidate(artUrl);
          } else {
            setRawSrc('');
            setSrc('');
            setHasError(true);
            setIsResolved(true);
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setRawSrc('');
          setSrc('');
          setHasError(true);
          setIsResolved(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [title, artist, trackId, initialSrc, isVideoMode, sizeTier]);

  // Instant Frame-0 check for images already resident in browser RAM cache
  useEffect(() => {
    const img = primaryImgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && src) {
      markImageDecoded(src);
      setIsLoaded(true);
    }
  }, [src]);

  useEffect(() => {
    const img = fallbackImgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && motionBlurFallbackUrl) {
      markImageDecoded(motionBlurFallbackUrl);
      setFallbackLoaded(true);
    }
  }, [motionBlurFallbackUrl, isResolved, hasError]);

  const showPrimaryImage = Boolean(src) && !hasError;
  const showMotionBlurFallback = !showPrimaryImage && isResolved && !fallbackError;
  const alreadyDecodedPrimary = showPrimaryImage && isLoaded;
  const alreadyDecodedFallback = showMotionBlurFallback && fallbackLoaded;

  return (
    <div className={`relative overflow-hidden select-none ${gradientClass} ${className}`}>
      {/* Colourful Gradient Base (shown briefly while loading or if offline) */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center ${gradientClass} transition-opacity duration-150 ${
          alreadyDecodedPrimary || alreadyDecodedFallback ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.42),transparent_56%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_85%,rgba(0,0,0,0.28),transparent_58%)]" />
        <Disc3 className="relative w-1/3 h-1/3 max-w-14 max-h-14 min-w-4 min-h-4 text-white/35 drop-shadow-[0_2px_6px_rgba(0,0,0,0.28)]" />
      </div>

      {/* Verified Unsplash Motion Blur Photography Fallback When Cover Art Does Not Exist */}
      {showMotionBlurFallback && (
        <img
          ref={fallbackImgRef}
          src={motionBlurFallbackUrl}
          alt={alt || `${title} by ${artist} cover art`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => {
            markImageDecoded(motionBlurFallbackUrl);
            setFallbackLoaded(true);
          }}
          onError={() => setFallbackError(true)}
          className={`relative z-[1] w-full h-full object-cover transition-opacity duration-150 ${
            fallbackLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Real Studio Album Cover / Video Thumbnail */}
      {showPrimaryImage && (
        <img
          ref={primaryImgRef}
          src={src}
          alt={alt || `${title} by ${artist} album artwork`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => {
            markImageDecoded(src);
            setIsLoaded(true);
          }}
          onError={() => {
            // If rewritten WebP URL fails for any reason, retry original raw studio URL once
            if (rawSrc && src !== rawSrc) {
              setSrc(rawSrc);
              return;
            }
            if (isVideoMode && trackId && !trackId.startsWith('http')) {
              const fallbackYt = `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`;
              if (src !== fallbackYt) {
                setRawSrc(fallbackYt);
                setSrc(fallbackYt);
                return;
              }
            }
            setHasError(true);
            setIsResolved(true);
            setIsLoaded(true);
          }}
          className={`relative z-[1] w-full h-full object-cover transition-opacity duration-150 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
