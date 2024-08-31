'use client';

import HuskyAi from '@/components/core/husky/husky-ai';
import HuskyChat from '@/components/core/husky/husy-chat';
import PageLoader from '@/components/core/page-loader';
import { getHuskyResponseBySlug } from '@/services/husky.service';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

function HuskyDiscover(props: any) {
  const isLoggedIn = props.isLoggedIn;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter()
  const modalCode = searchParams.get('showmodal');
  const huskyShareId = searchParams.get('discoverid');
  const [initialChats, setInitialChats] = useState<any[]>([])
  const [isLoading, setLoadingStatus] = useState(false);

  const onDialogClose = () => {
    dialogRef.current?.close();
    setInitialChats([])
    if(modalCode === 'husky') {
      router.push('/')
    }
  };

  useEffect(() => {
    function dialogHandler(e: any) {
      if (dialogRef.current) {
        setInitialChats([e?.detail])
        dialogRef.current.showModal();
      }
    }
    document.addEventListener('open-husky-discover', dialogHandler);
    return function () {
      document.removeEventListener('open-husky-discover', dialogHandler);
    };
  }, []);

  useEffect(() => {
    if(modalCode === 'husky' && huskyShareId) {
      setLoadingStatus(true)
      
      getHuskyResponseBySlug(huskyShareId)
      .then(result => {
        if(result.data && dialogRef.current) {
          setInitialChats([result.data]);
          dialogRef.current.showModal();
        } else {
         toast.error('Something went wrong')
        }
      })
      .catch((e) => {
       console.error(e);
       toast.error('Something went wrong')
      })
      .finally(() => setLoadingStatus(false))

    }
  }, [modalCode, huskyShareId])



  return (
    <>
      <dialog onClose={onDialogClose} ref={dialogRef} className="hd">
        <div className="hd__head">
          <img className="hd__head__logo" src="/images/husky-logo.png" />
          <img onClick={onDialogClose} className="hd__head__close" src="/icons/close.svg" />
        </div>
        <div className="hd__content">
          {initialChats.length > 0 && <HuskyAi isLoggedIn={isLoggedIn} initialChats={initialChats} mode="blog" onClose={onDialogClose}/>}
        </div>
      </dialog>
      {isLoading && <PageLoader/>}
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

export default HuskyDiscover;
