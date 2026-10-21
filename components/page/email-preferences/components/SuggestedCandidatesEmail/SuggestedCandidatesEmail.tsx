import React from 'react';

import s from './SuggestedCandidatesEmail.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { useGetSuggestedCandidatesEmailSetting } from '@/services/members/hooks/useGetSuggestedCandidatesEmailSetting';
import { useUpdateSuggestedCandidatesEmailSetting } from '@/services/members/hooks/useUpdateSuggestedCandidatesEmailSetting';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';

/**
 * Team leads' switch for the weekly suggested candidates email (LAB-2849). The
 * host decides who sees it (leads only, behind SHOW_SUGGESTED_CANDIDATES_EMAIL);
 * mounting it is what starts the GET.
 */
export const SuggestedCandidatesEmail = ({ userInfo }: { userInfo: IUserInfo }) => {
  const { mutate } = useUpdateSuggestedCandidatesEmailSetting();
  const { data } = useGetSuggestedCandidatesEmailSetting(userInfo.uid);
  const { onSuggestedCandidatesEmailToggleClicked } = useSettingsAnalytics();

  // No data yet (loading, or the read failed): the switch can't show the real
  // state, so it must not offer to change it either.
  const isReady = typeof data?.suggestedCandidatesEmailEnabled === 'boolean';

  const handleChange = (checked: boolean) => {
    if (!userInfo.uid) {
      return;
    }

    mutate({
      uid: userInfo.uid,
      suggestedCandidatesEmailEnabled: checked,
    });

    onSuggestedCandidatesEmailToggleClicked({ suggestedCandidatesEmailEnabled: checked });
  };

  return (
    <div className={s.root}>
      <div className={s.header}>Suggested Candidates</div>
      <div className={s.content}>
        <div className={s.toggleSection}>
          <label className={clsx(s.Label, s.toggle)}>
            Receive suggested candidates email
            <Switch.Root
              className={s.Switch}
              checked={data?.suggestedCandidatesEmailEnabled ?? false}
              disabled={!isReady}
              onCheckedChange={handleChange}
            >
              <Switch.Thumb className={s.Thumb}>
                <div className={s.dot} />
              </Switch.Thumb>
            </Switch.Root>
          </label>
          <div className={s.desc}>Get a weekly email with suggested candidates for your open roles.</div>
        </div>
      </div>
    </div>
  );
};
