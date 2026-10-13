'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

import { Markdown } from '@/components/common/Markdown';
import { CloseIcon } from '@/components/icons';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';

import { buildAnswer, SUGGESTED_PROMPTS, type CannedAnswer } from '../ai-search/mocks';
import { AnswerStatus, USUAL_THINKING_MS } from '../ai-search/AnswerStatus';
import { DirectoryResultsCards } from '../ai-search/DirectoryResultsCards';
// The answer prose and card are the AI Search answer's own classes.
import ap from '../ai-search/AnswerPanel.module.scss';
import Composer from '../ai-search-page/Composer';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';

import { EnvelopeGlyph } from '../intro-shared/EnvelopeGlyph';

import { readsAsRequest, TeamRequest } from './TeamRequest';
import s from './HomeAsk.module.scss';

export type AskMode = 'overview' | 'handoff';
/** `box`: the one-line search box. `composer`: the AI Search page's own field. */
export type FieldSize = 'box' | 'composer';
/** LAB-2704: portfolio founders get the PL team door first; other members see AI Search only. */
export type AskViewer = 'founder' | 'member';

const PAGE = '/prototypes/ai-search-page';
/** The overview shows this many directory results; the rest are one press away. */
const OVERVIEW_HITS = 4;

/** Three of AI Search's own prompts, reworded short enough to sit in one line. */
const TRY: { label: string; question: string }[] = [
  { label: 'Filecoin teams in Berlin', question: SUGGESTED_PROMPTS[0].text },
  { label: 'PL members at Lisbon events', question: SUGGESTED_PROMPTS[2].text },
  { label: 'Lumen Storage vs Saturn Grid', question: SUGGESTED_PROMPTS[3].text },
];

/** A founder's line swaps the comparison for the ask the ticket was raised with. */
const TRY_FOUNDER: { label: string; question: string }[] = [
  TRY[0],
  TRY[1],
  { label: 'Intros to climate investors', question: 'Help me get intros to investors in climate tech' },
];

interface Asked extends CannedAnswer {
  question: string;
  status: 'thinking' | 'done';
  /** `request`: the PL team draft answers instead of AI Search. */
  kind: 'answer' | 'request';
}

/**
 * AI Search's field on Home. It reads as a search box — the AI Search mark
 * and name inside it, Enter to ask — not as a chat composer, because a chat
 * box above a feed promises a conversation right here.
 *
 * Two ways it can answer (the review band's switch):
 *  - `overview`: one short answer under the field, Google's AI Overview —
 *    the prose, the first directory results, and "Continue in AI Search",
 *    which carries the answer to /ai-search as a thread you can keep asking in.
 *    Not a chat: there is no follow-up box on Home.
 *  - `handoff`: Enter opens /ai-search with the question already answering;
 *    Back returns here.
 */
