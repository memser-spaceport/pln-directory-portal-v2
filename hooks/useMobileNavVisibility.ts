import { useEffect } from 'react';

const className = 'mobile-nav-hidden';

export function useMobileNavVisibility(active: boolean) {
  useEffect(() => {
    if (active) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }

    return () => {
      document.body.classList.remove(className);
    };
  }, [active]);
}
