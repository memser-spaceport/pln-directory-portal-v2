import React from 'react';

import s from './InvestorCommunications.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';

export const InvestorCommunications = ({ userInfo }: { userInfo: IUserInfo }) => {
  const { mutate } = useUpdateMemberParams();
  const { data } = useMember(userInfo.uid);
  const analytics = useSettingsAnalytics();

  const handleInvestorEventsChange = (checked: boolean) => {
    if (!userInfo.uid || !data) {
      return;
    }

    const _payload = {
      isSubscribedToInvestorEvents: checked,
    };

    mutate({
      uid: userInfo.uid,
      payload: _payload,
    });

    analytics.onSubscribeToPlNewsletterChange(_payload);
  };

  const handleDealflowDigestsChange = (checked: boolean) => {
    if (!userInfo.uid || !data) {
      return;
    }

    const _payload = {
      isSubscribedToDealflowDigests: checked,
    };

    mutate({
      uid: userInfo.uid,
      payload: _payload,
    });

    analytics.onSubscribeToPlNewsletterChange(_payload);
  };

  return (
    <div className={s.root}>
      <div className={s.header}>Investor Communications</div>
      <div className={s.content}>
        <div className={s.toggleSection}>
          <label className={clsx(s.Label, s.toggle)}>
            Invitations to investor & founder events
            <Switch.Root
              defaultChecked
              className={s.Switch}
              checked={data?.memberInfo.isSubscribedToInvestorEvents}
              onCheckedChange={handleInvestorEventsChange}
            >
              <Switch.Thumb className={s.Thumb}>
                <div className={s.dot} />
              </Switch.Thumb>
            </Switch.Root>
          </label>
          <div className={s.desc}>I would like to receive invitations to investor and founder focused PL events.</div>
        </div>
        
        <div className={s.toggleSection}>
          <label className={clsx(s.Label, s.toggle)}>
            Dealflow intros & digests
            <Switch.Root
              defaultChecked
              className={s.Switch}
              checked={data?.memberInfo.isSubscribedToDealflowDigests}
              onCheckedChange={handleDealflowDigestsChange}
            >
              <Switch.Thumb className={s.Thumb}>
                <div className={s.dot} />
              </Switch.Thumb>
            </Switch.Root>
          </label>
          <div className={s.desc}>I would like to receive dealflow intros & digests relevant to me.</div>
        </div>
      </div>
    </div>
  );
};
