import { useCallback, useEffect, useRef, useState } from 'react';
import { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';

const AUTO_SCROLL_INTERVAL = 10000;

export const useCarousel = (options: EmblaOptionsType & { isPaused?: boolean }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    if (!emblaApi || options.isPaused) return;

    autoScrollRef.current = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, AUTO_SCROLL_INTERVAL);
  }, [emblaApi, options.isPaused, stopAutoScroll]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      startAutoScroll(); // Reset the timer when manually navigating
    }
  }, [emblaApi, startAutoScroll]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      startAutoScroll(); // Reset the timer when manually navigating
    }
  }, [emblaApi, startAutoScroll]);

  useEffect(() => {
    if (!emblaApi) return;

    const updateActiveIndex = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', updateActiveIndex);

    // Pause auto-scroll when user starts interacting and resume when it settles
    // This handles both clicking navigation buttons (if they use the underlying embla actions) 
    // and manual dragging/swiping
    emblaApi.on('pointerDown', stopAutoScroll);
    emblaApi.on('settle', startAutoScroll);

    startAutoScroll();

    return () => {
      stopAutoScroll();
      emblaApi.off('select', updateActiveIndex);
      emblaApi.off('pointerDown', stopAutoScroll);
      emblaApi.off('settle', startAutoScroll);
    };
  }, [emblaApi, startAutoScroll, stopAutoScroll]);

  return { emblaRef, activeIndex, scrollPrev, scrollNext, setActiveIndex, emblaApi };
};
