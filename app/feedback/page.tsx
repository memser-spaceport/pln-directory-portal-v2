'use client';

import React, { useEffect, useRef } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import s from './page.module.scss';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';

const FeedbackPage = () => {
  const router = useRouter();
  const { onRecommendationEmailFeedbackClicked } = useSettingsAnalytics();

  const reportedRef = useRef(false);
  const searchParams = useSearchParams();
  const isFromRecommendationMail = searchParams.get('utm_source') === 'recommendations';

  useEffect(() => {
    if (reportedRef.current || !isFromRecommendationMail) {
      return;
    }

    reportedRef.current = true;

    const searchParamsObj = {
      utmSource: searchParams.get('utm_source'),
      utmMedium: searchParams.get('utm_medium'),
      utmCode: searchParams.get('utm_code'),
      selection: searchParams.get('selection'),
      targetUid: searchParams.get('target_uid'),
      targetEmail: searchParams.get('target_email'),
    };

    onRecommendationEmailFeedbackClicked(searchParamsObj);
  }, [isFromRecommendationMail, onRecommendationEmailFeedbackClicked, searchParams]);

  return (
    <div className={s.root}>
      <HeroImage />
      <h1 className={s.title}>Thanks for the feedback!</h1>
      <p className={s.desc}>Your opinion is very important to us.</p>
      <div className={s.controls}>
        <button
          className={s.btnSecondary}
          onClick={() => {
            router.push('/');
          }}
        >
          Go to Home Page
        </button>
        <button
          className={s.btnPrimary}
          onClick={() => {
            router.push('/settings/recommendations');
          }}
        >
          Fine‑tune matches or opt-out
        </button>
      </div>
    </div>
  );
};

export default FeedbackPage;

const HeroImage = () => (
  <svg width="350" height="234" viewBox="0 0 350 234" fill="none" xmlns="http://www.w3.org/2000/svg" className={s.hero}>
    <g clipPath="url(#clip0_2738_17360)">
      <path
        d="M171.067 199.202C169.373 199.202 168 197.825 168 196.126C168 194.427 169.373 193.05 171.067 193.05C172.761 193.05 174.135 194.427 174.135 196.126C174.135 197.825 172.761 199.202 171.067 199.202Z"
        fill="#AEBFFF"
      />
      <path
        d="M90.7859 183.973C90.7859 186.713 88.5703 188.935 85.8373 188.935C83.1042 188.935 80.8887 186.713 80.8887 183.973C80.8887 181.232 83.1042 179.01 85.8373 179.01C88.5703 179.01 90.7859 181.232 90.7859 183.973Z"
        fill="#AEBFFF"
      />
      <path
        d="M197.815 174.073C195.953 174.073 194.443 172.559 194.443 170.692C194.443 168.824 195.953 167.31 197.815 167.31C199.678 167.31 201.188 168.824 201.188 170.692C201.188 172.559 199.678 174.073 197.815 174.073Z"
        fill="#AEBFFF"
      />
      <path
        d="M289.51 159.78C287.607 159.78 286.065 158.542 286.065 157.016C286.065 155.489 287.607 154.252 289.51 154.252C291.413 154.252 292.955 155.489 292.955 157.016C292.955 158.542 291.413 159.78 289.51 159.78Z"
        fill="#AEBFFF"
      />
      <path
        d="M256.481 152.874H256.571C257.105 160.457 262.729 160.574 262.729 160.574C262.729 160.574 256.527 160.695 256.527 169.458C256.527 160.695 250.326 160.574 250.326 160.574C250.326 160.574 255.948 160.457 256.481 152.874Z"
        fill="#AEBFFF"
      />
      <path
        d="M91.267 131.939C90.3524 133.576 88.3492 133.801 85.1397 133.49C82.7262 133.255 80.5251 133.074 78.1113 131.754C76.422 130.831 75.0846 129.582 74.1085 128.369C73.0507 127.055 71.5741 125.555 72.2978 124.065C73.2926 122.018 79.0442 120.295 84.6295 123.114C90.765 126.211 92.1619 130.339 91.267 131.939Z"
        fill="#E8EDFF"
      />
      <path
        d="M274.661 121.14C270.921 123.937 264.986 122.305 264.986 122.305C264.986 122.305 265.118 116.139 268.86 113.344C272.6 110.547 278.532 112.177 278.532 112.177C278.532 112.177 278.401 118.343 274.661 121.14Z"
        fill="#E8EDFF"
      />
      <path
        d="M74.6525 82.0414C75.1337 83.8425 74.0679 85.6938 72.2719 86.1764C70.476 86.659 68.6299 85.5901 68.1487 83.789C67.6675 81.9879 68.7333 80.1366 70.5292 79.654C72.3252 79.1714 74.1713 80.2403 74.6525 82.0414Z"
        fill="#AEBFFF"
      />
      <path
        d="M264.055 70.4502C262.552 70.4502 261.333 69.228 261.333 67.7202C261.333 66.2125 262.552 64.9902 264.055 64.9902C265.559 64.9902 266.777 66.2125 266.777 67.7202C266.777 69.228 265.559 70.4502 264.055 70.4502Z"
        fill="#AEBFFF"
      />
      <path
        d="M84.0466 68.0021C87.6014 72.1283 94.7651 71.7668 94.7651 71.7668C94.7651 71.7668 96.1608 64.7156 92.6021 60.5913C89.0473 56.4651 81.8871 56.8243 81.8871 56.8243C81.8871 56.8243 80.4917 63.8759 84.0466 68.0021Z"
        fill="#E8EDFF"
      />
      <path
        d="M125.035 53.0531C122.561 53.0531 120.556 51.0421 120.556 48.5615C120.556 46.0808 122.561 44.0698 125.035 44.0698C127.508 44.0698 129.514 46.0808 129.514 48.5615C129.514 51.0421 127.508 53.0531 125.035 53.0531Z"
        fill="#AEBFFF"
      />
      <path
        d="M120.381 185.398H237.249C246.469 185.398 253.944 177.902 253.944 168.655V51.453C253.944 42.2062 246.469 34.71 237.249 34.71H153.772C144.551 34.71 137.076 42.2062 137.076 51.453V168.655C137.076 177.902 129.601 185.398 120.381 185.398C111.16 185.398 103.686 177.902 103.686 168.655V76.5679C103.686 67.3206 111.16 59.8248 120.381 59.8248H137.076M166.294 68.1965H224.728M166.294 101.683H224.728M166.294 135.17H224.728"
        stroke="#AEBFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M210.389 164.076V147.864C210.389 145.184 211.09 142.551 212.422 140.228C213.754 137.905 215.67 135.973 217.979 134.624L233.255 125.708C235.589 124.347 238.24 123.63 240.939 123.63C243.639 123.63 246.29 124.347 248.623 125.708L263.899 134.624C266.209 135.972 268.126 137.904 269.459 140.227C270.792 142.551 271.493 145.184 271.493 147.864V164.076C271.493 166.756 270.792 169.388 269.46 171.712C268.128 174.035 266.212 175.967 263.903 177.316L248.627 186.232C246.293 187.593 243.642 188.31 240.943 188.31C238.243 188.31 235.592 187.593 233.259 186.232L217.982 177.316C215.672 175.968 213.755 174.036 212.423 171.713C211.09 169.389 210.389 166.756 210.389 164.076Z"
        fill="#4A72FF"
      />
      <path
        d="M254 163.445C254 163.445 249.127 168 241 168C232.873 168 228 163.445 228 163.445M233.576 148V151.625M248.451 148V151.625"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_2738_17360">
        <rect width="350" height="234" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
