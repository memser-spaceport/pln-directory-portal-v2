import React from 'react';
import Image from 'next/image';
import { Toggle } from '@base-ui-components/react/toggle';

import { IUserInfo } from '@/types/shared.types';

import { LEARN_MORE_URL } from '@/utils/constants';

import s from './ExpertiseStep.module.scss';

interface Props {
  userInfo: IUserInfo;
}

const EXPERTISES = [
  'Research',
  'Engineering',
  'Operations',
  'Product',
  'Management',
  'Recruiting',
  'Finance',
  'Strategy',
  'Fundraising',
  'Marketing & Creative',
  'People',
  'Cryptoeconomics',
  'Legal',
  'Education',
  'Tax',
  'AI',
  'Analysis',
  'Consulting',
];

export const ExpertiseStep = ({ userInfo }: Props) => {
  return (
    <div className={s.root}>
      <div className={s.title}>What are your top 3 areas of expertise?</div>
      <div className={s.subtitle}>
        Share your calendar link to enable easy scheduling with team members — you&apos;ll also gain access to book
        their available office hours.{' '}
        <a href={LEARN_MORE_URL} target="blank">
          Learn More <Image loading="lazy" alt="learn more" src="/icons/learn-more.svg" height={16} width={16} />
        </a>
      </div>

      <ul className={s.list}>
        {EXPERTISES.map((item) => (
          <li className={s.Panel} key={item}>
            <Toggle
              aria-label="Favorite"
              className={s.Button}
              render={(props, state) => {
                if (state.pressed) {
                  return (
                    <button type="button" {...props} className={s.badgeActive}>
                      {item}
                      <div className={s.count}>1</div>
                    </button>
                  );
                }

                return (
                  <button type="button" {...props} className={s.badge}>
                    {item}
                  </button>
                );
              }}
            />
          </li>
        ))}
      </ul>
      <div className={s.counter}>3/3</div>
    </div>
  );
};
