import React from 'react';

import s from './DemoDayUpdates.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import {
  useGetDemoDaySubscription,
  DemoDaySubscriptionSettings,
} from '@/services/members/hooks/useGetDemoDaySubscription';
import { useUpdateDemoDaySubscription } from '@/services/members/hooks/useUpdateDemoDaySubscription';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';

export const DemoDayUpdates = ({
  userInfo,
  initialData,
}: {
  userInfo: IUserInfo;
  initialData?: DemoDaySubscriptionSettings;
}) => {
  const { mutate } = useUpdateDemoDaySubscription();
  const { data } = useGetDemoDaySubscription(userInfo.uid, initialData);
  const { onDemoDayUpdatesNotificationToggleClicked } = useSettingsAnalytics();

  const handleChange = (checked: boolean) => {
    if (!userInfo.uid) {
      return;
    }

    mutate({
      uid: userInfo.uid,
      demoDaySubscriptionEnabled: checked,
    });

    onDemoDayUpdatesNotificationToggleClicked({ demoDaySubscriptionEnabled: checked });
  };

  return (
    <div className={s.root}>
      <div className={s.header}>Demo Day Updates</div>
      <div className={s.content}>
        <div className={s.toggleSection}>
          <label className={clsx(s.Label, s.toggle)}>
            Receive Demo Day Updates
            <Switch.Root
              className={s.Switch}
              checked={data?.demoDaySubscriptionEnabled ?? false}
              onCheckedChange={handleChange}
            >
              <Switch.Thumb className={s.Thumb}>
                <div className={s.dot} />
              </Switch.Thumb>
            </Switch.Root>
          </label>
          <div className={s.desc}>
            Get notified when registration opens, demo day begins and other relevant reminders.
          </div>
        </div>
      </div>
    </div>
  );
};
