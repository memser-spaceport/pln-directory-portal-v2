'use client';

import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { useLinkedInVerification } from '@/services/members/hooks/useLinkedInVerification';
import { Spinner } from '@/components/ui/Spinner';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import s from './OneClickVerification.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { toast } from 'react-toastify';
import { useCookie } from 'react-use';
import { getAccessLevel } from '@/utils/auth.utils';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const OneClickVerification = ({ userInfo, member }: Props) => {
  const router = useRouter();
  const isOwner = userInfo?.uid === member.id;
  const hasMissingRequiredData = !member?.linkedinProfile && getAccessLevel(userInfo, true) === 'base';
  const showIncomplete = hasMissingRequiredData && isOwner;
  const searchParams = useSearchParams();
  const { onConnectLinkedInClicked, onSuccessLinkedInVerification, onErrorLinkedInVerification } = useMemberAnalytics();
  const [userInfoCookie, setUserInfoCookie] = useCookie('userInfo');

  const { mutate, isPending } = useLinkedInVerification();

  useEffect(() => {
    if (searchParams.get('status') === 'error') {
      onErrorLinkedInVerification();
      toast.error(searchParams.get('error_message') || 'Something went wrong. Please try again later.');
    } else if (searchParams.get('status') === 'success') {
      onSuccessLinkedInVerification();
    }
  }, [onErrorLinkedInVerification, onSuccessLinkedInVerification, searchParams]);

  if (!hasMissingRequiredData && searchParams.get('status') === 'success') {
    return (
      <AnimatePresence>
        <motion.div className="modal" initial="hidden" animate="visible" exit="exit" variants={fade} transition={{ duration: 0.7 }} style={{ zIndex: 10, position: 'fixed', inset: 0 }}>
          <div className={s.modal}>
            <div className={s.modalContent}>
              <VerifiedIcon />
              <div className={s.title}>Profile verified!</div>
              <p className={s.desc}>We will notify you once your profile is reviewed by admins. Complete your profile now to help speed up the review.</p>
              <button
                className={s.backBtn}
                onClick={() => {
                  if (userInfoCookie) {
                    try {
                      const _userInfo = JSON.parse(userInfoCookie);
                      setUserInfoCookie(JSON.stringify({ ..._userInfo, accessLevel: 'L1' }));
                    } catch (e) {
                      console.error('Failed to parse userInfo cookie: ', e);
                    }
                  }

                  router.replace(`/members/${member.id}`);
                }}
              >
                Back to profile
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!showIncomplete) {
    return null;
  }

  return (
    <div
      className={clsx(s.root, {
        [s.missingData]: showIncomplete,
      })}
    >
      <div className={s.missingDataHeader}>
        <WarningIcon />
        Please verify your identity
      </div>
      <div className={s.content}>
        <div className={s.label}>
          <ArrowIcon /> One-click verification
        </div>
        <div className={clsx(s.body)}>
          <div className={s.row}>
            <p>Link your LinkedIn account to complete verification.</p>
            <button
              className={clsx(s.btn)}
              onClick={() => {
                onConnectLinkedInClicked();
                mutate({ uid: member.id });
              }}
              disabled={isPending}
            >
              {isPending ? <Spinner /> : <LinkedInIcon />} LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WarningIcon = () => {
  return (
    <svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5 0.625C7.88281 0.625 8.23828 0.84375 8.42969 1.17188L14.3359 11.2344C14.5273 11.5898 14.5273 12 14.3359 12.3281C14.1445 12.6836 13.7891 12.875 13.4062 12.875H1.59375C1.18359 12.875 0.828125 12.6836 0.636719 12.3281C0.445312 12 0.445312 11.5898 0.636719 11.2344L6.54297 1.17188C6.73438 0.84375 7.08984 0.625 7.5 0.625ZM7.5 4.125C7.11719 4.125 6.84375 4.42578 6.84375 4.78125V7.84375C6.84375 8.22656 7.11719 8.5 7.5 8.5C7.85547 8.5 8.15625 8.22656 8.15625 7.84375V4.78125C8.15625 4.42578 7.85547 4.125 7.5 4.125ZM8.375 10.25C8.375 9.78516 7.96484 9.375 7.5 9.375C7.00781 9.375 6.625 9.78516 6.625 10.25C6.625 10.7422 7.00781 11.125 7.5 11.125C7.96484 11.125 8.375 10.7422 8.375 10.25Z"
        fill="#0F172A"
      />
    </svg>
  );
};

const LinkedInIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="white" />
      <path
        d="M7.43989 14.1622H5.16301V7.49968H7.43989V14.1622ZM6.29987 6.5764C6.0416 6.57506 5.78955 6.50327 5.57552 6.3701C5.3615 6.23692 5.19509 6.04832 5.09731 5.82811C4.99953 5.60789 4.97475 5.36593 5.0261 5.13276C5.07745 4.89958 5.20264 4.68565 5.38585 4.51795C5.56907 4.35025 5.8021 4.23631 6.05555 4.1905C6.30899 4.14469 6.57149 4.16907 6.80991 4.26056C7.04833 4.35205 7.25198 4.50655 7.39517 4.70456C7.53837 4.90257 7.61468 5.13522 7.61447 5.37315C7.61691 5.53244 7.58451 5.69055 7.5192 5.83806C7.45389 5.98557 7.35701 6.11946 7.23433 6.23174C7.11166 6.34402 6.9657 6.43241 6.80516 6.49162C6.64461 6.55084 6.47277 6.57967 6.29987 6.5764ZM15.8323 14.168H13.5565V10.5282C13.5565 9.45473 13.0611 9.12339 12.4217 9.12339C11.7465 9.12339 11.084 9.5923 11.084 10.5553V14.168H8.80707V7.50452H10.9967V8.42779H11.0261C11.2459 8.01799 12.0157 7.31754 13.1905 7.31754C14.4609 7.31754 15.8333 8.01217 15.8333 10.0467L15.8323 14.168Z"
        fill="#F59E0B"
      />
    </svg>
  );
};

const ArrowIcon = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.625 1.28125C0.625 0.925781 0.898438 0.625 1.25391 0.625C1.39062 0.625 1.55469 0.707031 1.66406 0.789062L9.15625 7.46094C9.29297 7.57031 9.375 7.73438 9.375 7.89844C9.375 8.25391 9.10156 8.5 8.74609 8.5H5.51953L7.07812 11.6172C7.29688 12.0547 7.13281 12.5742 6.69531 12.793C6.25781 13.0117 5.73828 12.8477 5.51953 12.4102L3.93359 9.21094L1.66406 11.8086C1.55469 11.9453 1.39062 12 1.22656 12C0.871094 12 0.625 11.7539 0.625 11.3984V1.28125Z"
      fill="#0F172A"
    />
  </svg>
);

