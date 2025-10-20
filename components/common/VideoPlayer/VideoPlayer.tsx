import videojs from 'video.js';
import { useEffect, useRef, useState } from 'react';

import 'video.js/dist/video-js.css';

import { Player } from '@/components/common/VideoPlayer/types';
import { usePersistWatchProgress } from '@/components/common/VideoPlayer/hooks/usePersistWatchProgress';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
}

// Helper function to detect if source is HLS
const isHLSSource = (src: string): boolean => {
  return src.includes('.m3u8') || src.includes('application/x-mpegURL');
};

// Helper function to get appropriate MIME type for source
const getSourceType = (src: string): string => {
  if (isHLSSource(src)) {
    return 'application/x-mpegURL';
  }
  return 'video/mp4';
};

export function VideoPlayer(props: VideoPlayerProps) {
  const { src, poster, autoplay = false } = props;

  const [player, setPlayer] = useState<Player | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoEl) {
      return;
    }

    const player = videojs(videoEl, {
      controls: true,
      autoplay: false,
      fluid: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      sources: [
        {
          src,
          type: getSourceType(src),
        },
      ],
      poster,
      controlBar: {
        pictureInPictureToggle: false,
      },
    });

    setPlayer(player);

    return () => {
      player.dispose();
    };
  }, [src, poster, videoEl]);

  usePersistWatchProgress({ src, player });

  return (
    <div
      data-vjs-player
      style={{
        height: '100%',
        paddingTop: 0,
      }}
    >
      <video
        ref={setVideoEl}
        autoPlay={autoplay}
        disablePictureInPicture
        className="video-js vjs-big-play-centered vjs-theme-city vjs-fluid"
      />
    </div>
  );
}
