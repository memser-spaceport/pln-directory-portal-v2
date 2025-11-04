import { useEffect, useRef } from 'react';

interface UseCardVisibilityTrackingOptions {
  onVisible: () => void;
  threshold?: number;
  rootMargin?: string;
  trackOnce?: boolean;
}

/**
 * Custom hook to track when a card becomes visible in the viewport using Intersection Observer
 * @param onVisible - Callback function to execute when the card becomes visible
 * @param threshold - Percentage of the card that must be visible (0-1). Default: 0.5 (50%)
 * @param rootMargin - Margin around the root. Default: '0px'
 * @param trackOnce - Whether to track only once per session. Default: true
 * @returns ref - Ref to attach to the element you want to track
 */
export function useCardVisibilityTracking<T extends HTMLElement>({
  onVisible,
  threshold = 0.5,
  rootMargin = '0px',
  trackOnce = true,
}: UseCardVisibilityTrackingOptions) {
  const elementRef = useRef<T>(null);
  const hasBeenTrackedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Skip if already tracked and trackOnce is enabled
    if (trackOnce && hasBeenTrackedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Check if element is intersecting (visible)
          if (entry.isIntersecting) {
            // Skip if already tracked and trackOnce is enabled
            if (trackOnce && hasBeenTrackedRef.current) return;

            // Execute callback
            onVisible();

            // Mark as tracked
            hasBeenTrackedRef.current = true;

            // If trackOnce is enabled, disconnect observer after first trigger
            if (trackOnce) {
              observer.disconnect();
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [onVisible, threshold, rootMargin, trackOnce]);

  return elementRef;
}

