import { useEffect, useRef, useState } from 'react';
import { VerifyEmailModal } from './verify-email-modal';
import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';

function AuthInvalidUser() {

  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const [content, setContent] = useState({
    title: 'Email Verification',
    errorMessage: 'Email not available',
    description: 'Your email is either invalid or not available in our directory. Please try again with valid email.',
  });

  const handleModalClose = () => {
    triggerLoader(false);
    if (dialogRef.current) {
      dialogRef.current.close();
    }
    setTimeout(() => {
      setContent({
        title: 'Email Verification',
        errorMessage: 'Email not available',
        description: 'Your email is either invalid or not available in our directory. Please try again with valid email.',
      });
    }, 500);
  };

  const handleModalOpen = () => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  };

  useEffect(() => {
    function handleInvalidEmail(e: CustomEvent) {
      if (e?.detail) {
        router.refresh();
        if (e.detail === 'linked_to_another_user') {
          setContent({
            title: 'Email Verification',
            errorMessage: 'Email already used. Connect social account for login',
            description:
              'The email you provided is already used or linked to another account. If this is your email id, then login with the email id and connect this social account in profile settings page. After that you can use any of your linked accounts for subsequent logins.',
          });
        } else if (e.detail === 'unexpected_error') {
          setContent({ title: 'Something went wrong', errorMessage: 'We are unable to authenticate you at the moment due to technical issues. Please try again later', description: '' });
        }
        // } else if (e.detail === 'email-changed') {
        //   setContent({ title: 'Email Changed recently', errorMessage: 'Your email in our directory has been changed recently. Please login with your updated email id.', description: '' });
        // }
      }
      handleModalOpen();
    }
    document.addEventListener('auth-invalid-email', handleInvalidEmail as EventListener);
    return function () {
      document.removeEventListener('auth-invalid-email', handleInvalidEmail as EventListener);
    };
  }, []);

  return <VerifyEmailModal dialogRef={dialogRef} content={content} handleModalClose={handleModalClose} />;
}

export default AuthInvalidUser;
