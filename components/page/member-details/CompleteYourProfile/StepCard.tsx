import { ProfileOnboardingStep } from '@/services/members/types';
import { SuccessCircleIcon } from '@/components/icons/SuccessCircleIcon';
import { CheckIcon } from '@/components/icons/CheckIcon';
import { getStepLabel, getActionLabel, isActionClickable } from './config';
import clsx from 'clsx';
import s from './CompleteYourProfile.module.scss';

interface StepCardProps {
  step: ProfileOnboardingStep;
  variant: 'done' | 'active' | 'pending';
  onActionClick?: (actionType: string) => void;
  recentlyCompletedActions?: Set<string>;
}

function RadioCircleIconActive({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_dd_15319_129996)">
        <path
          d="M3 10C3 5.58172 6.58172 2 11 2C15.4183 2 19 5.58172 19 10C19 14.4183 15.4183 18 11 18C6.58172 18 3 14.4183 3 10Z"
          fill="#1B4DFF"
        />
        <path
          d="M7 10C7 7.79086 8.79086 6 11 6C13.2091 6 15 7.79086 15 10C15 12.2091 13.2091 14 11 14C8.79086 14 7 12.2091 7 10Z"
          fill="white"
        />
      </g>
      <defs>
        <filter
          id="filter0_dd_15319_129996"
          x="0"
          y="0"
          width="22"
          height="22"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_15319_129996" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.12 0" />
          <feBlend mode="normal" in2="effect1_dropShadow_15319_129996" result="effect2_dropShadow_15319_129996" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_15319_129996" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}

function RadioCircleIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_dd_15484_118163)">
        <path
          d="M3 10C3 5.58172 6.58172 2 11 2C15.4183 2 19 5.58172 19 10C19 14.4183 15.4183 18 11 18C6.58172 18 3 14.4183 3 10Z"
          fill="#8897AE"
        />
        <path
          d="M7 10C7 7.79086 8.79086 6 11 6C13.2091 6 15 7.79086 15 10C15 12.2091 13.2091 14 11 14C8.79086 14 7 12.2091 7 10Z"
          fill="white"
        />
      </g>
      <defs>
        <filter
          id="filter0_dd_15484_118163"
          x="0"
          y="0"
          width="22"
          height="22"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_15484_118163" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.12 0" />
          <feBlend mode="normal" in2="effect1_dropShadow_15484_118163" result="effect2_dropShadow_15484_118163" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_15484_118163" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}

function StepIcon({ variant }: { variant: 'done' | 'active' | 'pending' }) {
  switch (variant) {
    case 'done':
      return <SuccessCircleIcon style={{ color: '#16a34a', width: 20, height: 20 }} />;
    case 'active':
      return <RadioCircleIconActive color="#156ff7" />;
    case 'pending':
      return <RadioCircleIcon color="#94a3b8" />;
  }
}

export function StepCard({ step, variant, onActionClick, recentlyCompletedActions }: StepCardProps) {
  const cardHasCompletion = recentlyCompletedActions && step.actions.some((a) => recentlyCompletedActions.has(a.type));

  return (
    <div
      className={clsx(s.stepCard, {
        [s.stepCardActive]: variant === 'active',
        [s.stepCardCompleted]: cardHasCompletion,
      })}
    >
      <div className={s.stepHeader}>
        <StepIcon variant={variant} />
        <span className={clsx(s.stepLabel, { [s.stepLabelActive]: variant === 'active' })}>
          {getStepLabel(step.type)}
        </span>
      </div>
      <div className={s.stepActions}>
        {step.actions.map((action) => {
          const isDone = action.state === 'done';
          const clickable = isActionClickable(action.type) && onActionClick && !isDone;
          const justCompleted = recentlyCompletedActions?.has(action.type);

          return (
            <div key={action.type} className={s.actionItem}>
              <span className={clsx({ [s.checkIconPop]: justCompleted })}>
                <CheckIcon style={{ color: isDone ? '#16a34a' : '#94a3b8', width: 12, height: 12, flexShrink: 0 }} />
              </span>
              {clickable ? (
                <button type="button" className={s.actionLink} onClick={() => onActionClick(action.type)}>
                  {getActionLabel(action.type)}
                </button>
              ) : (
                <span className={clsx(s.actionText, { [s.actionTextDone]: isDone })}>
                  {getActionLabel(action.type)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
