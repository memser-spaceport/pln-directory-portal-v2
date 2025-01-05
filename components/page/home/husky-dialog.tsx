'use client';

import HuskyAi from '@/components/core/husky/husky-ai';
import { useEffect, useRef, useState } from 'react';

function HuskyDialog(props:any) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isLoggedIn = props?.isLoggedIn;
  const [isOpen, setIsOpen] = useState(false);

  const onDialogClose = () => {
    dialogRef.current?.close()
    setIsOpen(false)
  };

  useEffect(() => {
    function dialogHandler(e: any) {
      if (dialogRef.current) {
        setIsOpen(true);
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
          <img className="hd__head__logo" src="/images/husky-logo.svg" />
          <img onClick={onDialogClose} className="hd__head__close" src="/icons/close.svg" />
        </div>
        <div className="hd__content">
          {isOpen && <HuskyAi onClose={onDialogClose} isLoggedIn={isLoggedIn} />}
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
            height: calc(100% - 42px);
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
