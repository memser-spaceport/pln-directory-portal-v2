'use client';

import { useEffect, useState } from 'react';

export default function ScrollObserver() {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
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

    const handleInitialHash = () => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        setTimeout(() => scrollToElement(id), 500);
      }
    };

    const handleHashChange = () => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        scrollToElement(id);
      }
    };

    window.addEventListener('load', handleInitialHash);
    window.addEventListener('hashchange', handleHashChange);

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling) return;

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const id = element.id;

            if (!element.hasAttribute('data-exclude-from-url')) {
              window.history.replaceState(null, '', `#${id}`);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const eventsContainer = document.getElementById('events-container');
    const sections = eventsContainer 
      ? eventsContainer.querySelectorAll('[id]')
      : document.querySelectorAll('[id]:not([data-exclude-from-url])');

    sections.forEach(section => observer.observe(section));

    return () => {
      observer.disconnect();
      window.removeEventListener('load', handleInitialHash);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isScrolling]);

  return null;
} 