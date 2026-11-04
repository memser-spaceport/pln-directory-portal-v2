'use client';

import { ModalBase } from '@/components/common/ModalBase';
import { Button } from '@/components/common/Button';
import { WarningCircleIcon } from '@/components/icons';

import authModal from '@/components/core/login/components/modals/AuthInvalidUser/AuthInvalidUser.module.scss';
import local from './HomeV2Prototype.module.scss';

/**
 * Production's AuthInvalidUser shell (components/core/login/components/modals/
 * AuthInvalidUser), email_not_found branch: same ModalBase, warning icon, 400px
 * root and the link-style footer button. What changes is the content.
 * Production says "Email Not Found … Double-check your email" and offers
 * Cancel / Sign up / Contact Support, which reads as an error to fix. Here it
 * says what happened and gives two ways forward: Sign up (primary), or Try another
 * email (the footer link, which in production would reopen Privy). Cancel is
 * dropped; the ✕ closes. Contact support stays reachable from the help menu.
 */
export function EmailNotFoundModal({
  open,
  email,
  onClose,
  onSignUp,
  onTryAnother,
}: {
  open: boolean;
  email: string;
  onClose: () => void;
  onSignUp: () => void;
  onTryAnother: () => void;
}) {
  return (
    <ModalBase
      className={authModal.root}
      open={open}
      onClose={onClose}
      title="This email isn't in the directory yet"
      titleIcon={<WarningCircleIcon />}
      description={
        <>
          No member profile uses <strong className={local.modalEmail}>{email}</strong>. If you&apos;re new, sign up and
          we&apos;ll set up your profile. If you&apos;re a member, try the email on your profile.
        </>
      }
      submit={{ label: 'Sign up', onClick: onSignUp }}
      footer={
        <div style={{ textAlign: 'center' }}>
          <Button style="link" onClick={onTryAnother}>
            Try another email
          </Button>
        </div>
      }
    />
  );
}
