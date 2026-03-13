'use client';

import React from 'react';
import { IMember } from '@/types/members.types';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete';
import { useUpdateMemberInvestorSettings } from '@/services/members/hooks/useUpdateMemberInvestorSettings';
import { toast } from '@/components/core/ToastContainer';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { isInvestor as isInvestorAccess } from '@/utils/isInvestor';
import { isDemodaySignUpSource } from '@/utils/member.utils';
import { InfoCircleIcon, PlusSmIcon, CloseSmIcon } from '../icons';

import s from './InvestorPromptBanner.module.scss';

interface Props {
  member?: IMember;
  isInvestor?: boolean | null;
  signUpSource?: string;
  isInvestViaFund?: boolean;
  secRulesAccepted: boolean | undefined;
  showIncomplete: boolean;
  onEdit?: () => void;
  onHideSection?: () => void;
}

export const InvestorPromptBanner = ({
  member,
  isInvestor,
  signUpSource,
  isInvestViaFund,
  secRulesAccepted,
  showIncomplete,
  onEdit,
  onHideSection,
}: Props) => {
  const { mutate: updateMemberInvestorSettings } = useUpdateMemberInvestorSettings();
  const { onInvestorProfileAddDetailsClicked, onInvestorProfileNotAnInvestorClicked } = useDemoDayAnalytics();

  const handleAddDetails = () => {
    if (!member?.id) return;

    onInvestorProfileAddDetailsClicked();

    updateMemberInvestorSettings(
      {
        uid: member.id,
        payload: { isInvestor: true },
      },
      {
        onSuccess: () => {
          toast.info('Investor profile settings updated successfully');
          onEdit?.();
        },
      },
    );
  };

  const handleNotAnInvestor = () => {
    if (!member?.id) return;

    onInvestorProfileNotAnInvestorClicked();

    updateMemberInvestorSettings(
      {
        uid: member.id,
        payload: { isInvestor: false },
      },
      {
        onSuccess: () => {
          onHideSection?.();
        },
      },
    );

    toast.info('Investor section hidden. You can re-enable it anytime in Account Settings → Email Preferences.', {
      style: {
        width: 450,
      },
    });
  };

  if (!showIncomplete) return null;

  const showInteractiveBanner =
    isInvestor === null &&
    !isInvestorAccess(member?.accessLevel || '') &&
    !isDemodaySignUpSource(signUpSource) &&
    !isInvestViaFund &&
    !secRulesAccepted;

  if (showInteractiveBanner) {
    return (
      <div className={s.incompleteWarning}>
        <div className={s.warningContent}>
          <div className={s.warningIcon}>
            <InfoCircleIcon />
          </div>
          <div className={s.warningText}>
            Do you invest in startups? Add your investor details to receive demo day invites and deal flow intros.
          </div>
          <div className={s.warningButtons}>
            <button className={s.linkButton} onClick={handleAddDetails}>
              <PlusSmIcon />
              Add Details
            </button>
            <button className={s.linkButton} onClick={handleNotAnInvestor}>
              <CloseSmIcon />
              Not an Investor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DataIncomplete className={s.incompleteStrip}>
      Review your investor details; founders see this when you&apos;re introduced.
    </DataIncomplete>
  );
};
