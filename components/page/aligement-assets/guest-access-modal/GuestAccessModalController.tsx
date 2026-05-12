'use client';

import { useState } from 'react';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { GuestAccessModal } from './GuestAccessModal';

const GUEST_MODAL_SESSION_KEY = 'plaa_guest_modal_shown';

/**
 * Loaded only on the client (ssr: false) so the auth/session check runs
 * synchronously during the first client render — no post-paint flash.
 */
export function GuestAccessModalController() {
  const [isOpen, setIsOpen] = useState(() => {
    const { authToken } = getCookiesFromClient();
    const alreadyShown = sessionStorage.getItem(GUEST_MODAL_SESSION_KEY);
    const shouldShow = !authToken && !alreadyShown;
    if (shouldShow) {
      sessionStorage.setItem(GUEST_MODAL_SESSION_KEY, 'true');
    }
    return shouldShow;
  });

  return <GuestAccessModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
