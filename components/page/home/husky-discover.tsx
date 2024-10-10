'use client';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import HuskyAi from '@/components/core/husky/husky-ai';
import PageLoader from '@/components/core/page-loader';
import {  } from '@/services/husky.service';
import { useRouter, useSearchParams } from 'next/navigation';
import cookies from 'js-cookie'
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { getHuskyResponseBySlug, incrementHuskyViewCount } from '@/services/home.service';

let huskyRecorded = false;

function HuskyDiscover(props: any) {
  const isLoggedIn = props.isLoggedIn;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter()
  const modalCode = searchParams.get('showmodal');
  const huskyShareId = searchParams.get('discoverid');
  const [slugId, setSlugId] = useState(huskyShareId ?? '');
  const [initialChats, setInitialChats] = useState<any[]>([])
  const [isLoading, setLoadingStatus] = useState(false);
  const { trackSharedBlog} = useHuskyAnalytics()

  const onDialogClose = () => {
    dialogRef.current?.close();
    setInitialChats([])
    if(modalCode === 'husky') {
      router.push('/')
    }
  };
  const increaseViewAndShow = (data: any) => {
   incrementHuskyViewCount(data.slug)
    .then(() => {
      if(data && dialogRef.current) {
        setSlugId(data.slug)
        setInitialChats([data])
        dialogRef.current.showModal();
       }
    })
    .catch(e => console.error(e))
    .finally(() => {})
  }

  const getUserInfoFromCookie = () => {
      const rawUserInfo = cookies.get('userInfo');
      if(rawUserInfo) {
        const parsedUserInfo = JSON.parse(rawUserInfo)
        return parsedUserInfo
      }

      return null
  }


  useEffect(() => {
    function dialogHandler(e: any) {
      if (dialogRef.current) {
        increaseViewAndShow(e?.detail)
        trackSharedBlog(e?.detail?.slug, 'discover', e?.detail?.question)
      }
    }
    document.addEventListener('open-husky-discover', dialogHandler);
    return function () {
      document.removeEventListener('open-husky-discover', dialogHandler);
    };
  }, []);

  useEffect(() => {
    if(modalCode === 'husky' && huskyShareId && huskyShareId === slugId ) {
      setLoadingStatus(true)
      getHuskyResponseBySlug(huskyShareId, true)
      .then(result => {
        if(result.data && dialogRef.current) {
          setInitialChats([result.data]);
          if(!huskyRecorded) {
            trackSharedBlog(huskyShareId, 'shareurl', result.data?.question)
          }
          huskyRecorded = true;
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
          <img className="hd__head__logo" src="/images/husky-logo.svg" />
          <img onClick={onDialogClose} className="hd__head__close" src="/icons/close.svg" />
        </div>
        <div className="hd__content">
          {initialChats.length > 0 && <HuskyAi blogId={slugId} isLoggedIn={isLoggedIn} initialChats={initialChats} mode="blog" onClose={onDialogClose} />}
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
