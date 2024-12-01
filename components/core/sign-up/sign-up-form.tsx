'use client';
import { useRef, useState } from 'react';
import SignUpActions from './sign-up-actions';
import SignUpInputs from './sign-up-inputs';
import { triggerLoader } from '@/utils/common.utils';
import { getRecaptchaToken } from '@/services/google-recaptcha.service';
import { toast } from 'react-toastify';
import { useSignUpAnalytics } from '@/analytics/sign-up.analytics';

const SignUpForm = ({ skillsInfo,setSuccessFlag }: any) => {
  const [errors, setErrors] = useState({});

  const formRef = useRef(null);
  const analytics = useSignUpAnalytics();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    analytics.recordSignUpSave('submit-clicked',);
    e.preventDefault();
     const formData = new FormData(e.target as HTMLFormElement);

    try {
      
      triggerLoader(true);
      const reCAPTCHAToken = await getRecaptchaToken();
      if (reCAPTCHAToken.error || !reCAPTCHAToken.token) {
        // analytics.onGetUpdatesSubmitError(email, "Captcha validation failed");
        toast.error('Google reCAPTCHA validation failed. Please try again.');
        analytics.recordSignUpSave('submit-clicked-captcha-failed',Object.fromEntries(formData.entries()));
        triggerLoader(false);
        return;
      }
      if (document?.referrer) {
        formData.append('signUpSource', document?.referrer);
        formData.append('recaptchaToken', reCAPTCHAToken.token);
      }

      setSuccessFlag(true);
      analytics.recordSignUpSave('submit-clicked',Object.fromEntries(formData.entries()));
      // const result = await signUpFormAction(formData);
      // if (result?.success) {
        // analytics.recordSignUpSave('submit-clicked-success',Object.fromEntries(formData.entries()));
      //   alert('Form submitted successfully!');
      // } else {
        // analytics.recordSignUpSave('submit-clicked-fail',result?.errors);
      //   setErrors(result?.errors);
      // }
    } catch (error) {
      console.log(error);
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
