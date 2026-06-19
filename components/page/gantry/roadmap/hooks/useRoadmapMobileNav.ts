import { useEffect, useMemo, useRef, useState } from 'react';
import type { RoadmapColumnStage } from '../RoadmapFilters';

export function useRoadmapMobileNav(orderedVisibleColumns: RoadmapColumnStage[], isNarrow: boolean) {
  const [activeColumn, setActiveColumn] = useState<RoadmapColumnStage | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<RoadmapColumnStage, HTMLDivElement>>(new Map());
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  // Set to true when activeColumn is updated by the IntersectionObserver (user swipe).
  // Prevents the effectiveActiveColumn useEffect from fighting the swipe with an instant snap.
  const isSwipeUpdateRef = useRef(false);

  const effectiveActiveColumn = useMemo(() => {
    if (orderedVisibleColumns.length === 0) return null;
    if (activeColumn && orderedVisibleColumns.includes(activeColumn)) return activeColumn;
    return orderedVisibleColumns[0];
  }, [activeColumn, orderedVisibleColumns]);

  // Snap to the correct column when a filter removes the currently active one.
  // Must NOT fire during user swipes (that would fight the scroll animation).
  const prevEffectiveColumnRef = useRef<RoadmapColumnStage | null>(null);
  useEffect(() => {
    if (effectiveActiveColumn !== prevEffectiveColumnRef.current && !isProgrammaticScrollRef.current) {
      if (isSwipeUpdateRef.current) {
        isSwipeUpdateRef.current = false;
      } else if (effectiveActiveColumn && prevEffectiveColumnRef.current !== null) {
        const container = scrollContainerRef.current;
        const colEl = columnRefs.current.get(effectiveActiveColumn);
        if (container && colEl) {
          container.scrollTo({ left: colEl.offsetLeft, behavior: 'instant' as ScrollBehavior });
        }
      }
    }
    prevEffectiveColumnRef.current = effectiveActiveColumn;
  }, [effectiveActiveColumn]);

  // Swipe → tab sync via IntersectionObserver.
  useEffect(() => {
    if (!isNarrow || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        const visible = entries.find((e) => e.isIntersecting && e.intersectionRatio >= 0.5);
        if (visible) {
          const stage = visible.target.getAttribute('data-stage') as RoadmapColumnStage;
          if (stage) {
            isSwipeUpdateRef.current = true;
            setActiveColumn(stage);
          }
        }
      },
      { threshold: 0.5, root: container },
    );
    columnRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isNarrow, orderedVisibleColumns]);

  // Scroll the active tab into view when driven by swipe.
  useEffect(() => {
    if (!isNarrow || !effectiveActiveColumn || !tabsWrapperRef.current) return;
    const tabIndex = orderedVisibleColumns.indexOf(effectiveActiveColumn);
    const tabsRoot = tabsWrapperRef.current.firstElementChild as HTMLElement | null;
    if (!tabsRoot || tabIndex < 0) return;
    const tabEl = tabsRoot.querySelectorAll<HTMLElement>('[role="tab"]')[tabIndex];
    if (!tabEl) return;
    const tabRect = tabEl.getBoundingClientRect();
    const containerRect = tabsRoot.getBoundingClientRect();
    const tabCenterInScroll = tabRect.left - containerRect.left + tabsRoot.scrollLeft + tabEl.offsetWidth / 2;
    tabsRoot.scrollTo({ left: Math.max(0, tabCenterInScroll - containerRect.width / 2), behavior: 'smooth' });
  }, [effectiveActiveColumn, isNarrow, orderedVisibleColumns]);

  const handleTabChange = (stage: RoadmapColumnStage) => {
    setActiveColumn(stage);
    isProgrammaticScrollRef.current = true;
    const container = scrollContainerRef.current;
    const colEl = columnRefs.current.get(stage);
    if (container && colEl) {
      container.scrollTo({ left: colEl.offsetLeft, behavior: 'smooth' });
    }
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 500);
  };

  return { effectiveActiveColumn, scrollContainerRef, columnRefs, tabsWrapperRef, handleTabChange };
}
