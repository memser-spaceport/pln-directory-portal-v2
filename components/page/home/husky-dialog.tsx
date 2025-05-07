'use client';

import HuskyAi from '@/components/core/husky/husky-ai';
import { useEffect, useRef, useState } from 'react';

function HuskyDialog(props: any) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isLoggedIn = props?.isLoggedIn;
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [huskySource, setHuskySource] = useState('');
  const [initialChats, setInitialChats] = useState<any>([]);

  const onDialogClose = () => {
    setInitialChats([]);
    setSearchText('');
    setHuskySource('');
    dialogRef.current?.close();
    setIsOpen(false);
  };

  useEffect(() => {
    async function dialogHandler(e: any) {
      if (dialogRef.current) {
        setIsOpen(true);
        if (e.detail?.searchText) {
          setSearchText(e.detail.searchText);
        }
        if (e.detail?.from) {
          setHuskySource(e.detail.from);
        }
        if (e.detail?.initialChat) {
          setInitialChats([{ ...e.detail?.initialChat, isError: false }]);
        }
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
      <div>HELLO</div>
      <dialog onClose={onDialogClose} ref={dialogRef} className="hd">
        <div className="hd__head">
          <img className="hd__head__logo" src="/images/husky-logo.svg" />
          <img onClick={onDialogClose} className="hd__head__close" src="/icons/close.svg" />
        </div>
        <div className="hd__content">{isOpen && <HuskyAi initialChats={initialChats} onClose={onDialogClose} isLoggedIn={isLoggedIn} huskySource={huskySource} searchText={searchText} />}</div>
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
            border-bottom: 0.5px solid #cbd5e1;
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
