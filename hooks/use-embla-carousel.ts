import { useCallback, useEffect, useRef, useState } from "react";
import { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from "embla-carousel-react";

const AUTO_SCROLL_INTERVAL = 10000;

export const useCarousel = (options: EmblaOptionsType) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      setActiveIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      setActiveIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const updateActiveIndex = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (emblaApi.canScrollNext()) {
          emblaApi.scrollNext();
        } else {
          emblaApi.scrollTo(0);
        }
        updateActiveIndex();
      }, AUTO_SCROLL_INTERVAL);
    };

    const stopAutoScroll = () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };

    startAutoScroll();
    emblaApi.on("select", updateActiveIndex);

    return () => {
      stopAutoScroll();
      emblaApi.off("select", updateActiveIndex);
    };
  }, [emblaApi]);

  return { emblaRef, activeIndex, scrollPrev, scrollNext, setActiveIndex, emblaApi };
};
