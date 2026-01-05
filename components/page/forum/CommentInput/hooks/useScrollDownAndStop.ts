import { useEffect, useRef, useState } from 'react';

// Custom hook to detect when scrolling down and stops
export const useScrollDownAndStop = (delay: number = 150) => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof document === 'undefined') {
      return;
    }

    const handleScroll = () => {
      const currentScrollY = document.body.scrollTop;
      const isGoingDown = currentScrollY > lastScrollY.current;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (isGoingDown) {
        // Scrolling down - set state and timeout
        setIsScrollingDown(true);
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrollingDown(false);
        }, delay);
      } else {
        // Scrolling up - immediately show
        setIsScrollingDown(false);
      }

      lastScrollY.current = currentScrollY;
    };

    document.body.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.body.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [delay]);

  return isScrollingDown;
};
