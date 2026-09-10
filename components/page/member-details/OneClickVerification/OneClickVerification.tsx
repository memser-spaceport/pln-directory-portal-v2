'use client';

import React, { useEffect, useRef } from 'react';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

import s from './OneClickVerification.module.scss';
import { LinkedInVerificationCard } from './LinkedInVerificationCard';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { toast } from '@/components/core/ToastContainer';
import { useCookie } from 'react-use';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo | null;
  isNewInvestor?: boolean;
}

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const OneClickVerification = ({ userInfo, member, isNewInvestor }: Props) => {
  const router = useRouter();
  const isOwner = userInfo?.uid === member.id;
  const status = member?.rbac?.status;

  const hasMissingRequiredData = !member?.linkedinProfile && status === 'PENDING' && !isNewInvestor;
  const showIncomplete = hasMissingRequiredData && isOwner;
  const searchParams = useSearchParams();
  const { onSuccessLinkedInVerification, onErrorLinkedInVerification } = useMemberAnalytics();
  const [userInfoCookie, setUserInfoCookie] = useCookie('userInfo');
  const errorReported = useRef(false);

  useEffect(() => {
    if (searchParams.get('status') === 'error' && !errorReported.current) {
      errorReported.current = true;
      onErrorLinkedInVerification();
      toast.error(searchParams.get('error_message') || 'Something went wrong. Please try again later.');

      router.replace(`/members/${member.id}`);
    } else if (searchParams.get('status') === 'success') {
      onSuccessLinkedInVerification();
    }
  }, [member.id, onErrorLinkedInVerification, onSuccessLinkedInVerification, router, searchParams]);

  if (!hasMissingRequiredData && searchParams.get('status') === 'success') {
    return (
      <AnimatePresence>
        <motion.div
          className="modal"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fade}
          transition={{ duration: 0.7 }}
          style={{ zIndex: 10, position: 'fixed', inset: 0 }}
        >
          <div className={s.modal}>
            <div className={s.modalContent}>
              <VerifiedIcon />
              <div className={s.title}>Profile verified!</div>
              <p className={s.desc}>
                We will notify you once your profile is reviewed by admins. Complete your profile now to help speed up
                the review.
              </p>
              <button
                className={s.backBtn}
                onClick={() => {
                  if (userInfoCookie) {
                    try {
                      const _userInfo = JSON.parse(userInfoCookie);
                      setUserInfoCookie(JSON.stringify({ ..._userInfo, accessLevel: 'L1' }), {
                        domain: process.env.COOKIE_DOMAIN || '',
                      });
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
    /* The card is its own component now, so the job board's apply flow can mount
       it too. What stays here is this page's framing of it: the gate above, the
       success overlay below, and the return URL — which is this page, because
       this is where the round trip started. */
    <LinkedInVerificationCard memberUid={member.id} redirectUrl={`${window.location.origin}/members/${member.id}`} />
  );
};

const VerifiedIcon = () => {
  return (
    <svg width="53" height="52" viewBox="0 0 53 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.5 26C0.5 11.6406 12.1406 0 26.5 0C40.8594 0 52.5 11.6406 52.5 26C52.5 40.3594 40.8594 52 26.5 52C12.1406 52 0.5 40.3594 0.5 26Z"
        fill="#F2F5FF"
      />
      <path
        d="M24.4363 16.5788C24.2015 16.3445 23.9114 16.1732 23.5929 16.0806C23.2743 15.988 22.9376 15.9772 22.6138 16.049C22.2899 16.1209 21.9894 16.2732 21.7399 16.4918C21.4905 16.7104 21.3001 16.9884 21.1863 17.3L14.6251 35.3475C14.5173 35.6451 14.4825 35.9642 14.5236 36.2781C14.5646 36.5919 14.6804 36.8914 14.8612 37.1512C15.0419 37.4111 15.2823 37.6238 15.5623 37.7715C15.8423 37.9191 16.1536 37.9975 16.4701 38C16.7031 37.9984 16.9341 37.9561 17.1526 37.875L35.1988 31.3125C35.5106 31.1989 35.7886 31.0086 36.0074 30.7592C36.2262 30.5098 36.3786 30.2093 36.4506 29.8855C36.5226 29.5616 36.5118 29.2248 36.4193 28.9062C36.3268 28.5876 36.1556 28.2975 35.9213 28.0625L24.4363 16.5788ZM18.6426 30.1413L21.0426 23.5425L28.9576 31.4575L22.3576 33.8575L18.6426 30.1413ZM30.5001 19C30.5189 18.324 30.6826 17.6598 30.9801 17.0525C31.6426 15.7287 32.8926 15 34.5001 15C35.3376 15 35.8751 14.7138 36.2063 14.0988C36.3808 13.7547 36.4808 13.3778 36.5001 12.9925C36.5011 12.7273 36.6074 12.4733 36.7956 12.2865C36.9839 12.0997 37.2386 11.9953 37.5038 11.9963C37.7691 11.9972 38.023 12.1036 38.2099 12.2918C38.3967 12.48 38.5011 12.7348 38.5001 13C38.5001 14.6075 37.4351 17 34.5001 17C33.6626 17 33.1251 17.2863 32.7938 17.9012C32.6194 18.2453 32.5193 18.6222 32.5001 19.0075C32.4996 19.1388 32.4732 19.2688 32.4225 19.3899C32.3718 19.511 32.2978 19.621 32.2045 19.7135C32.1113 19.806 32.0008 19.8793 31.8793 19.9291C31.7578 19.9789 31.6277 20.0042 31.4963 20.0037C31.365 20.0033 31.2351 19.9769 31.1139 19.9262C30.9928 19.8755 30.8828 19.8014 30.7903 19.7082C30.6978 19.615 30.6246 19.5045 30.5748 19.383C30.525 19.2615 30.4996 19.1313 30.5001 19ZM27.5001 15V12C27.5001 11.7348 27.6054 11.4804 27.793 11.2929C27.9805 11.1054 28.2349 11 28.5001 11C28.7653 11 29.0197 11.1054 29.2072 11.2929C29.3947 11.4804 29.5001 11.7348 29.5001 12V15C29.5001 15.2652 29.3947 15.5196 29.2072 15.7071C29.0197 15.8946 28.7653 16 28.5001 16C28.2349 16 27.9805 15.8946 27.793 15.7071C27.6054 15.5196 27.5001 15.2652 27.5001 15ZM40.2076 25.2925C40.3004 25.3854 40.374 25.4957 40.4242 25.6171C40.4745 25.7384 40.5003 25.8685 40.5002 25.9998C40.5001 26.1312 40.4742 26.2612 40.4239 26.3825C40.3736 26.5038 40.2999 26.614 40.207 26.7069C40.1141 26.7997 40.0038 26.8733 39.8824 26.9235C39.761 26.9737 39.631 26.9995 39.4996 26.9995C39.3683 26.9994 39.2383 26.9735 39.117 26.9232C38.9956 26.8729 38.8854 26.7992 38.7926 26.7062L36.7926 24.7063C36.605 24.5186 36.4995 24.2641 36.4995 23.9987C36.4995 23.7334 36.605 23.4789 36.7926 23.2913C36.9802 23.1036 37.2347 22.9982 37.5001 22.9982C37.7655 22.9982 38.02 23.1036 38.2076 23.2913L40.2076 25.2925ZM40.8163 19.9487L37.8163 20.9487C37.5647 21.0326 37.2901 21.0131 37.0528 20.8945C36.8156 20.7759 36.6352 20.5679 36.5513 20.3162C36.4675 20.0646 36.487 19.79 36.6056 19.5528C36.7242 19.3155 36.9322 19.1351 37.1838 19.0513L40.1838 18.0513C40.4355 17.9674 40.7101 17.9869 40.9473 18.1055C41.1846 18.2241 41.365 18.4321 41.4488 18.6838C41.5327 18.9354 41.5132 19.21 41.3946 19.4472C41.276 19.6845 41.068 19.8649 40.8163 19.9487Z"
        fill="#1B4DFF"
      />
    </svg>
  );
};
