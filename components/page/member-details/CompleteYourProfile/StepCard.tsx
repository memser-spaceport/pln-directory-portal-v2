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
}

function RadioCircleIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="2" />
      <circle cx="10" cy="10" r="4" fill={color} />
    </svg>
  );
}

function StepIcon({ variant }: { variant: 'done' | 'active' | 'pending' }) {
  switch (variant) {
    case 'done':
      return <SuccessCircleIcon style={{ color: '#16a34a', width: 20, height: 20 }} />;
    case 'active':
      return <RadioCircleIcon color="#156ff7" />;
    case 'pending':
      return <RadioCircleIcon color="#94a3b8" />;
  }
}

export function StepCard({ step, variant, onActionClick }: StepCardProps) {
  return (
    <div className={clsx(s.stepCard, { [s.stepCardActive]: variant === 'active' })}>
      <div className={s.stepHeader}>
        <StepIcon variant={variant} />
        <span className={clsx(s.stepLabel, { [s.stepLabelActive]: variant === 'active' })}>{getStepLabel(step.type)}</span>
      </div>
      <div className={s.stepActions}>
        {step.actions.map((action) => {
          const isDone = action.state === 'done';
          const clickable = isActionClickable(action.type) && onActionClick;

          return (
            <div key={action.type} className={s.actionItem}>
              <CheckIcon style={{ color: isDone ? '#16a34a' : '#94a3b8', width: 12, height: 12, flexShrink: 0 }} />
              {clickable ? (
                <button
                  type="button"
                  className={s.actionLink}
                  onClick={() => onActionClick(action.type)}
                >
                  {getActionLabel(action.type)}
                </button>
              ) : (
                <span className={clsx(s.actionText, { [s.actionTextDone]: isDone })}>{getActionLabel(action.type)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
