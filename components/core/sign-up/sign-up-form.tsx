'use client';

import { useRef, useState } from 'react';
import SignUpActions from './sign-up-actions';
import SignUpInputs from './sign-up-inputs';
import { triggerLoader } from '@/utils/common.utils';
import { getRecaptchaToken } from '@/services/google-recaptcha.service';
import { toast } from 'react-toastify';
import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';
import { signUpFormAction } from '@/app/actions/sign-up.actions';

/**
 * SignUpForm component handles the user sign-up process.
 *
 * @param {Object} props - The component props.
 * @param {any} props.skillsInfo - Information about the user's skills.
 * @param {Function} props.setSuccessFlag - Function to set the success flag upon form submission.
 *
 * @returns {JSX.Element} The rendered SignUpForm component.
 *
 * @component
 *
 * @example
 * return (
 *   <SignUpForm skillsInfo={skillsInfo} setSuccessFlag={setSuccessFlag} />
 * )
 *
 * @remarks
 * This component uses Google reCAPTCHA for validation and records analytics events
 * during the sign-up process. It also handles form submission and displays any errors
 * that occur during the process.
 */
const SignUpForm = ({ skillsInfo, setSuccessFlag }: any) => {
  const [errors, setErrors] = useState({});

  const formRef = useRef(null);
  const analytics = useSignUpAnalytics();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    analytics.recordSignUpSave('submit-clicked');
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      triggerLoader(true);
      const reCAPTCHAToken = await getRecaptchaToken();

      // Validating reCAPTCHAToken
      if (reCAPTCHAToken.error || !reCAPTCHAToken.token) {
        toast.error('Google reCAPTCHA validation failed. Please try again.');
        analytics.recordSignUpSave('submit-clicked-captcha-failed', Object.fromEntries(formData.entries()));
        triggerLoader(false);
        return;
      }

      // Adding sign-up source to form data
      if (document?.referrer) {
        formData.append('signUpSource', document?.referrer);
      }

      analytics.recordSignUpSave('submit-clicked', Object.fromEntries(formData.entries()));

      // Submitting form data (Implemented actions to evaluate and submit the request)
      const result = await signUpFormAction(formData,reCAPTCHAToken.token);
      
      if (result?.success) {
        analytics.recordSignUpSave('submit-clicked-success', Object.fromEntries(formData.entries()));
        setSuccessFlag(true);
      } else {
        if(result?.errors){
          analytics.recordSignUpSave('submit-clicked-fail', result?.errors);
          setErrors(result?.errors);
        }else{
          if(result?.message){
            toast.error(result?.message);
          }else{
            toast.error('Something went wrong. Please try again.');
          }
        }
      }
    } catch (error) {
      analytics.recordSignUpSave('submit-clicked-fail', error);
      console.error(error);
    } finally {
      triggerLoader(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} ref={formRef} noValidate className="signup__form__cn">
        <div className="signup__form__cn__inputs">
          <SignUpInputs skillsInfo={skillsInfo} errors={errors} />
        </div>
        <div className="signup__form__cn__actions">
          <SignUpActions />
        </div>
      </form>
      <style jsx>{`
        .signup__form__cn {
          width: 100%;
        }
        .signup__form__cn__inputs {
          display: flex;
          padding: 26px 44px;
          width: 100%;
          flex-direction: column;
        }
      `}</style>
    </>
  );
};

export default SignUpForm;
