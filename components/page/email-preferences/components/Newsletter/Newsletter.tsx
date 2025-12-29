import React from 'react';

import s from './Newsletter.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { getMemberInfo } from '@/services/members.service';

export const Newsletter = ({
  userInfo,
  initialData,
}: {
  userInfo: IUserInfo;
  initialData: Awaited<ReturnType<typeof getMemberInfo>>;
}) => {
  const { mutate } = useUpdateMemberParams();
  const { data } = useMember(userInfo.uid, initialData);
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
        <div className={s.toggleSection}>
          <label className={clsx(s.Label, s.toggle)}>
            Subscribe to PL Newsletter
            <Switch.Root
              // defaultChecked
              className={s.Switch}
              checked={data?.memberInfo?.isSubscribedToNewsletter ?? true}
              onCheckedChange={handleChange}
            >
              <Switch.Thumb className={s.Thumb}>
                <div className={s.dot} />
              </Switch.Thumb>
            </Switch.Root>
          </label>
          <div className={s.desc}>Get newsletter straight to your inbox</div>
        </div>
      </div>
    </div>
  );
};
