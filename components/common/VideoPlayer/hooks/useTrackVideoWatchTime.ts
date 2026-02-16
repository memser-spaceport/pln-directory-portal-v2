import { useEffect, useMemo, useRef } from 'react';
import { Player } from '@/components/common/VideoPlayer/types';

/**
 * Generate a unique session ID for video watch tracking
 */
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export interface WatchedSegment {
  start: number; // Segment start in seconds
  end: number; // Segment end in seconds
}

export interface VideoWatchTimeData {
  sessionId: string; // Unique per viewing session
  videoUrl: string;
  watchTimeMs: number; // Time watched this interval
  totalWatchTimeMs: number; // Cumulative for session
  videoDurationMs: number; // Total video length
  percentWatched: number; // 0-100
  currentPosition: number; // Current position in seconds
  playbackRate: number; // 0.5, 1, 1.25, 1.5, 2
  isComplete: boolean; // Video reached end
  isFinalReport: boolean; // True on unmount/modal close

  // Drop-off tracking (for Audience Retention chart)
  exitPosition: number; // Position when user stopped/closed (seconds)
  maxPositionReached: number; // Furthest point reached in video (seconds)
  watchedSegments: WatchedSegment[]; // Segments actually watched (for rewatch detection)
}

export interface UseTrackVideoWatchTimeConfig {
  /** The video source URL */
  videoUrl: string;
  /** The video.js player instance */
  player: Player | null;
  /** Function to call when reporting watch time */
  onWatchTimeReport: (data: VideoWatchTimeData) => void;
  /** Interval in milliseconds to report time (default: 30000 = 30 seconds) */
  reportInterval?: number;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook to track video watch time and report it at intervals
 *
 * Features:
 * - Tracks cumulative video playback time via video.js events
 * - Handles seeks correctly (only counts actually watched time)
 * - Reports every 30 seconds and on unmount
 * - Generates unique sessionId for aggregation
 * - Tracks watched segments for rewatch detection
 */
export const useTrackVideoWatchTime = (config: UseTrackVideoWatchTimeConfig) => {
  const { videoUrl, player, onWatchTimeReport, reportInterval = 30000, enabled = true } = config;

  // Generate unique session ID on mount (only once)
  const sessionId = useMemo(() => generateSessionId(), []);

  // Store callback in ref to avoid effect re-runs when callback identity changes
  const onWatchTimeReportRef = useRef(onWatchTimeReport);
  onWatchTimeReportRef.current = onWatchTimeReport;

  // Store config values in refs
  const videoUrlRef = useRef(videoUrl);
  videoUrlRef.current = videoUrl;

  // Refs for tracking state
  const totalWatchTimeMsRef = useRef<number>(0);
  const lastReportTimeMsRef = useRef<number>(0);
  const intervalWatchTimeMsRef = useRef<number>(0);
  const lastPositionRef = useRef<number>(0);
  const maxPositionReachedRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const playbackRateRef = useRef<number>(1);
  const isCompleteRef = useRef<boolean>(false);
  const videoDurationRef = useRef<number>(0);
  const watchedSegmentsRef = useRef<WatchedSegment[]>([]);
  const currentSegmentStartRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeupdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled || !player) return;

    // Safely get current time from player (handles disposed state)
    const safeGetCurrentTime = (): number => {
      try {
        if (player && typeof player.currentTime === 'function' && !player.isDisposed?.()) {
          return player.currentTime() || 0;
        }
      } catch {
        // Player may be disposed or in an invalid state
      }
      return lastPositionRef.current;
    };

    // Create the report data object
    const createReportData = (isFinalReport: boolean): VideoWatchTimeData => {
      const currentPosition = safeGetCurrentTime();

      return {
        sessionId,
        videoUrl: videoUrlRef.current,
        watchTimeMs: intervalWatchTimeMsRef.current,
        totalWatchTimeMs: totalWatchTimeMsRef.current,
        videoDurationMs: videoDurationRef.current * 1000,
        percentWatched:
          videoDurationRef.current > 0
            ? Math.min(100, (maxPositionReachedRef.current / videoDurationRef.current) * 100)
            : 0,
        currentPosition,
        playbackRate: playbackRateRef.current,
        isComplete: isCompleteRef.current,
        isFinalReport,
        exitPosition: currentPosition,
        maxPositionReached: maxPositionReachedRef.current,
        watchedSegments: [...watchedSegmentsRef.current],
      };
    };

    // Send report
    const sendReport = (isFinalReport: boolean) => {
      // Only report if there's meaningful watch time (> 500ms)
      if (intervalWatchTimeMsRef.current > 500 || isFinalReport) {
        const reportData = createReportData(isFinalReport);
        onWatchTimeReportRef.current(reportData);

        // Reset interval watch time after reporting
        intervalWatchTimeMsRef.current = 0;
        lastReportTimeMsRef.current = Date.now();
      }
    };

