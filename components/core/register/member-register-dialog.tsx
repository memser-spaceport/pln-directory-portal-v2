'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import RegisterForm from './register-form';
import RegisterInfo from './register-info';
import StepsIndicatorDesktop from './steps-indicator-desktop';
import StepsIndicatorMobile from './steps-indicator-mobile';

function MemberRegisterDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const onCloseRegister = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  useEffect(() => {
    function dialogHandler(e) {
      console.log('on handler', e)
      if (dialogRef.current) {
        console.log('on dialog')
        dialogRef.current.showModal()
      }
    }
    document.addEventListener('open-member-register-dialog', dialogHandler);
    return function () {
      document.removeEventListener('open-member-register-dialog', dialogHandler);
    };
  }, []);

  return (
    <>
      <dialog ref={dialogRef} className="register">
        <div className="register__cn">
          <StepsIndicatorMobile />
          <aside className="register__cn__desktopinfo">
            <RegisterInfo />
            <StepsIndicatorDesktop />
          </aside>
          <section className="register__cn__content">
            <RegisterForm onCloseForm={onCloseRegister} />
          </section>
        </div>
        <div onClick={onCloseRegister} className="register__close">
          <Image width="20" height="20" alt="register popup close" src="/icons/close.svg" />
        </div>
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
            overflow-y: scroll;
          }
          .register__close {
            display: none;
          }
          .register__cn__desktopinfo {
            width: 100%;
            height: fit-content;

            background-image: linear-gradient(rgba(30, 58, 138, 1), rgba(29, 78, 216, 1));
          }
          .register__cn__desktopinfo__steps {
            padding: 24px 0;
          }

          .register__cn__content {
            height: 100%;

            flex: 1;
          }
          @media (min-width: 1200px) {
            .register__cn {
              flex-direction: row;
              overflow-y: hidden;
            }
            .register__cn__desktopinfo {
              width: 300px;
            }
            .register__cn__desktopinfo {
              height: 100%;
            }
            .register__cn__content {
              overflow-y: auto;
            }
            .register__close {
              display: block;
              cursor: pointer;
              position: absolute;
              top: 16px;
              right: 16px;
            }
          }
        `}
      </style>
    </>
  );
}

export default MemberRegisterDialog;
