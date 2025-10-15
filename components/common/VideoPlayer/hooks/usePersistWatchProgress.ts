import { useEffect } from 'react';

import { Player } from '@/components/common/VideoPlayer/types';
import { getVideoDataStorageKey } from '@/components/common/VideoPlayer';

interface Input {
  src: string;
  player: Player | null;
}

function getTime(player: Player) {
  return player.currentTime() || 0;
}

export function usePersistWatchProgress(input: Input) {
  const { src, player } = input;

  useEffect(() => {
    if (!player) {
      return;
    }

    const progressKey = getVideoDataStorageKey(src, 'progress');
    const watchedKey = getVideoDataStorageKey(src, 'watched');
    const lengthKey = getVideoDataStorageKey(src, 'length');

    const savedTime = localStorage.getItem(progressKey);
    if (savedTime) {
      const time = parseFloat(savedTime);
      if (!isNaN(time)) {
        player.currentTime(time);
      }
    }

    const saveProgress = () => {
      const current = getTime(player);
      localStorage.setItem(progressKey, current.toString());
    };

    player.on('timeupdate', () => {
      if (Math.floor(getTime(player) || 0) % 5 === 0) {
        saveProgress();
      }
    });

    player.on('pause', saveProgress);

    player.on('ended', () => {
      localStorage.setItem(watchedKey, 'true');
    });

    player.on('loadedmetadata', () => {
      const duration = player.duration();

      if (duration) {
        localStorage.setItem(lengthKey, duration.toString());
      }
    });
  }, [src, player]);
}
