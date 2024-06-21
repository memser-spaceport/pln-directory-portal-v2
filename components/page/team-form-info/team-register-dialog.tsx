'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import StepsIndicatorMobile from '../../core/register/steps-indicator-mobile';
import StepsIndicatorDesktop from '../../core/register/steps-indicator-desktop';
import TeamRegisterInfo from './team-register-info';
import TeamRegisterForm from './team-register-form';

function TeamRegisterDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const steps = ['basic', 'project details', 'social'];
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onCloseRegister = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  useEffect(() => {
    function dialogHandler(e: CustomEvent) {
      if (dialogRef.current) {
        dialogRef.current.showModal();
      }
    }
    document.addEventListener('open-team-register-dialog', dialogHandler as EventListener);
    return function () {
      document.removeEventListener('open-team-register-dialog', dialogHandler as EventListener);
    };
  }, []);

  return (
    <>
      <dialog ref={dialogRef} className="teamReg">
        <div className="teamReg__cn">
          <div className="teamReg__cn__mobile">
            <StepsIndicatorMobile steps={steps} />
          </div>
          <aside className="teamReg__cn__desktopinfo">
            <TeamRegisterInfo />
            <StepsIndicatorDesktop steps={steps} />
          </aside>
          <section className="teamReg__cn__content">
            {/*  {currentStep === 'basic' && (
              <div className="register__cn__bannermobile">
                <RegisterInfo />
              </div>
            )} */}
            <TeamRegisterForm onCloseForm={onCloseRegister} />
            {isSubmitted && (
              <div className="teamReg__cn__content__submit">
                <p className="teamReg__cn__content__submit__ttl">Thank You for Submitting</p>
                <p className="teamReg__cn__content__submit__desc">Our team will review your request shortly and get back</p>
                <button className="teamReg__cn__content__submit__cls">Close</button>
              </div>
            )}
          </section>
        </div>
        <div onClick={onCloseRegister} className="teamReg__close">
          <Image width="20" height="20" alt="close" src="/icons/close.svg" />
        </div>
      </dialog>
      <style jsx>{`
        .teamReg {
          background: white;
          border-radius: 8px;
          border: none;
          height: 90svh;
          max-height: 1000px;
          width: 956px;
          margin: auto;
        }
        .teamReg__close {
          display: none;
        }
        .teamReg__cn {
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          flex-direction: column;
          overflow: hidden;
        }
        .teamReg__cn__mobile {
          display: flex;
        }
        .teamReg__cn__desktopinfo {
          width: 100%;
          height: fit-content;
          display: none;
          background-image: linear-gradient(rgba(30, 58, 138, 1), rgba(29, 78, 216, 1));
        }
        .teamReg__cn__bannermobile {
          display: block;
          height: 109px;
          overflow: hidden;
          background-image: linear-gradient(rgba(30, 58, 138, 1), rgba(29, 78, 216, 1));
        }
        .teamReg__cn__desktopinfo__steps {
          padding: 24px 0;
        }
        .teamReg__cn__content {
          height: 100%;
          flex: 1;
          overflow: hidden;
        }

        .teamReg__cn__content__submit {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          margin: auto;
        }

        .teamReg__cn__content__submit__ttl {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          color: #0f172a;
        }

        .teamReg__cn__content__submit__desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #0f172a;
          margin: 8px 0px 0px 0px;
        }

        .teamReg__cn__content__submit__cls {
          width: 86px;
          height: 40px;
          padding: 10px 24px 10px 24px;
          gap: 8px;
          border-radius: 8px;
          border: 1px 0px 0px 0px;
          background: #156ff7;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #ffffff;
          margin: 18px 0px 0px 0px;
        }

        @media (min-width: 1200px) {
          .teamReg__cn {
            flex-direction: row;
            overflow-y: hidden;
          }
          .teamReg__cn__mobile {
            display: none;
          }
          .teamReg__cn__bannermobile {
            display: none;
          }
          .teamReg__cn__desktopinfo {
            display: block;
            width: 300px;
          }
          .teamReg__cn__desktopinfo {
            height: 100%;
          }
          .teamReg__cn__content {
            overflow-y: auto;
          }
          .teamReg__close {
            display: block;
            cursor: pointer;
            position: absolute;
            top: 16px;
            right: 16px;
          }
        }
      `}</style>
    </>
  );
}

export default TeamRegisterDialog;
