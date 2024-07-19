'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import StepsIndicatorMobile from '../../core/register/steps-indicator-mobile';
import StepsIndicatorDesktop from '../../core/register/steps-indicator-desktop';
import TeamRegisterInfo from './team-register-info';
import TeamRegisterForm from './team-register-form';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import { EVENTS } from '@/utils/constants';

function TeamRegisterDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const steps = ['basic', 'project details', 'social', 'success'];
  const [showForm, setFormStatus] = useState(false);

  const onDialogClose = () => {
    document.dispatchEvent(new CustomEvent('reset-team-register-form'));
  };

  const onCloseRegister = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
      setFormStatus(false)
    }
  };

  useEffect(() => {
    function dialogHandler(e: CustomEvent) {
      if (dialogRef.current) {
        dialogRef.current.showModal();
        setFormStatus(true)
      }
    }
    document.addEventListener(EVENTS.OPEN_TEAM_REGISTER_DIALOG, dialogHandler as EventListener);
    return function () {
      document.removeEventListener(EVENTS.OPEN_TEAM_REGISTER_DIALOG, dialogHandler as EventListener);
    };
  }, []);

  return (
    <>
      <dialog onClose={onDialogClose} ref={dialogRef} className="teamReg">
        {showForm && <>
          <div className="teamReg__cn">
          <div className="teamReg__cn__mobile">
            <StepsIndicatorMobile steps={steps} />
          </div>
          <aside className="teamReg__cn__desktopinfo">
            <TeamRegisterInfo />
            <StepsIndicatorDesktop skip={['success']} steps={steps} />
          </aside>
          <section className="teamReg__cn__content">
            <RegsiterFormLoader/>
            <TeamRegisterForm onCloseForm={onCloseRegister} />
          </section>
        </div>
        <div onClick={onCloseRegister} className="teamReg__close">
          <Image width="20" height="20" alt="close" src="/icons/close.svg" />
        </div>
        </>}
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
          position: relative;
        }

        @media (min-width: 1024px) {
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
            // overflow-y: auto;
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
