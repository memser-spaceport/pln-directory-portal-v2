'use client';
import { useEffect, useRef, useState } from 'react';
import JoinMemberActions from './sign-up-actions';
import SignUpInputs from './sign-up-inputs';
import { signUpFormAction } from '@/app/actions/sign-up.actions';
import { triggerLoader } from '@/utils/common.utils';

const SignUpForm = ({skillsInfo}:any) => {

  const [errors, setErrors] = useState({});
  
  const formRef = useRef(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      if (document?.referrer) {
        formData.append('signUpSource', document?.referrer);
      }
      triggerLoader(true);
      const result = await signUpFormAction(formData);
      if(result?.success){
        alert('Form submitted successfully!');
      }else{
        setErrors(result?.errors);
      }
    } catch (error) {
      console.log(error);
    }finally{
      triggerLoader(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} ref={formRef} noValidate className="signup__form__cn">
        <div className="signup__form__cn__inputs">
          <SignUpInputs skillsInfo={skillsInfo} errors={errors}/>
        </div>
        <div className="signup__form__cn__actions">
          <JoinMemberActions />
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
