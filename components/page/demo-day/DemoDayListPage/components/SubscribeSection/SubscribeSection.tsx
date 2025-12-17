'use client';

import React, { useState, useEffect } from 'react';
import { useSubscribeToDemoDay } from '@/services/demo-day/hooks/useSubscribeToDemoDay';
import { useGetDemoDaySubscription } from '@/services/members/hooks/useGetDemoDaySubscription';
import { IUserInfo } from '@/types/shared.types';
import s from './SubscribeSection.module.scss';

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.5383 10.6631L11.9133 16.2881C11.7372 16.4642 11.4983 16.5631 11.2492 16.5631C11.0001 16.5631 10.7613 16.4642 10.5852 16.2881C10.409 16.1119 10.3101 15.8731 10.3101 15.624C10.3101 15.3749 10.409 15.136 10.5852 14.9599L14.6094 10.9373H3.125C2.87636 10.9373 2.6379 10.8385 2.46209 10.6627C2.28627 10.4869 2.1875 10.2484 2.1875 9.99977C2.1875 9.75113 2.28627 9.51267 2.46209 9.33686C2.6379 9.16104 2.87636 9.06227 3.125 9.06227H14.6094L10.5867 5.03727C10.4106 4.86115 10.3117 4.62228 10.3117 4.37321C10.3117 4.12414 10.4106 3.88527 10.5867 3.70915C10.7628 3.53303 11.0017 3.43408 11.2508 3.43408C11.4999 3.43408 11.7387 3.53303 11.9148 3.70915L17.5398 9.33415C17.6273 9.42136 17.6966 9.52498 17.7438 9.63907C17.7911 9.75315 17.8153 9.87544 17.8152 9.99892C17.815 10.1224 17.7905 10.2446 17.743 10.3586C17.6955 10.4726 17.6259 10.576 17.5383 10.6631Z"
      fill="white"
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
          placeholder={isEmailDisabled ? `Notify me @ ${userInfo.email}` : 'Enter your email to subscribe'}
          value={isEmailDisabled ? '' : email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending || isEmailDisabled}
          required
        />
        <button type="submit" className={s.button} disabled={isPending || !email.trim()}>
          <ArrowRightIcon />
        </button>
      </form>
    </div>
  );
};
