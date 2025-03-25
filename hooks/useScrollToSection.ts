import { useEffect, RefObject, useState } from 'react';

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
  // Add state to track if section is in view
  const [isInView, setIsInView] = useState(false);

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
    
    // Create intersection observer to detect when section is visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If section is at least 40% visible
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
          setIsInView(true);
          
          // Update URL without causing a page refresh
          const currentHash = window.location.hash.substring(1);
          if (currentHash !== sectionId) {
            // Use history.replaceState to update URL without triggering navigation
            window.history.replaceState(
              null, 
              '', 
              window.location.pathname + (sectionId ? `#${sectionId}` : '')
            );
          }
        } else {
          setIsInView(false);
        }
      },
      {
        root: null, // viewport
        rootMargin: `-${offset}px 0px 0px 0px`,
        threshold: [0.4, 0.8] // trigger at 40% and 80% visibility
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, sectionId, offset]);

  return {
    scrollMarginTop: `${offset}px`,
    isInView
  };
} 