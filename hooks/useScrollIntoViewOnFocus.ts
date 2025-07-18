import { useEffect, useRef } from 'react';

type Options = {
  id?: string;
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  mobileOnly?: boolean; // ✅ new option
};

export function useScrollIntoViewOnFocus<T extends HTMLElement>({ id, behavior = 'smooth', block = 'center', mobileOnly = true }: Options = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element: T | null = id ? (document.getElementById(id) as T | null) : ref.current;

    if (!element) return;

    const handleFocus = () => {
      const isMobile = window.innerWidth < 1024;

      if (!mobileOnly || isMobile) {
        setTimeout(() => {
          element.scrollIntoView({ behavior, block });
        }, 100);
      }
    };

    element.addEventListener('focus', handleFocus);

    return () => {
      element.removeEventListener('focus', handleFocus);
    };
  }, [id, behavior, block, mobileOnly]);

  return ref;
}
