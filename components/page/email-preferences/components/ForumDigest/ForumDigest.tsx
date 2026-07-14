'use client';

import React, { useMemo } from 'react';

import s from './ForumDigest.module.scss';
import { ForumDigestSettings, useGetForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import { IUserInfo } from '@/types/shared.types';
import { Field } from '@base-ui-components/react/field';
import { Switch } from '@base-ui-components/react/switch';
import { clsx } from 'clsx';
import { useUpdateForumDigestSettings } from '@/services/forum/hooks/useUpdateForumDigestSettings';
import dynamic from 'next/dynamic';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%' }}>
      <Skeleton height={50} width="100%" />
    </div>
  ),
});

const options = [
  {
    label: 'No Digest',
    value: 'no_digest',
    description: 'Don’t receive digest emails.',
  },
  {
    label: 'Daily Digest',
    value: 'daily_digest',
    description: 'A summary of what’s new every day.',
  },
  {
    label: 'Weekly Digest',
    value: 'weekly_digest',
    description: 'A summary of what’s new every week.',
  },
];

export const ForumDigest = ({
  userInfo,
  initialData,
  hasForumAccess,
}: {
  userInfo: IUserInfo;
  initialData: ForumDigestSettings;
  hasForumAccess: boolean;
}) => {
  const { mutate } = useUpdateForumDigestSettings();
  const { data } = useGetForumDigestSettings(userInfo.uid, initialData);
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

      mutate(
        {
          uid: userInfo.uid,
          payload: _payload,
        },
        {
          onSuccess: () => {
            analytics.onForumDigestOptionSelect({ ..._payload, source: 'settings' });
          },
          onError: () => {
            analytics.onForumDigestSaveFailed({ attemptedFrequency: 'no_digest', source: 'settings' });
          },
        },
      );

      return;
    }

    if (value.value === 'daily_digest') {
      const _payload = {
        ...data,
        forumDigestEnabled: true,
        forumDigestFrequency: 1 as const,
      };

      mutate(
        {
          uid: userInfo.uid,
          payload: _payload,
        },
        {
          onSuccess: () => {
            analytics.onForumDigestOptionSelect({ ..._payload, source: 'settings' });
          },
          onError: () => {
            analytics.onForumDigestSaveFailed({ attemptedFrequency: 'daily', source: 'settings' });
          },
        },
      );

      return;
    }

    if (value.value === 'weekly_digest') {
      const _payload = {
        ...data,
        forumDigestEnabled: true,
        forumDigestFrequency: 7 as const,
      };

      mutate(
        {
          uid: userInfo.uid,
          payload: _payload,
        },
        {
          onSuccess: () => {
            analytics.onForumDigestOptionSelect({ ..._payload, source: 'settings' });
          },
          onError: () => {
            analytics.onForumDigestSaveFailed({ attemptedFrequency: 'weekly', source: 'settings' });
          },
        },
      );

      return;
    }
  };

  const handleNewsChange = (checked: boolean) => {
    if (!userInfo.uid || !data) {
      return;
    }

    mutate({
      uid: userInfo.uid,
      payload: {
        ...data,
        forumDigestNewsEnabled: checked,
      },
    });

    analytics.onForumDigestNetworkNewsToggleClicked({ forumDigestNewsEnabled: checked });
  };

  const handleForumChange = (checked: boolean) => {
    if (!userInfo.uid || !data || !hasForumAccess) {
      return;
    }

    mutate({
      uid: userInfo.uid,
      payload: {
        ...data,
        forumDigestForumEnabled: checked,
      },
    });

    analytics.onForumDigestForumActivityToggleClicked({ forumDigestForumEnabled: checked });
  };

  return (
    <div className={s.root}>
      <div className={s.header}>Digest</div>
      <div className={s.content}>
        <Field.Root className={s.field}>
          <Field.Label className={clsx(s.label)}>Email me a digest:</Field.Label>
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
        {data?.forumDigestEnabled && (
          <>
            {/* Forum activity is hard-gated on forum access: without it the
                toggle is rendered disabled and always off, and the backend
                never includes forum posts in the digest either way. */}
            <div className={s.toggleSection}>
              <label className={clsx(s.Label, s.toggle)}>
                Forum activity
                <Switch.Root
                  className={s.Switch}
                  checked={hasForumAccess && (data?.forumDigestForumEnabled ?? true)}
                  disabled={!hasForumAccess}
                  onCheckedChange={handleForumChange}
                >
                  <Switch.Thumb className={s.Thumb}>
                    <div className={s.dot} />
                  </Switch.Thumb>
                </Switch.Root>
              </label>
              <div className={s.desc}>Discussions, replies, and trending posts from the forum.</div>
            </div>
            <div className={s.toggleSection}>
              <label className={clsx(s.Label, s.toggle)}>
                Network news
                <Switch.Root
                  className={s.Switch}
                  checked={data?.forumDigestNewsEnabled ?? true}
                  onCheckedChange={handleNewsChange}
                >
                  <Switch.Thumb className={s.Thumb}>
                    <div className={s.dot} />
                  </Switch.Thumb>
                </Switch.Root>
              </label>
              <div className={s.desc}>
                Funding, launches, partnerships, and milestones from teams across the network.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