export function HomeAsk({
  mode,
  size,
  signedIn,
  viewer = 'member',
}: {
  mode: AskMode;
  size: FieldSize;
  signedIn: boolean;
  viewer?: AskViewer;
}) {
  /* The PL team door is a signed-in founder's: a request needs someone to
     reply to. The placeholder names both jobs, since it is the only thing on
     screen before anyone types. */
  const founder = signedIn && viewer === 'founder';
  const placeholder = founder ? 'Ask AI Search, or send the PL team a request' : 'Ask AI Search about the network';
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  /* The Composer keeps its own "has text" flag; remounting it is how a clear
     reaches that flag. */
  const [composerKey, setComposerKey] = useState(0);
  const [value, setValue] = useState('');
  const [asked, setAsked] = useState<Asked | null>(null);

  /* Switching modes or sizes starts over, so each is judged from rest. */
  useEffect(() => {
    setAsked(null);
    setValue('');
    setComposerKey((k) => k + 1);
  }, [mode, size, founder]);

  /* The overview's wait: the AI Search loader, for the usual thinking time. */
  useEffect(() => {
    if (asked?.status !== 'thinking') return;
    const t = setTimeout(() => setAsked((a) => (a ? { ...a, status: 'done' } : a)), USUAL_THINKING_MS);
    return () => clearTimeout(t);
  }, [asked?.status, asked?.question]);

  const pageUrl = (question: string, answered: boolean) => {
    const params = new URLSearchParams({ q: question });
    if (answered) params.set('answered', '1');
    if (!signedIn) params.set('viewer', 'out');
    return `${PAGE}?${params.toString()}`;
  };

  const ask = (text: string) => {
    const question = text.trim();
    if (!question) return;
    setValue(question);
    /* A founder's request gets the PL team draft in both modes: handing it to
       the AI Search page would answer it with matches, which the request
       doesn't need. */
    if (founder && readsAsRequest(question)) {
      setAsked({ question, status: 'done', kind: 'request', ...buildAnswer(question) });
      return;
    }
    if (mode === 'handoff') {
      router.push(pageUrl(question, false));
      return;
    }
    setAsked({ question, status: 'thinking', kind: 'answer', ...buildAnswer(question) });
  };

  const clear = () => {
    setAsked(null);
    setValue('');
    if (size === 'composer') {
      setComposerKey((k) => k + 1);
      requestAnimationFrame(() => composerRef.current?.focus());
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <section className={s.root} aria-labelledby="home-ask-title">
      {/* The page's headline, in the size Network Updates used to wear; that
          heading steps down to a section title (`homeNewsTitle`) while this
          one leads. The field under it is what the headline invites you to do. */}
      <h1 id="home-ask-title" className={clsx(v0.sectionTitle, s.headline)}>
        Explore the Protocol Labs network
      </h1>

      {size === 'composer' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(value);
          }}
        >
          <Composer
            key={composerKey}
            ref={composerRef}
            size="home"
            rows={1}
            value={value}
            placeholder={placeholder}
            aria-label={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ask(value);
              }
            }}
            onTextSubmit={() => ask(value)}
          />
        </form>
      ) : (
        <form
          className={s.field}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            ask(value);
          }}
        >
          <AiSearchIcon size={20} className={s.mark} />
          <input
            ref={inputRef}
            className={s.input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            enterKeyHint="search"
          />
          {value && (
            <button type="button" className={s.clear} onClick={clear} aria-label="Clear">
              <CloseIcon width={14} height={14} />
            </button>
          )}
          {/* The press for touch, where Enter is not on a keyboard in view.
            Shown once there is something to ask, so at rest the field reads
            as a search box and not as a composer with a send. */}
          {value.trim() && (
            <button type="submit" className={s.submit}>
              Ask
            </button>
          )}
        </form>
      )}

      {!asked && (
        <p className={s.try}>
          <span className={s.tryLabel}>Try</span>
          {(founder ? TRY_FOUNDER : TRY).map((t) => (
            <button key={t.label} type="button" className={s.tryItem} onClick={() => ask(t.question)}>
              {t.label}
            </button>
          ))}
        </p>
      )}

      {asked?.kind === 'request' && (
        <TeamRequest
          key={asked.question}
          request={asked.question}
          onClose={clear}
          onSearchInstead={() => {
            if (mode === 'handoff') {
              router.push(pageUrl(asked.question, false));
              return;
            }
            setAsked({ ...asked, kind: 'answer', status: 'thinking' });
          }}
        />
      )}

      {asked?.kind === 'answer' && (
        <div className={clsx(ap.card, s.overview, s.cornerCard)} aria-live="polite">
          {/* No header: the field above names AI Search, so the card is the
              answer and a ✕ in its corner. */}
          <button
            type="button"
            className={clsx(s.dismiss, s.cornerClose)}
            onClick={clear}
            aria-label="Close the answer"
          >
            <CloseIcon width={16} height={16} />
          </button>

          {asked.status === 'thinking' ? (
            <div className={s.clearOfClose}>
              <AnswerStatus hits={asked.sql} sourceCount={asked.sources.length} />
            </div>
          ) : (
            <>
              <div className={clsx(ap.content, s.prose, s.clearOfClose)}>
                <Markdown>{asked.answer}</Markdown>
              </div>
              {asked.sql.length > 0 && <DirectoryResultsCards hits={asked.sql.slice(0, OVERVIEW_HITS)} />}
              <div className={s.overviewFoot}>
                <a className={s.continue} href={pageUrl(asked.question, true)}>
                  Continue in AI Search
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                {/* What the page gives that Home doesn't — the one thing the
                    button can't say. Signed out there is no history to keep. */}
                <span className={s.footNote}>
                  {signedIn ? 'Ask follow-ups and keep this chat in your history' : 'Ask follow-ups'}
                </span>
                {/* The other direction's door: the answer didn't cover it, so
                    the same text goes to people instead. */}
                {founder && (
                  <button
                    type="button"
                    className={clsx(s.switchDoor, s.footDoor)}
                    onClick={() => setAsked({ ...asked, kind: 'request' })}
                  >
                    <EnvelopeGlyph size={16} />
                    Send to the PL team instead
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
