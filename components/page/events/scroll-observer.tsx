'use client';

import { useEffect } from 'react';

export default function ScrollObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const id = element.id;
            
            // Skip elements with data-exclude-from-url attribute
            // or elements outside the events container
            if (!element.hasAttribute('data-exclude-from-url')) {
              window.history.replaceState(null, '', `#${id}`);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Only observe elements within the events container
    // Or you can use a more specific selector like '[id]:not([data-exclude-from-url])'
    const eventsContainer = document.getElementById('events-container');
    const sections = eventsContainer 
      ? eventsContainer.querySelectorAll('[id]')
      : document.querySelectorAll('[id]:not([data-exclude-from-url])');
    
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return null;
} 