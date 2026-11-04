'use client';

import { FormEvent, useState } from 'react';

import { useIntroRequestAnalytics, type IntroRequestAnalyticsTargetType } from '@/analytics/intro-requests.analytics';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import {
  createIntroRequest,
  INTRO_REQUEST_RECEIVED_MESSAGE,
  INTRO_REQUEST_TEXT_MAX_LENGTH,
  IntroRequestError,
  type IntroRequestTargetType,
} from '@/services/intro-requests/intro-requests.service';

import s from './RequestIntroDialog.module.scss';

interface Props {
  type: IntroRequestTargetType;
  targetId: string;
  targetName: string;
  onClose: () => void;
}

export function RequestIntroDialog({ type, targetId, targetName, onClose }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const { onAskSubmitted } = useIntroRequestAnalytics();
  const targetType: IntroRequestAnalyticsTargetType = type === 'MEMBER' ? 'member' : 'team';
  const canSend = text.trim().length > 0 && !pending;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || pending) return;
    setPending(true);
    setError(null);
    try {
      await createIntroRequest({ type, targetId, text: message });
      onAskSubmitted(targetType);
      setSent(true);
    } catch (sendError) {
      const fallback = 'The request could not be sent. Try again.';
      setError(sendError instanceof IntroRequestError ? sendError.message : fallback);
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      closeOnBackdropClick={false}
      lockScroll
      inertBackground
      ariaLabelledBy="request-intro-title"
      className={s.shell}
    >
      <div className={s.card}>
        <button type="button" className={s.close} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        <h2 id="request-intro-title" className={s.title}>
          Request intro to {targetName}
        </h2>
        {sent ? (
          <p className={s.received} role="status">
            {INTRO_REQUEST_RECEIVED_MESSAGE}
          </p>
        ) : (
          <>
            <p className={s.description}>{descriptionFor(type, targetName)}</p>
            <form className={s.form} onSubmit={onSubmit}>
              <label className={s.label} htmlFor="request-intro-text">
                Why would you like an intro?
              </label>
              <textarea
                id="request-intro-text"
                className={s.text}
                value={text}
                rows={8}
                maxLength={INTRO_REQUEST_TEXT_MAX_LENGTH}
                required
                disabled={pending}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'request-intro-error' : undefined}
                onChange={(event) => setText(event.target.value)}
              />
              <p className={s.count}>
                {text.length}/{INTRO_REQUEST_TEXT_MAX_LENGTH}
              </p>
              {error && (
                <p id="request-intro-error" className={s.error} role="alert">
                  {error}
                </p>
              )}
              <div className={s.actions}>
                <Button style="border" variant="primary" onClick={onClose} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" style="fill" variant="primary" disabled={!canSend}>
                  {pending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

function descriptionFor(type: IntroRequestTargetType, targetName: string): string {
  if (type === 'TEAM') {
    return `Your request goes to the PL team. They choose the right person at ${targetName} and make the intro.`;
  }
  const first = targetName.trim().split(/\s+/)[0] || targetName;
  return `Your request goes to the PL team, who makes the intro. ${first} is not contacted until then.`;
}
