'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import RegisterForm from '../../page/member-info/register-form';
import StepsIndicatorDesktop from './steps-indicator-desktop';
import StepsIndicatorMobile from './steps-indicator-mobile';
import { EVENTS } from '@/utils/constants';

function MemberRegisterDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showForm, setFormStatus] = useState(false);
  const steps = ['basic', 'skills', 'contributions', 'social', 'success'];

  const onDialogClose = () => {
    document.dispatchEvent(new CustomEvent('reset-member-register-form'));
  };
  const onCloseRegister = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
      setFormStatus(false)
    }
  };

  useEffect(() => {
    function dialogHandler(e: any) {
      if (dialogRef.current) {
        dialogRef.current.showModal();
        setFormStatus(true)
      }
    }
    document.addEventListener(EVENTS.OPEN_MEMBER_REGISTER_DIALOG, dialogHandler);
    return function () {
      document.removeEventListener(EVENTS.OPEN_MEMBER_REGISTER_DIALOG, dialogHandler);
    };
  }, []);

  return (
    <>
      <dialog onClose={onDialogClose} ref={dialogRef} className="register">
        {showForm && (
          <>
            <div className="register__cn">
              <div className="register__cn__mobile">
                <StepsIndicatorMobile skip={['success']} steps={steps} />
              </div>
              <aside className="register__cn__desktop">
                <div className="register__cn__desktop__info">
                  <h2 className="register__cn__desktop__info__title">Join the Protocol Labs</h2>
                  <p className="register__cn__desktop__info__desc">Tell us about yourself</p>
                  <div className="register__cn__desktop__info__sep"></div>
                </div>
                <StepsIndicatorDesktop skip={['success']} steps={steps} />
              </aside>
              <section className="register__cn__content">
                <RegisterForm onCloseForm={onCloseRegister} />
              </section>
            </div>
            <div onClick={onCloseRegister} className="register__close">
              <Image width="20" height="20" alt="register popup close" src="/icons/close.svg" />
            </div>{' '}
          </>
        )}
      </dialog>
      <style jsx>
        {`
          .register {
            background: white;
            border-radius: 8px;
            border: none;
            height: 90svh;
            max-height: 1000px;
            width: 956px;
            margin: auto;
          }
          .register__cn {
            position: relative;
            display: flex;
            width: 100%;
            height: 100%;
            flex-direction: column;
            overflow: hidden;
          }
          .register__cn__mobile {
            display: flex;
          }
          .register__close {
            display: none;
          }
          .register__cn__desktop {
            width: 100%;
            height: fit-content;
            display: none;
            background-image: linear-gradient(rgba(30, 58, 138, 1), rgba(29, 78, 216, 1));
          }

          .register__cn__content {
            height: 100%;
            flex: 1;
            overflow: hidden;
          }
          @media (min-width: 1024px) {
            .register__cn {
              flex-direction: row;
              overflow-y: hidden;
            }
            .register__close {
              display: block;
              cursor: pointer;
              position: absolute;
              top: 16px;
              right: 16px;
            }
            .register__cn__mobile {
              display: none;
            }
            .register__cn__desktop {
              display: block;
              width: 300px;
              height: 100%;
            }

            .register__cn__content {
              overflow-y: auto;
            }
            .register__cn__desktop__info {
              padding: 24px 22px;
              display: flex;
              flex-direction: column;
              gap: 20px;
            }
            .register__cn__desktop__info__title {
              font-weight: 700;
              font-size: 24px;
              color: white;
              line-height: 24px;
            }
            .register__cn__desktop__info__desc {
              font-size: 14px;
              font-weight: 400;
              color: white;
              opacity: 0.8;
            }
            .register__cn__desktop__info__sep {
              height: 1px;
              width: 100%;
              background: white;
              opacity: 0.2;
            }
          }
        `}
      </style>
    </>
  );
}

export default MemberRegisterDialog;
