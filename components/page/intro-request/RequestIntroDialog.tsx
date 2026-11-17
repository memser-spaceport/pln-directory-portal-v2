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

const INTRO_REQUEST_TEXT_MIN_LENGTH = 20;
const INTRO_REQUEST_FIELD_LABEL = 'What do you need help with?';
const INTRO_REQUEST_PLACEHOLDER =
  'For example: We are raising a seed round and want advice from someone who has raised from crypto funds.';
const INTRO_REQUEST_HELP =
  'Be specific. Say what you are looking for (advice, a partnership, business development or fundraising) and why now. This helps us find the right person and make a good intro.';
const INTRO_REQUEST_SHORT_TEXT = 'Add a bit more detail so we can find the right person.';

interface Props {
  type: IntroRequestTargetType;
  targetId: string;
  targetName: string;
  onSent: () => void;
  onClose: () => void;
}

export function RequestIntroDialog({ type, targetId, targetName, onSent, onClose }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const { onAskSubmitted } = useIntroRequestAnalytics();
  const targetType: IntroRequestAnalyticsTargetType = type === 'MEMBER' ? 'member' : 'team';
  const trimmedLength = text.trim().length;
  const showShortText = trimmedLength > 0 && trimmedLength < INTRO_REQUEST_TEXT_MIN_LENGTH;
  const canSend = trimmedLength >= INTRO_REQUEST_TEXT_MIN_LENGTH && !pending;
  const describedBy = [
    'request-intro-help',
    showShortText ? 'request-intro-short' : '',
    error ? 'request-intro-error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = text.trim();
    if (message.length < INTRO_REQUEST_TEXT_MIN_LENGTH || pending) return;
    setPending(true);
    setError(null);
    try {
      await createIntroRequest({ type, targetId, text: message });
      onAskSubmitted(targetType);
      setSent(true);
      onSent();
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
          Request an intro to {targetName}
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
                {INTRO_REQUEST_FIELD_LABEL}
              </label>
              <textarea
                id="request-intro-text"
                className={s.text}
                value={text}
                rows={8}
                maxLength={INTRO_REQUEST_TEXT_MAX_LENGTH}
                placeholder={INTRO_REQUEST_PLACEHOLDER}
                required
                disabled={pending}
                aria-invalid={error || showShortText ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) => setText(event.target.value)}
              />
              <p id="request-intro-help" className={s.help}>
                {INTRO_REQUEST_HELP}
              </p>
              <p className={s.count}>
                {text.length}/{INTRO_REQUEST_TEXT_MAX_LENGTH}
              </p>
              {showShortText && (
                <p id="request-intro-short" className={s.error} role="alert">
                  {INTRO_REQUEST_SHORT_TEXT}
                </p>
              )}
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
