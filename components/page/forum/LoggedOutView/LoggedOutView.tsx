'use client';

import React from 'react';
import s from './LoggedOutView.module.scss';
import { Avatar } from '@base-ui-components/react/avatar';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { TOAST_MESSAGES } from '@/utils/constants';

const items = new Array(5).fill(0).map((_, i) => (
  <li className={s.listItem} key={i}>
    <div className={s.title}>How we reduced retrieval latency in a decentralized data pipeline by 45%</div>
    <div className={s.desc}>We recently ran a benchmark sprint to optimize our retrieval layer on a distributed archive... Read more</div>
    <div className={s.footer}>
      <Avatar.Root className={s.Avatar}>
        <Avatar.Fallback className={s.Fallback}>JS</Avatar.Fallback>
      </Avatar.Root>
      <div className={s.name}>by John Smith</div>
      <div className={s.position}>· Developer @Aave</div>
      <div className={s.time}>3 days ago</div>
    </div>
  </li>
));

export const LoggedOutView = ({ accessLevel }: { accessLevel?: string }) => {
  const router = useRouter();

  const onLoginClickHandler = () => {
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      if (window.location.pathname === '/sign-up') {
        router.push(`/#login`);
      } else {
        router.push(`${window.location.pathname}${window.location.search}#login`);
      }
    }
  };

  function getTitle() {
    switch (accessLevel) {
      case 'L0':
      case 'L1': {
        return 'Forum access unavailable';
      }
      default: {
        return 'Forum requires login access';
      }
    }
  }

  function getDesc() {
    switch (accessLevel) {
      case 'L0': {
        return "Verify your identity to start the approval process. You'll be notified once approved to participate.";
      }
      case 'L1': {
        return "Your profile is under review. You'll be notified once approved to participate.";
      }
      default: {
        return 'Get help or share insights with the PL network. Log in to read and contribute.';
      }
    }
  }

  return (
    <>
      <div className={s.root}>
        <div className={s.tabs}>
          <div className={s.content}>
            <div>All</div>
            <div>General</div>
            <div>Launch</div>
            <div>Recruiting</div>
          </div>
        </div>
        <div className={s.content}>
          <ul className={s.list}>{items}</ul>
        </div>
      </div>
      <div className={s.modal}>
        <div className={s.modalContent}>
          <div className={s.lock}>
            <LockIcon />
          </div>
          <div className={s.primary}>{getTitle()}</div>
          <div className={s.secondary}>{getDesc()}</div>
          {!accessLevel && (
            <>
              <button className={s.mainBtn} onClick={onLoginClickHandler}>
                Log in
              </button>
              <div className={s.sub}>
                New to Protocol Labs? Join the network.{' '}
                <button
                  className={s.secBtn}
                  onClick={() => {
                    router.push('/sign-up');
                  }}
                >
                  Sign Up
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const LockIcon = () => (
  <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24.8889 11H21.3334V8.33333C21.3334 6.91885 20.7715 5.56229 19.7713 4.5621C18.7711 3.5619 17.4145 3 16 3C14.5856 3 13.229 3.5619 12.2288 4.5621C11.2286 5.56229 10.6667 6.91885 10.6667 8.33333V11H7.11115C6.63966 11 6.18747 11.1873 5.85407 11.5207C5.52067 11.8541 5.33337 12.3063 5.33337 12.7778V25.2222C5.33337 25.6937 5.52067 26.1459 5.85407 26.4793C6.18747 26.8127 6.63966 27 7.11115 27H24.8889C25.3604 27 25.8126 26.8127 26.146 26.4793C26.4794 26.1459 26.6667 25.6937 26.6667 25.2222V12.7778C26.6667 12.3063 26.4794 11.8541 26.146 11.5207C25.8126 11.1873 25.3604 11 24.8889 11ZM16.8889 19.7367V22.5556C16.8889 22.7913 16.7953 23.0174 16.6286 23.1841C16.4619 23.3508 16.2358 23.4444 16 23.4444C15.7643 23.4444 15.5382 23.3508 15.3715 23.1841C15.2048 23.0174 15.1112 22.7913 15.1112 22.5556V19.7367C14.5181 19.527 14.0182 19.1144 13.6999 18.5718C13.3816 18.0292 13.2654 17.3916 13.3718 16.7716C13.4782 16.1516 13.8003 15.5891 14.2812 15.1837C14.7622 14.7782 15.371 14.5558 16 14.5558C16.6291 14.5558 17.2379 14.7782 17.7188 15.1837C18.1998 15.5891 18.5219 16.1516 18.6283 16.7716C18.7347 17.3916 18.6184 18.0292 18.3002 18.5718C17.9819 19.1144 17.482 19.527 16.8889 19.7367ZM19.5556 11H12.4445V8.33333C12.4445 7.39034 12.8191 6.48597 13.4859 5.81918C14.1527 5.15238 15.057 4.77778 16 4.77778C16.943 4.77778 17.8474 5.15238 18.5142 5.81918C19.181 6.48597 19.5556 7.39034 19.5556 8.33333V11Z"
      fill="#1B4DFF"
    />
  </svg>
);
