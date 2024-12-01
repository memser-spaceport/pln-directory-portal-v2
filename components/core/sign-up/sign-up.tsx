'use client';

import React, { useState } from 'react';
import SignUpHeader from './sign-up-header';
import SignUpForm from './sign-up-form';
import SignUpSuccess from './sign-up-success';

const SignUp = ({ skillsInfo }: any) => {
  const [isSuccess, setSuccessFlag] = useState(false);

  return (
    <>
      {!isSuccess ? (
        <>
          <div className="signup__cn__header">
            <SignUpHeader />
          </div>
          <div className="signup__cn__form">
            <SignUpForm skillsInfo={skillsInfo} setSuccessFlag={setSuccessFlag}/>
          </div>
        </>
      ) : (
        <SignUpSuccess/>
      )}

      <style jsx>{`
        .signup__cn__header {
          height: 110px;
          width: 100%;
        }

        .signup__cn__form {
          display: flex;
          background-color: white;
        }
      `}</style>
    </>
  );
};

export default SignUp;
