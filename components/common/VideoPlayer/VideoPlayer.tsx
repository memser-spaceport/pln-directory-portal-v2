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
          type: 'video/mp4',
        },
      ],
      poster,
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
      <video autoPlay={autoplay} ref={setVideoEl} className="video-js vjs-big-play-centered vjs-theme-city vjs-fluid" />
    </div>
  );
}
