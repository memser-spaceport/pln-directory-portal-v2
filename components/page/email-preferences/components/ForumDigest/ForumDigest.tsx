'use client';

import React, { useMemo } from 'react';

import s from './ForumDigest.module.scss';
import { useGetForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import { IUserInfo } from '@/types/shared.types';
import { Field } from '@base-ui-components/react/field';
import { clsx } from 'clsx';
import { useUpdateForumDigestSettings } from '@/services/forum/hooks/useUpdateForumDigestSettings';
import dynamic from 'next/dynamic';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
const Select = dynamic(() => import('react-select'), { ssr: false });

const options = [
  {
    label: 'No Digest',
    value: 'no_digest',
    description: 'Don’t receive forum digests by email.',
  },
  {
    label: 'Daily Digest',
    value: 'daily_digest',
    description: 'New and trending posts every day.',
  },
  {
    label: 'Weekly Digest',
    value: 'weekly_digest',
    description: 'Top discussions and replies every week.',
  },
];

export const ForumDigest = ({ userInfo }: { userInfo: IUserInfo }) => {
  const { mutate } = useUpdateForumDigestSettings();
  const { data } = useGetForumDigestSettings(userInfo.uid);
  const analytics = useSettingsAnalytics();

  const value = useMemo(() => {
    if (!data) {
      return options[0];
    }

    if (!data.forumDigestEnabled) {
      return options[0];
    }

    if (data.forumDigestFrequency === 1) {
      return options[1];
    }

    if (data.forumDigestFrequency === 7) {
      return options[2];
    }

    return options[0];
  }, [data]);

  const handleChange = (value: any) => {
    if (!userInfo.uid || !data) {
      return;
    }

    if (value.value === 'no_digest') {
      const _payload = {
        ...data,
        forumDigestEnabled: false,
      };

      mutate({
        uid: userInfo.uid,
        payload: _payload,
      });

      analytics.onForumDigestOptionSelect(_payload);

      return;
    }

    if (value.value === 'daily_digest') {
      const _payload = {
        ...data,
        forumDigestEnabled: true,
        forumDigestFrequency: 1,
      };

      mutate({
        uid: userInfo.uid,
        payload: _payload,
      });

      analytics.onForumDigestOptionSelect(_payload);

      return;
    }

    if (value.value === 'weekly_digest') {
      const _payload = {
        ...data,
        forumDigestEnabled: true,
        forumDigestFrequency: 7,
      };

      mutate({
        uid: userInfo.uid,
        payload: _payload,
      });

      analytics.onForumDigestOptionSelect(_payload);

      return;
    }
  };

  return (
    <div className={s.root}>
      <div className={s.header}>Forum Digest</div>
      <div className={s.content}>
        <Field.Root className={s.field}>
          <Field.Label className={clsx(s.label)}>Email me about forum activity:</Field.Label>
          <Select
            menuPlacement="auto"
            placeholder="Select frequency"
            options={options}
            value={value}
            defaultValue={value}
            onChange={handleChange}
            styles={{
              container: (base) => ({
                ...base,
                width: '100%',
              }),
              control: (baseStyles) => ({
                ...baseStyles,
                alignItems: 'center',
                gap: '8px',
                alignSelf: 'stretch',
                borderRadius: '8px',
                border: '1px solid rgba(203, 213, 225, 0.50)',
                background: '#fff',
                outline: 'none',
                minWidth: '140px',
                width: '100%',
                borderColor: 'rgba(203, 213, 225, 0.50) !important',
                position: 'relative',
                fontSize: '16px',
                color: '#455468',
                boxShadow: 'none !important',
                '&:hover': {
                  border: '1px solid #5E718D',
                  boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                  borderColor: '#5E718D !important',
                },
                '&:focus-visible, &:focus': {
                  borderColor: '#5E718D !important',
                  boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                },
              }),
              input: (baseStyles) => ({
                ...baseStyles,
                height: '42px',
                padding: 0,
                fontSize: 16,
                // background: 'tomato',
              }),
              option: (baseStyles) => ({
                ...baseStyles,
                fontSize: '14px',
                fontWeight: 300,
                color: '#455468',
                '&:hover': {
                  background: 'rgba(27, 56, 96, 0.12)',
                },
              }),
              menuList: (base) => ({
                ...base,
                width: '100%',
              }),
              menu: (baseStyles) => ({
                ...baseStyles,
                outline: 'none',
                zIndex: 3,
                display: 'flex',
                padding: '8px',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }),
              placeholder: (baseStyles) => ({
                ...baseStyles,
                color: '#CBD5E1',
              }),
              indicatorSeparator: (base) => ({
                display: 'none',
              }),
            }}
            components={{
              NoOptionsMessage: () => {
                return (
                  <div className={s.notFound}>
                    <span>No options found</span>
                  </div>
                );
              },
              Option: (props) => {
                const _data = props.data as {
                  label: string;
                  value: string;
                  description: string;
                };
                return (
                  <div onClick={() => props.selectOption(_data)} className={s.option}>
                    <div className={s.optionLabel}>{_data.label}</div>
                    {_data.description && <div className={s.optionDesc}>{_data.description}</div>}
                  </div>
                );
              },
            }}
          />
        </Field.Root>
      </div>
    </div>
  );
};
