'use client';

import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import {
  AI_APP_FEEDBACK_STATUSES,
  AI_APP_FEEDBACK_STATUS_LABELS,
  type AiAppFeedbackStatus,
} from '@/services/ai-app-feedback/constants';

import s from './FeedbackStatusSelector.module.scss';

interface Props {
  readonly status: AiAppFeedbackStatus;
  readonly isPending?: boolean;
  readonly onStatusSelect: (status: AiAppFeedbackStatus) => void;
}

function ChevronIcon() {
  return (
    <svg className={s.chevron} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBadge({ status }: { status: AiAppFeedbackStatus }) {
  return <span className={clsx(s.badge, s[`badge_${status}`])}>{AI_APP_FEEDBACK_STATUS_LABELS[status]}</span>;
}

export function FeedbackStatusSelector({ status, isPending, onStatusSelect }: Props) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        className={clsx(s.trigger, s[`trigger_${status}`], isPending && s.triggerPending)}
        disabled={isPending}
        aria-label={`Change status (currently ${AI_APP_FEEDBACK_STATUS_LABELS[status]})`}
      >
        <StatusBadge status={status} />
        <ChevronIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.positioner} sideOffset={4} align="start">
          <Menu.Popup className={s.menu}>
            <div className={s.menuHint}>Set status</div>
            {AI_APP_FEEDBACK_STATUSES.map((option) => (
              <Menu.Item
                key={option}
                className={s.option}
                onClick={() => {
                  if (option === status) return;
                  onStatusSelect(option);
                }}
              >
                <StatusBadge status={option} />
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
