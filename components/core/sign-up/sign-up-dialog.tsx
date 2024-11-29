'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@/utils/constants';
import SignUpHeader from './sign-up-header';
import SignUpForm from './sign-up-form';
import JoinMemberActions from './sign-up-actions';

function JoinMemberDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showForm, setFormStatus] = useState(false);

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
    document.addEventListener(EVENTS.OPEN_JOIN_MEMBER_DIALOG, dialogHandler);
    return function () {
      document.removeEventListener(EVENTS.OPEN_JOIN_MEMBER_DIALOG, dialogHandler);
    };
  }, []);

  return (
    <>
      <dialog onClose={onDialogClose} ref={dialogRef} className="join-member">
        {showForm && (
          <>
            <div className="join-member__cn">
              <div className='join-member__cn__header'>
                <SignUpHeader />
              </div>
              <div>
                <SignUpForm/>
              </div>
            </div>
            <div onClick={onCloseRegister} className="join-member__close">
              <Image width="20" height="20" alt="register popup close" src="/icons/close.svg" />
            </div>{' '}
          </>
        )}
      </dialog>
      <style jsx>
        {`
          .join-member {
            background: white;
            border-radius: 8px;
            border: none;
            // height: 50svh;
            max-height: 1000px;
            width: 656px;
            margin: auto;
          }
          .join-member__cn {
            position: relative;
            display: flex;
            width: 100%;
            height: 100%;
            flex-direction: column;
            overflow: hidden;
          }

          .join-member__cn__header{
            height: 110px;
            width: 100%;
          }
          .join-member__close {
            display: none;
          }
          

          .join-member__cn__content {
            height: 100%;
            flex: 1;
            overflow: hidden;
          }
          @media (min-width: 1024px) {
            
            .join-member__close {
              display: block;
              cursor: pointer;
              position: absolute;
              top: 16px;
              right: 16px;
            }
            .join-member__cn__desktop {
              display: block;
              width: 300px;
              height: 100%;
            }

            .join-member__cn__content {
              overflow-y: auto;
            }
            .join-member__cn__desktop__info {
              padding: 24px 22px;
              display: flex;
              flex-direction: column;
              gap: 20px;
            }
            .join-member__cn__desktop__info__title {
              font-weight: 700;
              font-size: 24px;
              color: white;
              line-height: 24px;
            }
            .join-member__cn__desktop__info__desc {
              font-size: 14px;
              font-weight: 400;
              color: white;
              opacity: 0.8;
            }
            .join-member__cn__desktop__info__sep {
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

export default JoinMemberDialog;
