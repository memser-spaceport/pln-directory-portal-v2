import React from 'react';

import s from './Newsletter.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';

export const Newsletter = ({ userInfo }: { userInfo: IUserInfo }) => {
  const { mutate } = useUpdateMemberParams();
  const { data } = useMember(userInfo.uid);
  const analytics = useSettingsAnalytics();

  const handleChange = (checked: boolean) => {
    if (!userInfo.uid || !data) {
      return;
    }

    const _payload = {
      isSubscribedToNewsletter: checked,
    };

    mutate({
      uid: userInfo.uid,
      payload: _payload,
    });

    analytics.onSubscribeToPlNewsletterChange(_payload);
  };

  return (
    <div className={s.root}>
      <div className={s.header}>Newsletter</div>
      <div className={s.content}>
        <label className={clsx(s.Label, s.toggle)}>
          Subscribe to PL Newsletter
          <Switch.Root defaultChecked className={s.Switch} checked={data?.memberInfo.isSubscribedToNewsletter} onCheckedChange={handleChange}>
            <Switch.Thumb className={s.Thumb}>
              <div className={s.dot} />
            </Switch.Thumb>
          </Switch.Root>
        </label>
        <div className={s.desc}>Get new letter straight to your inbox</div>
      </div>
    </div>
  );
};
