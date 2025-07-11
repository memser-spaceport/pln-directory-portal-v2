import React from 'react';
import { Switch } from '@base-ui-components/react/switch';

import { useFormContext } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';

import Link from 'next/link';
import { GroupBase, OptionsOrGroups } from 'react-select';

import s from './GeneralSettings.module.scss';

const OPTIONS = [
  { value: 1, label: 'Daily' },
  { value: 7, label: 'Weekly' },
  { value: 14, label: 'Every 2 weeks' },
  { value: 30, label: 'Monthly' },
] as unknown as OptionsOrGroups<string, GroupBase<string>>;

export const GeneralSettings = ({ uid }: { uid: string }) => {
  const { watch, setValue } = useFormContext<TRecommendationsSettingsForm>();
  const { enabled } = watch();

  return (
    <div className={s.root}>
      <label className={s.Label}>
        <div className={s.col}>
          <div className={s.row}>
            <div className={s.primary}>Receive Recommendations</div>
            <Switch.Root defaultChecked className={s.Switch} checked={enabled} onCheckedChange={() => setValue('enabled', !enabled, { shouldValidate: true, shouldDirty: true })}>
              <Switch.Thumb className={s.Thumb} />
            </Switch.Root>
          </div>

          <div className={s.secondary}>Receive suggestions on members you may want to connect with, delivered via email twice per month.</div>
        </div>
      </label>
      <div className={s.notification}>
        <InfoIcon />
        <p className={s.text}>Make sure your profile is up-to-date to get the best recommendations.</p>
        <Link className={s.btn} href={`/members/${uid}`} target="_blank" rel="noreferrer">
          My Profile <ArrowIcon />
        </Link>
      </div>
      {/*<FormSelect name="frequency" placeholder="Frequency" options={OPTIONS} disabled={!enabled} />*/}
    </div>
  );
};

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96451 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7473 9.41498 20.7192 6.93661 18.8913 5.10872C17.0634 3.28084 14.585 2.25273 12 2.25ZM12 20.25C10.3683 20.25 8.77326 19.7661 7.41655 18.8596C6.05984 17.9531 5.00242 16.6646 4.378 15.1571C3.75358 13.6496 3.5902 11.9908 3.90853 10.3905C4.22685 8.79016 5.01259 7.32015 6.16637 6.16637C7.32016 5.01259 8.79017 4.22685 10.3905 3.90852C11.9909 3.59019 13.6497 3.75357 15.1571 4.37799C16.6646 5.00242 17.9531 6.05984 18.8596 7.41655C19.7661 8.77325 20.25 10.3683 20.25 12C20.2475 14.1873 19.3775 16.2843 17.8309 17.8309C16.2843 19.3775 14.1873 20.2475 12 20.25ZM13.5 16.5C13.5 16.6989 13.421 16.8897 13.2803 17.0303C13.1397 17.171 12.9489 17.25 12.75 17.25C12.3522 17.25 11.9706 17.092 11.6893 16.8107C11.408 16.5294 11.25 16.1478 11.25 15.75V12C11.0511 12 10.8603 11.921 10.7197 11.7803C10.579 11.6397 10.5 11.4489 10.5 11.25C10.5 11.0511 10.579 10.8603 10.7197 10.7197C10.8603 10.579 11.0511 10.5 11.25 10.5C11.6478 10.5 12.0294 10.658 12.3107 10.9393C12.592 11.2206 12.75 11.6022 12.75 12V15.75C12.9489 15.75 13.1397 15.829 13.2803 15.9697C13.421 16.1103 13.5 16.3011 13.5 16.5ZM10.5 7.875C10.5 7.6525 10.566 7.43499 10.6896 7.24998C10.8132 7.06498 10.9889 6.92078 11.1945 6.83564C11.4001 6.75049 11.6263 6.72821 11.8445 6.77162C12.0627 6.81502 12.2632 6.92217 12.4205 7.0795C12.5778 7.23684 12.685 7.43729 12.7284 7.65552C12.7718 7.87375 12.7495 8.09995 12.6644 8.30552C12.5792 8.51109 12.435 8.68679 12.25 8.8104C12.065 8.93402 11.8475 9 11.625 9C11.3266 9 11.0405 8.88147 10.8295 8.6705C10.6185 8.45952 10.5 8.17337 10.5 7.875Z"
      fill="#455468"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_2699_934)">
      <path
        d="M14.344 4.5V11.8125C14.344 12.0363 14.2551 12.2509 14.0968 12.4091C13.9386 12.5674 13.724 12.6562 13.5002 12.6562C13.2764 12.6562 13.0618 12.5674 12.9036 12.4091C12.7454 12.2509 12.6565 12.0363 12.6565 11.8125V6.53906L5.09717 14.097C4.93866 14.2555 4.72368 14.3445 4.49951 14.3445C4.27535 14.3445 4.06036 14.2555 3.90185 14.097C3.74335 13.9384 3.6543 13.7235 3.6543 13.4993C3.6543 13.2751 3.74335 13.0601 3.90185 12.9016L11.4612 5.34375H6.18771C5.96394 5.34375 5.74933 5.25486 5.59109 5.09662C5.43286 4.93839 5.34396 4.72378 5.34396 4.5C5.34396 4.27622 5.43286 4.06161 5.59109 3.90338C5.74933 3.74514 5.96394 3.65625 6.18771 3.65625H13.5002C13.724 3.65625 13.9386 3.74514 14.0968 3.90338C14.2551 4.06161 14.344 4.27622 14.344 4.5Z"
        fill="#1B4DFF"
      />
    </g>
    <defs>
      <filter id="filter0_d_2699_934" x="-2" y="-1" width="22" height="22" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2699_934" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2699_934" result="shape" />
      </filter>
    </defs>
  </svg>
);