const VerifiedIcon = () => {
  return (
    <svg width="53" height="52" viewBox="0 0 53 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.5 26C0.5 11.6406 12.1406 0 26.5 0C40.8594 0 52.5 11.6406 52.5 26C52.5 40.3594 40.8594 52 26.5 52C12.1406 52 0.5 40.3594 0.5 26Z" fill="#F2F5FF" />
      <path
        d="M24.4363 16.5788C24.2015 16.3445 23.9114 16.1732 23.5929 16.0806C23.2743 15.988 22.9376 15.9772 22.6138 16.049C22.2899 16.1209 21.9894 16.2732 21.7399 16.4918C21.4905 16.7104 21.3001 16.9884 21.1863 17.3L14.6251 35.3475C14.5173 35.6451 14.4825 35.9642 14.5236 36.2781C14.5646 36.5919 14.6804 36.8914 14.8612 37.1512C15.0419 37.4111 15.2823 37.6238 15.5623 37.7715C15.8423 37.9191 16.1536 37.9975 16.4701 38C16.7031 37.9984 16.9341 37.9561 17.1526 37.875L35.1988 31.3125C35.5106 31.1989 35.7886 31.0086 36.0074 30.7592C36.2262 30.5098 36.3786 30.2093 36.4506 29.8855C36.5226 29.5616 36.5118 29.2248 36.4193 28.9062C36.3268 28.5876 36.1556 28.2975 35.9213 28.0625L24.4363 16.5788ZM18.6426 30.1413L21.0426 23.5425L28.9576 31.4575L22.3576 33.8575L18.6426 30.1413ZM30.5001 19C30.5189 18.324 30.6826 17.6598 30.9801 17.0525C31.6426 15.7287 32.8926 15 34.5001 15C35.3376 15 35.8751 14.7138 36.2063 14.0988C36.3808 13.7547 36.4808 13.3778 36.5001 12.9925C36.5011 12.7273 36.6074 12.4733 36.7956 12.2865C36.9839 12.0997 37.2386 11.9953 37.5038 11.9963C37.7691 11.9972 38.023 12.1036 38.2099 12.2918C38.3967 12.48 38.5011 12.7348 38.5001 13C38.5001 14.6075 37.4351 17 34.5001 17C33.6626 17 33.1251 17.2863 32.7938 17.9012C32.6194 18.2453 32.5193 18.6222 32.5001 19.0075C32.4996 19.1388 32.4732 19.2688 32.4225 19.3899C32.3718 19.511 32.2978 19.621 32.2045 19.7135C32.1113 19.806 32.0008 19.8793 31.8793 19.9291C31.7578 19.9789 31.6277 20.0042 31.4963 20.0037C31.365 20.0033 31.2351 19.9769 31.1139 19.9262C30.9928 19.8755 30.8828 19.8014 30.7903 19.7082C30.6978 19.615 30.6246 19.5045 30.5748 19.383C30.525 19.2615 30.4996 19.1313 30.5001 19ZM27.5001 15V12C27.5001 11.7348 27.6054 11.4804 27.793 11.2929C27.9805 11.1054 28.2349 11 28.5001 11C28.7653 11 29.0197 11.1054 29.2072 11.2929C29.3947 11.4804 29.5001 11.7348 29.5001 12V15C29.5001 15.2652 29.3947 15.5196 29.2072 15.7071C29.0197 15.8946 28.7653 16 28.5001 16C28.2349 16 27.9805 15.8946 27.793 15.7071C27.6054 15.5196 27.5001 15.2652 27.5001 15ZM40.2076 25.2925C40.3004 25.3854 40.374 25.4957 40.4242 25.6171C40.4745 25.7384 40.5003 25.8685 40.5002 25.9998C40.5001 26.1312 40.4742 26.2612 40.4239 26.3825C40.3736 26.5038 40.2999 26.614 40.207 26.7069C40.1141 26.7997 40.0038 26.8733 39.8824 26.9235C39.761 26.9737 39.631 26.9995 39.4996 26.9995C39.3683 26.9994 39.2383 26.9735 39.117 26.9232C38.9956 26.8729 38.8854 26.7992 38.7926 26.7062L36.7926 24.7063C36.605 24.5186 36.4995 24.2641 36.4995 23.9987C36.4995 23.7334 36.605 23.4789 36.7926 23.2913C36.9802 23.1036 37.2347 22.9982 37.5001 22.9982C37.7655 22.9982 38.02 23.1036 38.2076 23.2913L40.2076 25.2925ZM40.8163 19.9487L37.8163 20.9487C37.5647 21.0326 37.2901 21.0131 37.0528 20.8945C36.8156 20.7759 36.6352 20.5679 36.5513 20.3162C36.4675 20.0646 36.487 19.79 36.6056 19.5528C36.7242 19.3155 36.9322 19.1351 37.1838 19.0513L40.1838 18.0513C40.4355 17.9674 40.7101 17.9869 40.9473 18.1055C41.1846 18.2241 41.365 18.4321 41.4488 18.6838C41.5327 18.9354 41.5132 19.21 41.3946 19.4472C41.276 19.6845 41.068 19.8649 40.8163 19.9487Z"
        fill="#1B4DFF"
      />
    </svg>
  );
};
