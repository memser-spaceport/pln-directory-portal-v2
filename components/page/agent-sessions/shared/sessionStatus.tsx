import type { ComponentType } from 'react';
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  MergeIcon,
  PullRequestIcon,
  QuestionIcon,
  SlashIcon,
  SpinnerIcon,
  TrashIcon,
} from './statusIcons';
import s from './AgentSessions.module.scss';

type StatusTone = 'progress' | 'waiting' | 'success' | 'danger' | 'info' | 'neutral';

interface StatusMeta {
  label: string;
  tone: StatusTone;
  Icon: ComponentType<{ className?: string }>;
  /** Continuously animated — reserved for states where work is actually happening. */
  spin?: boolean;
  /** Gently pulsed — draws the eye to a state that is blocked on a human. */
  pulse?: boolean;
}

const TONE_CLASS: Record<StatusTone, string> = {
  progress: s.toneProgress,
  waiting: s.toneWaiting,
  success: s.toneSuccess,
  danger: s.toneDanger,
  info: s.toneInfo,
  neutral: s.toneNeutral,
};

/**
 * Covers both `status` on a session and `feature_environment_status`, which share
 * most of their vocabulary.
 *
 * Anything missing here still renders — see `humanizeStatus`. The orchestrator adds
 * states without warning (`waiting_for_input` appeared this way), so an unknown
 * value must degrade to a readable badge rather than a blank or a crash.
 */
const STATUS_META: Record<string, StatusMeta> = {
  queued: { label: 'Queued', tone: 'neutral', Icon: ClockIcon },
  cleanup_pending: { label: 'Cleanup pending', tone: 'neutral', Icon: ClockIcon },

  starting: { label: 'Starting', tone: 'progress', Icon: SpinnerIcon, spin: true },
  cloning: { label: 'Cloning', tone: 'progress', Icon: SpinnerIcon, spin: true },
  running: { label: 'Running', tone: 'progress', Icon: SpinnerIcon, spin: true },
  testing: { label: 'Testing', tone: 'progress', Icon: SpinnerIcon, spin: true },
  pushing: { label: 'Pushing', tone: 'progress', Icon: SpinnerIcon, spin: true },
  deploying: { label: 'Deploying', tone: 'progress', Icon: SpinnerIcon, spin: true },
  in_progress: { label: 'In progress', tone: 'progress', Icon: SpinnerIcon, spin: true },
  dispatching: { label: 'Dispatching', tone: 'progress', Icon: SpinnerIcon, spin: true },
  dispatched: { label: 'Dispatched', tone: 'progress', Icon: SpinnerIcon, spin: true },
  deleting: { label: 'Deleting', tone: 'neutral', Icon: SpinnerIcon, spin: true },

  // The only state that needs a person. Amber and pulsing so it stands out in a
  // list where every other row is self-driving.
  waiting_for_input: { label: 'Waiting for input', tone: 'waiting', Icon: QuestionIcon, pulse: true },

  pr_created: { label: 'PR created', tone: 'info', Icon: PullRequestIcon },
  merged: { label: 'Merged', tone: 'info', Icon: MergeIcon },
  ready: { label: 'Ready', tone: 'success', Icon: CheckIcon },

  failed: { label: 'Failed', tone: 'danger', Icon: AlertIcon },
  cleanup_failed: { label: 'Cleanup failed', tone: 'danger', Icon: AlertIcon },

  cancelled: { label: 'Cancelled', tone: 'neutral', Icon: SlashIcon },
  closed: { label: 'Closed', tone: 'neutral', Icon: SlashIcon },
  deleted: { label: 'Deleted', tone: 'neutral', Icon: TrashIcon },
};

/** `some_new_state` → `Some new state`. */
export function humanizeStatus(status: string): string {
  const spaced = status.replace(/_/g, ' ').trim();
  if (!spaced) return status;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function SessionStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status];
  const label = meta ? meta.label : humanizeStatus(status);
  const tone = meta ? meta.tone : 'neutral';
  const Icon = meta?.Icon;
  const motion = meta?.spin ? s.spin : meta?.pulse ? s.pulse : '';

  return (
    // `title` keeps the raw API value one hover away. The labels intentionally no
    // longer match the wire format, and admins debugging against the orchestrator
    // still need to know which value they are looking at.
    <span className={`${s.status} ${TONE_CLASS[tone]}`} title={status}>
      {Icon ? <Icon className={`${s.statusIcon} ${motion}`} /> : null}
      {label}
    </span>
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
