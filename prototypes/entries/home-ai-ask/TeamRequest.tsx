'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';

import ap from '../ai-search/AnswerPanel.module.scss';

import s from './HomeAsk.module.scss';

/** The intro modal's own cap on a message (intro-shared/RequestIntroModal). */
const REQUEST_MAX = 1000;

/**
 * Text that reads as an ask for the PL team's help rather than a question
 * about the directory. A guess, so it only picks which card answers first;
 * both cards carry a labelled door to the other one.
 */
const REQUEST_RE =
  /\b(help (me|us)|intros?|introduc\w*|connect (me|us)|put me in touch|looking for|we need|i need|we'?re raising|can (you|the pl team)|could (you|the pl team))\b/i;

export function readsAsRequest(text: string) {
  return REQUEST_RE.test(text);
}

/** The founder the prototype signs in as — a portfolio team lead. */
export const MOCK_FOUNDER = {
  name: 'Maya Chen',
  email: 'maya@latticecompute.xyz',
  team: 'Lattice Compute',
};

interface Props {
  request: string;
  onClose: () => void;
  /** Back to AI Search's answer for the same text. */
  onSearchInstead: () => void;
}

/**
 * LAB-2704 — a founder's general ask for the PL team, dropped into the same
 * field as a search. No matches, no AI answer: the request is the product, and
 * the confirmation is what the founder gets back.
 *
 * The draft is the typed text, editable, because the field's one line is
 * rarely the whole ask. Its one sentence says the two things the card can't
 * show: what travels with the request (so the PL team can act without writing
 * back to ask who you are) and where the reply comes. The sent state replaces
 * the draft in place: the request quoted back and the address the reply goes to.
 */
export function TeamRequest({ request, onClose, onSearchInstead }: Props) {
  const [sent, setSent] = useState<string | null>(null);
  const methods = useForm<{ request: string }>({ defaultValues: { request } });
  const text = useWatch({ control: methods.control, name: 'request' }) ?? '';

  return (
    <div className={clsx(ap.card, s.overview, s.cornerCard)} aria-live="polite">
      {/* No header, like the answer card: the title already names the PL team. */}
      <button type="button" className={clsx(s.dismiss, s.cornerClose)} onClick={onClose} aria-label="Close the request">
        <CloseIcon width={16} height={16} />
      </button>

      {sent ? (
        <div className={s.sent}>
          <h2 className={clsx(s.requestTitle, s.clearOfClose)}>
            <CheckGlyph />
            The PL team has your request
          </h2>
          <blockquote className={s.sentQuote}>{sent}</blockquote>
          <p className={s.requestNote}>They’ll reply to {MOCK_FOUNDER.email}.</p>
        </div>
      ) : (
        <FormProvider {...methods}>
          <form className={s.requestForm} onSubmit={methods.handleSubmit((d) => setSent(d.request.trim()))}>
            <div className={clsx(s.requestHead, s.clearOfClose)}>
              <h2 className={s.requestTitle}>Send this to the PL team</h2>
              <p className={s.requestNote}>
                Sent with your profile and {MOCK_FOUNDER.team}’s. They’ll reply to {MOCK_FOUNDER.email}.
              </p>
            </div>
            <FormTextArea
              name="request"
              label="Your request"
              placeholder="What you need, and anything that helps the PL team act on it"
              isRequired
              rows={4}
              maxLength={REQUEST_MAX}
              showCharCount
            />
            <div className={s.requestFoot}>
              <Button type="submit" style="fill" variant="primary" size="s" disabled={!text.trim()}>
                Send to PL team
              </Button>
              <button type="button" className={s.switchDoor} onClick={onSearchInstead}>
                Search the network instead
              </button>
            </div>
          </form>
        </FormProvider>
      )}
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={s.sentCheck}>
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
