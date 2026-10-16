'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';

import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useSetShowFeedbackButton } from '@/services/members/hooks/useSetShowFeedbackButton';
import { triggerLoader } from '@/utils/common.utils';

import s from './GeneralPreferences.module.scss';

/** Settings → General preferences. The LabOS feedback card turns the floating button back on after the member hid it from its drawer. */
export const GeneralPreferences = ({ uid }: { uid: string }) => {
  const router = useRouter();
  const { data } = useGetMemberPreferences(uid);
  const setShowFeedbackButton = useSetShowFeedbackButton(uid);

  useEffect(() => {
    triggerLoader(false);

    function handleNavigate(e: any) {
      triggerLoader(true);
      router.push(e.detail.url);
      router.refresh();
    }

    document.addEventListener('settings-navigate', handleNavigate);
    return () => document.removeEventListener('settings-navigate', handleNavigate);
  }, [router]);

  return (
    <div className={s.root}>
      <h5 className={s.title}>General Preferences</h5>
      <div className={s.card}>
        <div className={s.header}>LabOS feedback</div>
        <div className={s.content}>
          <div className={s.toggleSection}>
            <label className={clsx(s.Label, s.toggle)}>
              Show feedback button
              <Switch.Root
                className={s.Switch}
                checked={data?.memberPreferences?.showFeedbackButton ?? true}
                disabled={!data}
                onCheckedChange={setShowFeedbackButton}
              >
                <Switch.Thumb className={s.Thumb}>
                  <div className={s.dot} />
                </Switch.Thumb>
              </Switch.Root>
            </label>
            <div className={s.desc}>
              The floating button in the corner of LabOS pages. When it is off, you can still give feedback from the (?)
              menu.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
