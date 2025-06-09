'use client';

import React from 'react';

import s from './FloatingWidgets.module.scss';
import { SubscribeToRecommendationsWidget } from '@/components/page/member-info/components/SubscribeToRecommendationsWidget';
import { IUserInfo } from '@/types/shared.types';

interface Props {
  userInfo: IUserInfo;
}

export const FloatingWidgets = ({ userInfo }: Props) => {
  return (
    <div className={s.root}>
      <SubscribeToRecommendationsWidget userInfo={userInfo} />
    </div>
  );
};
