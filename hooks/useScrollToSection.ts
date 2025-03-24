import { useEffect, RefObject } from 'react';

/**
 * Custom hook for handling section-based URL hash navigation
 * @param ref - Reference to the DOM element to scroll to
 * @param sectionId - The ID of the section (without the # symbol)
 * @param offset - The offset from the top in pixels (default: 80px)
 */
export function useScrollToSection(
  ref: RefObject<HTMLElement>,
  sectionId: string,
  offset: number = 80
) {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      
      if (hash === sectionId && ref.current) {
        ref.current.scrollIntoView({ behavior: "smooth" });
      }
    };
    
    if (window.location.hash === `#${sectionId}`) {
      setTimeout(() => {
        if (ref.current) {
          ref.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    }
    
    window.addEventListener("hashchange", handleHashChange);
    
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [ref, sectionId]);

  return {
    scrollMarginTop: `${offset}px`
  };
} 