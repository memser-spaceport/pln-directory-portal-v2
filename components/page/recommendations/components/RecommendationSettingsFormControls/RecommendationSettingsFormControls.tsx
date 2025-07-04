import React from 'react';

import s from './RecommendationSettingsFormControls.module.scss';
import { useFormContext } from 'react-hook-form';
import clsx from 'clsx';
import { Spinner } from '@/components/ui/Spinner';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';

export const RecommendationSettingsFormControls = () => {
  const {
    reset,
    formState: { isDirty, isSubmitting, isValid },
  } = useFormContext();

  const { onRecommendationsSettingsResetClicked } = useSettingsAnalytics();

  return (
    <div
      className={clsx(s.root, {
        [s.visible]: isDirty && isValid,
      })}
    >
      <div className={s.message}>
        <SaveIcon /> Attention! You have unsaved changes!
      </div>
      <div className={s.right}>
        <button
          type="button"
          className={s.btn}
          disabled={!isDirty || isSubmitting}
          onClick={() => {
            onRecommendationsSettingsResetClicked();
            reset();
          }}
        >
          Reset
        </button>
        <button type="submit" className={s.primaryBtn} disabled={!isDirty || isSubmitting || !isValid}>
          {isSubmitting ? (
            <>
              <Spinner /> Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
};

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 6H3.33333V3.33333H10M8 12.6667C7.46957 12.6667 6.96086 12.456 6.58579 12.0809C6.21071 11.7058 6 11.1971 6 10.6667C6 10.1362 6.21071 9.62753 6.58579 9.25245C6.96086 8.87738 7.46957 8.66667 8 8.66667C8.53043 8.66667 9.03914 8.87738 9.41421 9.25245C9.78929 9.62753 10 10.1362 10 10.6667C10 11.1971 9.78929 11.7058 9.41421 12.0809C9.03914 12.456 8.53043 12.6667 8 12.6667ZM11.3333 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V4.66667L11.3333 2Z"
      fill="#64748B"
    />
  </svg>
);
