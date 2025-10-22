'use client';

import React from 'react';

import s from './InvestorCommunications.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';
import { InvestorSettings, useGetInvestorSettings } from '@/services/members/hooks/useGetInvestorSettings';
import { useUpdateInvestorSettings } from '@/services/members/hooks/useUpdateInvestorSettings';

export const InvestorCommunications = ({
  userInfo,
  initialData,
}: {
  userInfo: IUserInfo;
  initialData: InvestorSettings;
}) => {
  const { mutate } = useUpdateInvestorSettings();
  const { data } = useGetInvestorSettings(userInfo.uid, initialData);

  console.log({ data, initialData });

  const handleInvestorEventsChange = (checked: boolean) => {
    if (!userInfo.uid || !data) {
      return;
    }

    const _payload = {
      investorInvitesEnabled: checked,
      investorDealflowEnabled: data.investorDealflowEnabled,
    };

    mutate({
      uid: userInfo.uid,
      payload: _payload,
    });
  };

  const handleDealflowDigestsChange = (checked: boolean) => {
    if (!userInfo.uid || !data) {
      return;
    }

    const _payload = {
      investorDealflowEnabled: checked,
      investorInvitesEnabled: data.investorInvitesEnabled,
    };

    mutate({
      uid: userInfo.uid,
      payload: _payload,
    });
  };

  return (
    <div className={s.root}>
      <div className={s.header}>Investor Communications</div>
      <div className={s.content}>
        <div className={s.toggleSection}>
          <label className={clsx(s.Label, s.toggle)}>
            Invitations to investor & founder events
            <Switch.Root
              // defaultChecked
              className={s.Switch}
              checked={data?.investorInvitesEnabled}
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
              // defaultChecked={initialData?.investorDealflowEnabled}
              className={s.Switch}
              checked={data?.investorDealflowEnabled}
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
