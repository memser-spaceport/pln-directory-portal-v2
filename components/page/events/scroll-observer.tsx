'use client';

import { useEffect, useState } from 'react';

export default function ScrollObserver() {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    /**
     * Scrolls smoothly to the element with the given id, offsetting for navbar.
     * @param id - The id of the element to scroll to.
     */
    const scrollToElement = (id: string) => {
      const element = document.getElementById(id);
      if (!element) return;

      setIsScrolling(true);

      const navbarHeight = 80; // Adjust this value to match your navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    };

    /**
     * Handles initial hash on page load.
     */
    const handleInitialHash = () => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        setTimeout(() => scrollToElement(id), 500);
      }
    };

    /**
     * Handles hash changes (e.g., user clicks anchor link).
     */
    const handleHashChange = () => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        scrollToElement(id);
      }
    };

    window.addEventListener('load', handleInitialHash);
    window.addEventListener('hashchange', handleHashChange);

    // IntersectionObserver to update URL hash as sections come into view
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling) return;

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const id = element.id;

            // Only update hash if not excluded
            if (!element.hasAttribute('data-exclude-from-url')) {
              window.history.replaceState(null, '', `#${id}`);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all sections with an id, except those excluded
    const eventsContainer = document.getElementById('events-container');
    const sections = eventsContainer 
      ? eventsContainer.querySelectorAll('[id]')
      : document.querySelectorAll('[id]:not([data-exclude-from-url])');

    sections.forEach(section => observer.observe(section));

    // Cleanup listeners and observer on unmount
    return () => {
      observer.disconnect();
      window.removeEventListener('load', handleInitialHash);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isScrolling]);

  // This component does not render any DOM
  return null;
} 