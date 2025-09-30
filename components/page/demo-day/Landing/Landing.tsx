import React from 'react';
import { clsx } from 'clsx';
import Cookies from 'js-cookie';

import { getParsedValue } from '@/utils/common.utils';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

import LoginBtn from '@/components/core/navbar/login-btn';
import { LandingBase } from '@/components/page/demo-day/LandingBase';

import s from './Landing.module.scss';

const INVITE_FORM_URL =
  'https://docs.google.com/forms/d/1c_djy7MnO-0k89w1zdFnBKF6GLdYKKWUvLTDBjxd114/viewform?edit_requested=true';

export function Landing() {
  const { data } = useGetDemoDayState();

  const userInfo = getParsedValue(Cookies.get('userInfo'));

  return (
    <LandingBase>
      <div className={s.root}>
        {!userInfo && <LoginBtn className={clsx(s.btn, s.loginButton)}>Have an Invite? Log In</LoginBtn>}

        <a href={INVITE_FORM_URL} target="_blank" rel="noopener noreferrer" className={s.link}>
          <button className={clsx(s.btn, s.primaryButton)}>Request an Invite</button>
        </a>
      </div>
    </LandingBase>
  );
}
