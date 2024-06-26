import { useEffect, useState } from 'react';
import { VerifyEmailModal } from './verify-email-modal';
import { triggerLoader } from '@/utils/common.utils';

function AuthInvalidUser() {
  const [isOpen, setIsModalOpen] = useState(false);

  const [content, setContent] = useState({
    title: 'Email Verification Failed',
    errorMessage: 'Your email is either invalid or not available in our directory. Please try again with valid email.',
    description: '',
  });

  const handleModalClose = () => {
    triggerLoader(false);
    setIsModalOpen(false);
    // setTimeout(() => {
    //   setTitle('Email Verification Failed');
    //   setDescription('');
    // }, 500);
  };

  useEffect(() => {
    function handleInvalidEmail(e: CustomEvent) {
      if (e?.detail) {
        if (e.detail === 'linked_to_another_user') {
          setContent({
            title: 'Email Verification',
            errorMessage: 'Email already used. Connect social account for login',
            description:
              'The email you provided is already used or linked to another account. If this is your email id, then login with the email id and connect this social account in profile settings page. After that you can use any of your linked accounts for subsequent logins.',
          });
        } else if (e.detail === 'unexpected_error') {
          setContent({ title: 'Something went wrong', errorMessage: 'We are unable to authenticate you at the moment due to technical issues. Please try again later', description: '' });
        } else if (e.detail === 'email-changed') {
          setContent({ title: 'Email Changed recently', errorMessage: 'Your email in our directory has been changed recently. Please login with your updated email id.', description: '' });
        }
      }

      setIsModalOpen(true);
    }
    document.addEventListener('auth-invalid-email', handleInvalidEmail as EventListener);
    return function () {
      document.removeEventListener('auth-invalid-email', handleInvalidEmail as EventListener);
    };
  }, []);

  return <>{isOpen && <VerifyEmailModal content={content} handleModalClose={handleModalClose} />}</>;
}

export default AuthInvalidUser;
