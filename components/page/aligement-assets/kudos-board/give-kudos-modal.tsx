'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';

import { communityKudosSchema, type CommunityKudosFormValues } from '@/schemas/kudos-forms';
import { COMMUNITY_TRACK, communityGiftOptions } from './data/kudos-board.data';
import { useGiveCommunityKudos } from '@/hooks/use-kudos';
import { useKudosAnalytics } from '@/analytics/kudos.analytics';
import type { IUserSummary } from './data/kudos-board.types';

/* ==========================================================================
   GiveCommunityKudosModal (Lite)
   A single form: recipient + points + message. React Hook Form + Zod resolver,
   matching the member-forms/team-forms/project-form conventions.

   The recipient list is passed in (fetched via useRecipients in the parent) —
   never hardcoded. The points dropdown is capped to the user's remaining pool.
   ========================================================================== */

interface IGiveKudosModalProps {
  open: boolean;
  onClose: () => void;
  /** Active members fetched from the backend; excludes the signed-in user. */
  recipients: IUserSummary[];
  /** The signed-in user's remaining community points this round. */
  poolRemaining: number;
}

export function GiveCommunityKudosModal({
  open,
  onClose,
  recipients,
  poolRemaining,
}: IGiveKudosModalProps) {
  const mutation = useGiveCommunityKudos();
  const analytics = useKudosAnalytics();

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommunityKudosFormValues>({
    resolver: zodResolver(communityKudosSchema),
    defaultValues: { recipientId: '', points: undefined as unknown as number, message: '' },
  });

  if (!open) return null;

  const giftOpts = communityGiftOptions(poolRemaining);
  const selectedRecipientId = watch('recipientId');
  const selectedPoints = Number(watch('points')) || 0;
  const selectedRecipient = recipients.find((r) => r.memberId === selectedRecipientId);
  const message = watch('message') ?? '';

  async function onSubmit(values: CommunityKudosFormValues) {
    try {
      await mutation.mutateAsync(values);
      analytics.onCommunityKudosSubmitted({ points: values.points, recipientId: values.recipientId });
      toast.success(
        `Sent ${values.points} community points to @${selectedRecipient?.name ?? 'recipient'}. 🪙`,
      );
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div
      className="overlay"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog" aria-modal="true" aria-labelledby="give-kudos-title"
    >
      <form className="modal" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 id="give-kudos-title" className="modal__title">Give Community Kudos 🪙</h2>
        <p className="modal__subtitle">
          Recognize what they did and why it mattered. The recipient gets the points immediately.
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="recipient">Recipient *</label>
          <select id="recipient" className="form-control" {...register('recipientId')}>
            <option value="">— Select a network contributor —</option>
            {recipients.map((r) => (
              <option key={r.memberId} value={r.memberId}>{r.name}</option>
            ))}
          </select>
          {errors.recipientId && <p className="form-error-inline">{errors.recipientId.message}</p>}
          {selectedRecipient && (
            <div className="mention-preview">
              ✉ @{selectedRecipient.name} will see your kudos and points on the shared board.
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="points">
            Points to give *{' '}
            <span className="form-hint">
              {COMMUNITY_TRACK.increment}-point increments, {COMMUNITY_TRACK.minGift}–{COMMUNITY_TRACK.maxGift}
            </span>
          </label>
          <Controller
            control={control}
            name="points"
            render={({ field }) => (
              <select
                id="points"
                className="form-control"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
              >
                {giftOpts.length === 0 ? (
                  <option value="" disabled>No points left in your pool this round</option>
                ) : (
                  <>
                    <option value="">— Select an amount —</option>
                    {giftOpts.map((v) => (<option key={v} value={v}>{v} points</option>))}
                  </>
                )}
              </select>
            )}
          />
          {errors.points && <p className="form-error-inline">{errors.points.message}</p>}
          <div className="pool-summary">
            <span>Pool before this gift: <strong>{poolRemaining} pts</strong></span>
            <span>After this gift: <strong>{Math.max(0, poolRemaining - selectedPoints)} pts</strong></span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="message">Your message *</label>
          <textarea
            id="message"
            className="form-control form-textarea"
            maxLength={400}
            placeholder="Recognize what they did and why it mattered. Be specific — great kudos are detailed!"
            {...register('message')}
          />
          <div className="char-count">{message.length} / 400</div>
          {errors.message && <p className="form-error-inline">{errors.message.message}</p>}
        </div>

        <div className="modal__footer">
          <button type="button" className="btn-ghost" onClick={handleClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send Community Kudos'}
          </button>
        </div>

        <style jsx>{`
          .overlay {
            position: fixed; inset: 0; background: rgba(15,23,42,0.45);
            display: flex; align-items: center; justify-content: center; z-index: 1000;
          }
          .modal {
            background: white; border-radius: 10px;
            width: 540px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
            padding: 30px 32px;
            box-shadow: 0 8px 40px rgba(27,84,255,0.12), 0 2px 8px rgba(0,0,0,0.08);
          }
          .modal__title { font-size: 22px; font-weight: 600; margin-bottom: 6px; letter-spacing: -0.02em; color: #0F172A; }
          .modal__subtitle { font-size: 14px; color: #64748B; margin-bottom: 22px; line-height: 1.5; }
          .form-group { margin-bottom: 18px; }
          .form-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; letter-spacing: -0.005em; }
          .form-hint { font-weight: 400; color: #94A3B8; font-size: 12px; margin-left: 6px; }
          .form-control {
            width: 100%; border: 1.5px solid #E2E8F0; border-radius: 6px;
            padding: 9px 12px; font-size: 14px; font-family: inherit; color: #0F172A;
            outline: none; transition: border-color 0.15s, box-shadow 0.15s; background: white;
          }
          .form-control:focus { border-color: #1B54FF; box-shadow: 0 0 0 3px rgba(27,84,255,0.12); }
          .form-textarea { resize: vertical; min-height: 96px; line-height: 1.6; }
          .form-error-inline { margin-top: 6px; font-size: 12.5px; color: #DC2626; }
          .mention-preview {
            background: #DFE6FB; border: 1px solid #87A6FD; border-radius: 6px;
            padding: 8px 12px; margin-top: 8px; font-size: 13px; color: #1036A8;
          }
          .pool-summary {
            display: flex; justify-content: space-between; align-items: center;
            font-size: 12.5px; color: #64748B; margin-top: 8px;
            background: #DFE6FB; border: 1px solid #87A6FD; border-radius: 6px; padding: 8px 12px;
          }
          .pool-summary :global(strong) { color: #1036A8; font-variant-numeric: tabular-nums; }
          .char-count { text-align: right; font-size: 11.5px; color: #94A3B8; margin-top: 4px; }
          .modal__footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
          .btn-primary {
            background: #1B54FF; color: white; border: none;
            padding: 9px 20px; border-radius: 6px; font-family: inherit;
            font-size: 14px; font-weight: 600; cursor: pointer;
          }
          .btn-primary:hover { background: #1645D3; }
          .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-ghost {
            background: none; border: 1.5px solid #E2E8F0; color: #334155;
            padding: 9px 18px; border-radius: 8px;
            font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: inherit;
          }
          .btn-ghost:hover { background: #F8FAFC; border-color: #CBD5E1; }
        `}</style>
      </form>
    </div>
  );
}

export default GiveCommunityKudosModal;
