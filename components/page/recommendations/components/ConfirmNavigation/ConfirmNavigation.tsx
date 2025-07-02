'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ConfirmNavigation({ isFormDirty }: { isFormDirty: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.tagName === 'A' && isFormDirty) {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href && confirm('Unsaved changes. Continue?')) {
          router.push(href);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isFormDirty, router]);

  return null;
}
