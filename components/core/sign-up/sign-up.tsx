'use client';

import React, { useState } from 'react';
import SignUpHeader from './sign-up-header';
import SignUpForm from './sign-up-form';
import SignUpSuccess from './sign-up-success';

/**
 * SignUp component renders the sign-up form and success message.
 *
 * @param {Object} props - The component props.
 * @param {any} props.skillsInfo - Information about the skills to be passed to the SignUpForm component.
 * 
 * @returns {JSX.Element} The rendered SignUp component.
 *
 * The component maintains an internal state `isSuccess` to determine whether to show the sign-up form or the success message.
 * 
 * @example
 * <SignUp skillsInfo={skillsData} />
 */
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
