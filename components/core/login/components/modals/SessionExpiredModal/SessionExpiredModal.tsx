'use client';

import { useRouter } from 'next/navigation';
import { ModalBase } from '@/components/common/ModalBase';
import { WarningCircleIcon } from '@/components/icons';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { useEffect } from 'react';

interface SessionExpiredModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

/**
 * SessionExpiredModal - Shows when user session expires
 *
 * Displays a modal informing the user that their session has expired
 * and they need to log in again. Preserves the current URL for redirect after login.
 */
export function SessionExpiredModal({ open, onClose, onLogin }: SessionExpiredModalProps) {
  const router = useRouter();
  const analytics = useAuthAnalytics();

  useEffect(() => {
    if (open) {
      analytics.onSessionExpiredModalShown();
    }
  }, [open, analytics]);

  const handleLogin = () => {
    const returnTo = encodeURIComponent(window.location.pathname.slice(1).replaceAll('/', '-'));
    onLogin();
    router.replace(`${window.location.origin}/members?returnTo=${returnTo}#login`);
  };

  return (
    <ModalBase
      title="Session Expired"
      titleIcon={<WarningCircleIcon />}
      description="Your session has expired. Please sign in again to continue."
      cancel={{
        onClick: onClose,
      }}
      submit={{
        label: 'Sign In',
        onClick: handleLogin,
      }}
      open={open}
    />
  );
}
