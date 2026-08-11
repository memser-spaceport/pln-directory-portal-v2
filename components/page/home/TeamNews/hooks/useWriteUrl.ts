import { useCallback } from 'react';
import isEmpty from 'lodash/isEmpty';
import { usePathname } from 'next/navigation';

export function useWriteUrl() {
  const pathname = usePathname();

  const writeUrl = useCallback(
    (key: string, value?: string | null | undefined) => {
      const params = new URLSearchParams(window.location.search);

      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      const qs = params.toString();
      window.history.replaceState(null, '', `${pathname || '/home'}${qs ? `?${qs}` : ''}`);
    },
    [pathname],
  );

  return writeUrl;
}
