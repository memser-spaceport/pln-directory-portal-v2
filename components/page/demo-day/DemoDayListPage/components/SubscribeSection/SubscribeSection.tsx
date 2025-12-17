'use client';

import React, { useState, useEffect } from 'react';
import { useSubscribeToDemoDay } from '@/services/demo-day/hooks/useSubscribeToDemoDay';
import { useGetDemoDaySubscription } from '@/services/members/hooks/useGetDemoDaySubscription';
import { IUserInfo } from '@/types/shared.types';
import s from './SubscribeSection.module.scss';

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.09091 9.09091H14.9091M14.9091 9.09091L9.09091 3.27273M14.9091 9.09091L9.09091 14.9091"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Props = {
  isLoggedIn?: boolean;
  userInfo?: IUserInfo;
};

export const SubscribeSection = ({ isLoggedIn, userInfo }: Props) => {
  const [email, setEmail] = useState('');
  const { mutate, isPending } = useSubscribeToDemoDay();
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useGetDemoDaySubscription(userInfo?.uid);

  // Prepopulate email if user is logged in
  useEffect(() => {
    if (isLoggedIn && userInfo?.email) {
      setEmail(userInfo.email);
    }
  }, [isLoggedIn, userInfo?.email]);

  // Wait for subscription data to load for logged-in users
  if (isLoggedIn && isLoadingSubscription) {
    return null;
  }

  // Hide component if user is already subscribed
  if (isLoggedIn && subscriptionData?.demoDaySubscriptionEnabled) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          setEmail('');
        },
      },
    );
  };

  const isEmailDisabled = isLoggedIn && !!userInfo?.email;

  return (
    <div className={s.root}>
      <p className={s.description}>Be the first to know when demo day registration opens</p>
      <form className={s.form} onSubmit={handleSubmit}>
        <input
          type="email"
          className={s.input}
          placeholder="Enter your email to subscribe"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending || isEmailDisabled}
          required
        />
        <button type="submit" className={s.button} disabled={isPending || !email.trim()}>
          <span className={s.buttonText}>Subscribe</span>
          <ArrowRightIcon />
        </button>
      </form>
    </div>
  );
};
