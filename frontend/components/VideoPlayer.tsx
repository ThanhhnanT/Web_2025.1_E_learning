"use client";

import React, { useEffect, useRef } from 'react';
import 'plyr/dist/plyr.css';

// Import Plyr dynamically to avoid SSR issues
const loadPlyr = async () => {
  if (typeof window !== 'undefined') {
    try {
      const plyrModule = await import('plyr');
      // Try different ways to get Plyr constructor
      const PlyrConstructor = plyrModule.default || (plyrModule as any).Plyr || plyrModule;
      return PlyrConstructor;
    } catch (error) {
      console.error('Failed to load Plyr:', error);
      return null;
    }
  }
  return null;
};

interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export default function VideoPlayer({ src, title, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current || typeof window === 'undefined') return;

    let isMounted = true;

    // Load and initialize Plyr
    loadPlyr().then((Plyr) => {
      if (!Plyr || !videoRef.current || !isMounted) return;

      // Initialize Plyr
      const player = new Plyr(videoRef.current, {
      controls: [
        'play-large',
        'restart',
        'rewind',
        'play',
        'fast-forward',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
        settings: ['captions', 'quality', 'speed'],
        speed: {
          selected: 1,
          options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        },
        keyboard: {
          focused: true,
          global: false,
        },
        tooltips: {
          controls: true,
          seek: true,
        },
      });

      playerRef.current = player;

      // Set video source
      if (src && videoRef.current) {
        videoRef.current.src = src;
      }
    }).catch((error) => {
      console.error('Error loading Plyr:', error);
    });

    // Cleanup
    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying Plyr:', e);
        }
        playerRef.current = null;
      }
    };
  }, []);

  // Update source when src changes
  useEffect(() => {
    if (videoRef.current && src && playerRef.current) {
      // Update video source directly
      videoRef.current.src = src;
      // Reload video to apply new source
      videoRef.current.load();
    }
  }, [src]);

  return (
    <div className={className}>
      <video ref={videoRef} playsInline />
    </div>
  );
}
