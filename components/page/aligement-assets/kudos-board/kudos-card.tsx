'use client';

import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/core/ToastContainer';

import { useCurrentUserStore } from '@/services/auth/store';
import { useUpdateCommunityKudos } from '@/hooks/use-kudos';
import { useKudosAnalytics } from '@/analytics/kudos.analytics';
import { getCurrentRoundNumber } from '@/utils/plaa-round.utils';
import { buildCommunityKudosSchema, type CommunityKudosFormValues, type CommunityKudosLimits } from '@/schema/kudos-forms';
import { communityGiftOptions } from './data/kudos-board.data';
import type { ICommunityKudos, ICommunityKudosInput, IUserSummary } from './data/kudos-board.types';

// useForm needs a resolver every render, even before `limits` loads and the
// edit form (which needs `limits`) is reachable.
const PLACEHOLDER_LIMITS: CommunityKudosLimits = {
  pointsMin: 0,
  pointsMax: 0,
  pointsStep: 1,
  messageMin: 0,
  messageMax: 0,
};

interface IKudosCardProps {
  kudos: ICommunityKudos;
  recipients: IUserSummary[];
  recipientsLoading?: boolean;
  /** Remaining pool *before* this kudos' own points are added back for editing. */
  poolRemaining: number;
  limits?: CommunityKudosLimits;
  /** Prototypes/tests only: seeding the real `useCurrentUserStore` with a fake user forces a genuine logout. */
  currentUserForPreview?: { uid?: string } | null;
  /** Prototypes/tests only: stands in for `useUpdateCommunityKudos()`, which needs a reachable PLAA backend. */
  onSaveForPreview?: (args: { id: string; input: ICommunityKudosInput }) => Promise<ICommunityKudos>;
}

const AVATAR_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#14B8A6',
  '#3B82F6',
  '#EF4444',
  '#22C55E',
  '#F97316',
];

