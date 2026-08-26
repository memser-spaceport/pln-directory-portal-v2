'use client';

import { ModalBase } from '@/components/common/ModalBase';
import { WarningCircleIcon } from '@/components/icons';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { useLoginRedirect } from '@/components/core/login/utils';
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
  const analytics = useAuthAnalytics();
  const goToLogin = useLoginRedirect();

  useEffect(() => {
    if (open) {
      analytics.onSessionExpiredModalShown();
    }
  }, [open, analytics]);

  const handleLogin = () => {
    // Encoding is left to the helper's URLSearchParams — encoding here too would
    // double-escape the value.
    const returnTo = window.location.pathname.slice(1).replaceAll('/', '-');
    onLogin();
    // replace, not push — Back must not restore the expired-session modal.
    goToLogin({ returnTo: '/members', params: { returnTo }, replace: true });
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