    // Close current segment (on pause, seek, ended, or unmount)
    const closeCurrentSegment = () => {
      if (currentSegmentStartRef.current !== null) {
        const currentPosition = safeGetCurrentTime();
        if (currentPosition > currentSegmentStartRef.current) {
          watchedSegmentsRef.current.push({
            start: currentSegmentStartRef.current,
            end: currentPosition,
          });
        }
        currentSegmentStartRef.current = null;
      }
    };

    // Start a new segment (on play or after seek)
    const startNewSegment = () => {
      currentSegmentStartRef.current = safeGetCurrentTime();
    };

    // Event handlers
    const handlePlay = () => {
      isPlayingRef.current = true;
      lastTimeupdateRef.current = Date.now();
      lastPositionRef.current = safeGetCurrentTime();
      startNewSegment();
    };

    const handlePause = () => {
      isPlayingRef.current = false;
      closeCurrentSegment();
    };

    const handleTimeupdate = () => {
      if (!isPlayingRef.current) return;

      const now = Date.now();
      const currentPosition = safeGetCurrentTime();
      const timeDelta = now - lastTimeupdateRef.current;

      // Check for seek: if position jumped more than expected based on playback rate
      const expectedPositionDelta = (timeDelta / 1000) * playbackRateRef.current;
      const actualPositionDelta = currentPosition - lastPositionRef.current;

      // If the position delta is significantly different from expected, it's likely a seek
      if (Math.abs(actualPositionDelta - expectedPositionDelta) > 2) {
        // This is a seek - close current segment and start a new one
        closeCurrentSegment();
        startNewSegment();
      } else if (timeDelta > 0 && timeDelta < 1000) {
        // Normal playback - accumulate watch time
        // Scale by playback rate to get actual watched content time
        const watchedMs = timeDelta;
        intervalWatchTimeMsRef.current += watchedMs;
        totalWatchTimeMsRef.current += watchedMs;
      }

      // Update max position reached
      if (currentPosition > maxPositionReachedRef.current) {
        maxPositionReachedRef.current = currentPosition;
      }

      lastTimeupdateRef.current = now;
      lastPositionRef.current = currentPosition;
    };

    const handleSeeked = () => {
      // Close current segment and start a new one at the new position
      closeCurrentSegment();
      if (isPlayingRef.current) {
        startNewSegment();
      }
      lastPositionRef.current = safeGetCurrentTime();
      lastTimeupdateRef.current = Date.now();
    };

    const handleEnded = () => {
      isCompleteRef.current = true;
      isPlayingRef.current = false;
      closeCurrentSegment();
      // Final report will be sent on cleanup/unmount
    };

    const handleRatechange = () => {
      try {
        if (player && !player.isDisposed?.()) {
          playbackRateRef.current = player.playbackRate() || 1;
        }
      } catch {
        // Player may be disposed
      }
    };

    const handleLoadedmetadata = () => {
      try {
        if (player && !player.isDisposed?.()) {
          videoDurationRef.current = player.duration() || 0;
        }
      } catch {
        // Player may be disposed
      }
    };

    // Register event listeners
    player.on('play', handlePlay);
    player.on('pause', handlePause);
    player.on('timeupdate', handleTimeupdate);
    player.on('seeked', handleSeeked);
    player.on('ended', handleEnded);
    player.on('ratechange', handleRatechange);
    player.on('loadedmetadata', handleLoadedmetadata);

    // If metadata is already loaded, get duration
    try {
      const duration = player.duration();
      if (duration) {
        videoDurationRef.current = duration;
      }
    } catch {
      // Player may not be ready
    }

    // Set up interval reporting
    intervalRef.current = setInterval(() => {
      if (intervalWatchTimeMsRef.current > 0) {
        sendReport(false);
      }
    }, reportInterval);

    // Cleanup function
    return () => {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Close any open segment
      closeCurrentSegment();

      // Send final report on unmount if there's any watch time
      if (totalWatchTimeMsRef.current > 0) {
        sendReport(true);
      }

      // Remove event listeners (check if player is still valid)
      try {
        if (player && !player.isDisposed?.()) {
          player.off('play', handlePlay);
          player.off('pause', handlePause);
          player.off('timeupdate', handleTimeupdate);
          player.off('seeked', handleSeeked);
          player.off('ended', handleEnded);
          player.off('ratechange', handleRatechange);
          player.off('loadedmetadata', handleLoadedmetadata);
        }
      } catch {
        // Player may already be disposed
      }
    };
  }, [enabled, player, reportInterval, sessionId]);

  return {
    sessionId,
    getTotalWatchTimeMs: () => totalWatchTimeMsRef.current,
    getMaxPositionReached: () => maxPositionReachedRef.current,
    isComplete: () => isCompleteRef.current,
  };
};
