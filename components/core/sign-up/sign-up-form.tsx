'use client';
import { useEffect, useRef, useState } from 'react';
import JoinMemberFormLoader from './sign-up-loader';
import TextField from '@/components/form/text-field';
import CustomCheckbox from '@/components/form/custom-checkbox';
import JoinMemberActions from './sign-up-actions';
import SignUpInputs from './sign-up-inputs';
import { formatFormDataToApi } from '@/services/sign-up.service';

const SignUpForm = ({skillsInfo}:any) => {
  
  const formRef = useRef(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const data = Object.fromEntries(formData);
      
      const formattedObj = formatFormDataToApi(data);
      if(document?.referrer){
        formattedObj['signUpSource'] = document?.referrer;
      }
      console.log('formattedObj', formattedObj);

    }
  };

  return (
    <>
      <JoinMemberFormLoader />
      <form onSubmit={handleSubmit} ref={formRef} noValidate className="signup__form__cn">
        <div className="signup__form__cn__inputs">
          <SignUpInputs skillsInfo={skillsInfo}/>
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
