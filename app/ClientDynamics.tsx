'use client';

import dynamic from 'next/dynamic';

export const Loader = dynamic(() => import('../components/core/loader'), { ssr: false });
export const AuthBox = dynamic(
  () => import('@/components/core/login/components/AuthBox').then((m) => m.AuthBox),
  { ssr: false },
);
export const ToastContainer = dynamic(() => import('@/components/core/ToastContainer'), { ssr: false });
export const BroadCastChannel = dynamic(
  () => import('@/components/core/login/components/BroadcastChannel').then((m) => m.BroadcastChannel),
  { ssr: false },
);
export const MemberRegisterDialog = dynamic(
  () => import('@/components/core/register/member-register-dialog'),
  { ssr: false },
);
export const CookieChecker = dynamic(
  () => import('@/components/core/login/components/CookieChecker').then((m) => m.CookieChecker),
  { ssr: false },
);
export const PostHogPageview = dynamic(
  () => import('@/providers/analytics-provider').then((d) => d.PostHogPageview),
  { ssr: false },
);
export const RatingContainer = dynamic(
  () => import('@/components/core/office-hours-rating/rating-container'),
  { ssr: false },
);
