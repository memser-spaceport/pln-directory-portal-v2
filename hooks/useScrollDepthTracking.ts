'use client';

import { useEffect, useRef } from 'react';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';

type ScrollDepthThreshold = 50 | 70 | 90;

/**
 * Custom hook to track scroll depth for analytics
 * Tracks when user scrolls to 50%, 70%, and 90% of the page
 * Each threshold is only tracked once per page load
 * 
 * @param pageName - The name of the page being tracked (e.g., 'overview', 'activities', 'faqs')
 */
export function useScrollDepthTracking(pageName: string) {
  const { onScrollDepth } = useAlignmentAssetsAnalytics();
  const trackedDepths = useRef<Set<ScrollDepthThreshold>>(new Set());
  
  // Store the latest onScrollDepth in a ref to avoid stale closures
  const onScrollDepthRef = useRef(onScrollDepth);
  const pageNameRef = useRef(pageName);
  
  // Keep refs updated with latest values
  useEffect(() => {
    onScrollDepthRef.current = onScrollDepth;
  }, [onScrollDepth]);
  
  useEffect(() => {
    pageNameRef.current = pageName;
  }, [pageName]);

  useEffect(() => {
    // Reset tracked depths when page changes
    trackedDepths.current.clear();
    
    const handleScroll = () => {
      const scrollTop = document.body.scrollTop;
      const scrollHeight = document.body.scrollHeight - document.body.clientHeight;
      
      // Skip if page is not scrollable (content fits in viewport)
      if (scrollHeight <= 0) {
        return;
      }

      const scrollPercentage = (scrollTop / scrollHeight) * 100;

      const thresholds: ScrollDepthThreshold[] = [50, 70, 90];

      for (const threshold of thresholds) {
        if (scrollPercentage >= threshold && !trackedDepths.current.has(threshold)) {
          trackedDepths.current.add(threshold);
          onScrollDepthRef.current(pageNameRef.current, threshold);
        }
      }
    };

    // Delay to let DOM render
    const initTimeout = setTimeout(() => {
      // Add scroll event listener to document.body
      document.body.addEventListener('scroll', handleScroll, { passive: true });
      
      // Initial check
      handleScroll();
    }, 100);

    // Use ResizeObserver to detect when page content changes size
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    resizeObserver.observe(document.body);

    return () => {
      clearTimeout(initTimeout);
      document.body.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [pageName]);
}
