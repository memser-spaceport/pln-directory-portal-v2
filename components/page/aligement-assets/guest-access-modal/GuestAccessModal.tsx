'use client';

import { useRouter } from 'next/navigation';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { AUTH_RETURN_HASH_KEY } from '@/components/core/login/utils/authReturnHash';

interface GuestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * GuestAccessModal - Shown once per session when a guest visits PLAA pages.
 * Prompts the user to sign in, explore as a guest, or sign up.
 */
export function GuestAccessModal({ isOpen, onClose }: GuestAccessModalProps) {
  const router = useRouter();

  const handleSignIn = () => {
    onClose();
    const returnHash = window.location.hash;
    if (returnHash && returnHash !== '#login') {
      sessionStorage.setItem(AUTH_RETURN_HASH_KEY, returnHash);
    }
    // Assign hash directly so hashchange fires; router.push alone can miss it when replacing an existing hash.
    window.location.hash = 'login';
  };

  const handleSignUp = () => {
    onClose();
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
    router.push(`/sign-up?returnTo=${returnTo}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnBackdropClick={false} closeOnEscape={false}>
      <div className="guest-access-modal">
        <div className="guest-access-modal__body">
          <h2 className="guest-access-modal__title">Guest Access</h2>
          <p className="guest-access-modal__text">
            You&apos;re exploring PLAA as a guest. Some PLAA pages contain participant-specific or round-level
            information and require a LabOS account to access.
          </p>
          <p className="guest-access-modal__text">
            Sign in to LabOS to view your PLAA information, or continue exploring public program information to learn
            more about how the program works.
          </p>
        </div>

        <div className="guest-access-modal__actions">
          <Button style="fill" variant="primary" size="l" onClick={handleSignIn} className="guest-access-modal__btn">
            Sign in
          </Button>
          <Button style="border" variant="primary" size="l" onClick={onClose} className="guest-access-modal__btn">
            Explore the Site
          </Button>
          <p className="guest-access-modal__signup-text">
            New to Protocol Labs? Join the network.{' '}
            <button className="guest-access-modal__signup-link" onClick={handleSignUp} type="button">
              Sign Up
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .guest-access-modal {
          background: #fff;
          border-radius: 16px;
          padding: 32px 28px 28px;
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .guest-access-modal__body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .guest-access-modal__title {
          font-size: 20px;
          font-weight: 600;
          line-height: 28px;
          letter-spacing: -0.3px;
          color: #0a0c11;
          margin: 0;
        }

        .guest-access-modal__text {
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          color: #455468;
          margin: 0;
        }

        .guest-access-modal__actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .guest-access-modal__btn {
          width: 100%;
          justify-content: center;
        }

        .guest-access-modal__signup-text {
          font-size: 13px;
          font-weight: 400;
          line-height: 20px;
          color: #455468;
          text-align: center;
          margin: 4px 0 0;
        }

        .guest-access-modal__signup-link {
          color: #1b4dff;
          font-weight: 500;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: 13px;
          text-decoration: underline;
        }

        .guest-access-modal__signup-link:hover {
          opacity: 0.8;
        }

        @media (max-width: 480px) {
          .guest-access-modal {
            padding: 24px 20px 20px;
            border-radius: 12px;
          }

          .guest-access-modal__title {
            font-size: 18px;
          }
        }
      `}</style>
    </Modal>
  );
}
