'use client';

import React, { useState } from 'react';
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
            <header className="sign-up-header">
              <div className="sign-up-header__title">Join the Protocol Labs Network</div>
              <p className="sign-up-header__subtitle">Tell us about yourself</p>
            </header>
          </div>
          <div className="signup__cn__form">
            <SignUpForm skillsInfo={skillsInfo} setSuccessFlag={setSuccessFlag} />
          </div>
        </>
      ) : (
        <SignUpSuccess />
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

        .sign-up-header {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: 12px;
          color: #ffffff;
          background-image: url('/images/join/header-bg-mbl.svg');
          background-size: cover;
          background-position: right;
          height: 100%;
          width: 100%;
          gap: 8px;
          //   background-color: linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 100%);
        }
        @media (min-width: 425px) {
          .sign-up-header {
            padding: 24px;
            background-image: url('/images/join/header-bg.png');
          }
        }
        .sign-up-header__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 29.05px;
          text-align: left;
        }
        .sign-up-header__subtitle {
          font-size: 14px;
          font-weight: 400;
          line-height: 24px;
        }
      `}</style>
    </>
  );
};

export default SignUp;
