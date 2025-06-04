'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  isLoggedIn: boolean;
}

export const AuthTrigger = ({ isLoggedIn }: Props) => {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  }, [isLoggedIn, router]);

  return null;
};