function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  const diffHr = Math.round(diffMs / 3_600_000);
  const diffDay = Math.round(diffMs / 86_400_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(iso).toLocaleDateString();
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function KudosCard({
  kudos,
  recipients,
  recipientsLoading = false,
  poolRemaining,
  limits,
  currentUserForPreview,
  onSaveForPreview,
}: IKudosCardProps) {
  const sessionCurrentUser = useCurrentUserStore((s) => s.currentUser);
  const currentUser = currentUserForPreview !== undefined ? currentUserForPreview : sessionCurrentUser;
  const mutation = useUpdateCommunityKudos();
  const analytics = useKudosAnalytics();
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingPreview, setIsSavingPreview] = useState(false);

  const isOwn = Boolean(currentUser?.uid) && currentUser?.uid === kudos.giver.memberId;
  const isCurrentRound = kudos.roundId === String(getCurrentRoundNumber());
  const canEdit = isOwn && isCurrentRound && Boolean(limits);
  const isLocked = isOwn && !isCurrentRound;

  const schema = useMemo(() => buildCommunityKudosSchema(limits ?? PLACEHOLDER_LIMITS), [limits]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<CommunityKudosFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { recipientId: kudos.recipient.memberId, points: kudos.points, message: kudos.message },
  });

  function startEdit() {
    reset({ recipientId: kudos.recipient.memberId, points: kudos.points, message: kudos.message });
    setIsEditing(true);
    analytics.onEditKudosOpened({ kudosId: kudos.id });
  }

  function cancelEdit() {
    reset({ recipientId: kudos.recipient.memberId, points: kudos.points, message: kudos.message });
    setIsEditing(false);
  }

  async function onSubmit(values: CommunityKudosFormValues) {
    try {
      if (onSaveForPreview) {
        setIsSavingPreview(true);
        try {
          await onSaveForPreview({ id: kudos.id, input: values });
        } finally {
          setIsSavingPreview(false);
        }
      } else {
        await mutation.mutateAsync({ id: kudos.id, input: values });
      }
      analytics.onCommunityKudosUpdated({ kudosId: kudos.id, points: values.points, recipientId: values.recipientId });
      toast.success('Kudos updated.');
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  const isSaving = mutation.isPending || isSavingPreview;

  // Keep a since-departed recipient selectable so the form doesn't blank out.
  const recipientOptions = recipients.some((r) => r.memberId === kudos.recipient.memberId)
    ? recipients
    : [kudos.recipient, ...recipients];

  // Add this kudos' own points back so editing isn't blocked by double-counting them.
  const pointOpts = limits
    ? communityGiftOptions(poolRemaining + kudos.points, limits.pointsMin, limits.pointsMax, limits.pointsStep)
    : [];
  const message = watch('message') ?? '';

  return (
    <article className="card">
      <div className="card__top">
        <span className="card__points">+{kudos.points} pts</span>
        <span className="card__time">{formatRelativeTime(kudos.createdAt)}</span>
      </div>

      <div className="card__header">
        <div className="card__avatar" style={{ background: avatarColor(kudos.giver.name) }} aria-hidden>
          {initials(kudos.giver.name)}
        </div>
        <div className="card__header-text">
          <div className="card__giver">{kudos.giver.name}</div>
          <div className="card__recipient">
            gave kudos to <span className="card__mention">@{kudos.recipient.name}</span>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form className="edit-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor={`recipient-${kudos.id}`}>
              Recipient
            </label>
            <select
              id={`recipient-${kudos.id}`}
              className="form-control"
              disabled={recipientsLoading}
              {...register('recipientId')}
            >
              {recipientOptions.map((r) => (
                <option key={r.memberId} value={r.memberId}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.recipientId && <p className="form-error-inline">{errors.recipientId.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`message-${kudos.id}`}>
              Message
            </label>
            <textarea
              id={`message-${kudos.id}`}
              className="form-control form-textarea"
              maxLength={limits?.messageMax}
              {...register('message')}
            />
            <div className="form-row-between">
              <span className="form-hint">
                {limits?.messageMin ?? 0}–{limits?.messageMax ?? 0} characters
              </span>
              <span className="char-count">
                {message.trim().length}/{limits?.messageMax ?? 0}
              </span>
            </div>
            {errors.message && <p className="form-error-inline">{errors.message.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`points-${kudos.id}`}>
              Points awarded
            </label>
            <Controller
              control={control}
              name="points"
              render={({ field }) => (
                <select
                  id={`points-${kudos.id}`}
                  className="form-control"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                >
                  {pointOpts.map((v) => (
                    <option key={v} value={v}>
                      {v} pts
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.points && <p className="form-error-inline">{errors.points.message}</p>}
          </div>

          <div className="edit-form__footer">
            <button type="button" className="btn-ghost" onClick={cancelEdit}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving || !isValid}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="card__message">&ldquo;{kudos.message}&rdquo;</p>

          <div className="card__meta">
            <span className="card__awarded">
              <span className="card__awarded-dot" />
              Awarded
            </span>
            {canEdit && (
              <button type="button" className="card__edit-btn" onClick={startEdit}>
                <PencilIcon />
                Edit
              </button>
            )}
            {isLocked && (
              <span className="card__lock" title="Finalized — no longer editable" aria-label="Finalized — no longer editable">
                <LockIcon />
              </span>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition:
            box-shadow 0.15s,
            border-color 0.15s;
        }
        .card:hover {
          box-shadow: 0 4px 20px rgba(27, 84, 255, 0.08);
          border-color: #87a6fd;
        }
        .card__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .card__points {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #dfe6fb;
          color: #1036a8;
          border: 1px solid #87a6fd;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .card__time {
          font-size: 11.5px;
          color: #94a3b8;
        }
        .card__header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .card__avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .card__header-text {
          flex: 1;
          min-width: 0;
        }
        .card__giver {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .card__recipient {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }
        .card__mention {
          color: #1b54ff;
          font-weight: 600;
        }
        .card__message {
          font-size: 14px;
          color: #334155;
          line-height: 1.6;
          background: #fbfcfe;
          border-radius: 6px;
          padding: 11px 13px;
          border-left: 3px solid #1b54ff;
        }
        .card__meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .card__awarded {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #dcfce7;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }
        .card__awarded-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .card__edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 12.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          padding: 2px 4px;
        }
        .card__edit-btn:hover {
          color: #1b54ff;
        }
        .card__lock {
          display: inline-flex;
          align-items: center;
          color: #94a3b8;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 6px;
        }
        .form-control {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 13.5px;
          font-family: inherit;
          color: #0f172a;
          outline: none;
          background: white;
          transition:
            border-color 0.15s,
            box-shadow 0.15s;
        }
        .form-control:focus {
          border-color: #1b54ff;
          box-shadow: 0 0 0 3px rgba(27, 84, 255, 0.12);
        }
        .form-textarea {
          resize: vertical;
          min-height: 72px;
          line-height: 1.6;
        }
        .form-row-between {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .form-error-inline {
          margin-top: 6px;
          font-size: 12px;
          color: #dc2626;
        }
        .edit-form__footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .btn-primary {
          background: #1b54ff;
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-primary:hover {
          background: #1645d3;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-ghost {
          background: none;
          border: none;
          color: #64748b;
          padding: 8px 10px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
        }
        .btn-ghost:hover {
          color: #334155;
        }
      `}</style>
    </article>
  );
}

export default KudosCard;
