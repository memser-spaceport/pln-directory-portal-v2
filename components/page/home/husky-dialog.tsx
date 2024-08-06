'use client';

import HuskyChat from '@/components/core/husky/husky-chat';
import { useEffect, useRef, useState } from 'react';

function HuskyDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const onDialogClose = () => {
    document.dispatchEvent(new CustomEvent('reset-member-hd-form'));
  };

  useEffect(() => {
    function dialogHandler(e: any) {
      if (dialogRef.current) {
        dialogRef.current.showModal();
      }
    }
    document.addEventListener('open-husky-dialog', dialogHandler);
    return function () {
      document.removeEventListener('open-husky-dialog', dialogHandler);
    };
  }, []);

  return (
    <>
      <dialog onClose={onDialogClose} ref={dialogRef} className="hd">
        <div className="hd__head">
          <img className="hd__head__logo" src="/images/husky-logo.png" />
          <img onClick={onDialogClose} className="hd__head__close" src="/icons/close.svg" />
        </div>
        <div className="hd__content">
          <HuskyChat />
        </div>
      </dialog>
      <style jsx>
        {`
          .hd {
            background: white;
            border-radius: 8px;
            border: none;
            height: calc(100svh - 48px);
            max-height: 1000px;
            width: calc(100vw - 48px);
            margin: auto;
            overflow: hidden;
          }
          .hd__head {
            width: 100%;
            height: 42px;
            border-bottom: 1px solid grey;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
          }
          .hd__head__logo {
            height: 24px;
          }
          .hd__head__close {
            cursor: pointer;
          }
          .hd__content {
            width: 100%;
            height: 100%;
          }
          @media (min-width: 1024px) {
            .hd {
              width: 1000px;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyDialog;
