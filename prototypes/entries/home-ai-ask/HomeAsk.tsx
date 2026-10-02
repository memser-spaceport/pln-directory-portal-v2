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

import s from './HomeAsk.module.scss';

export type AskMode = 'overview' | 'handoff';

const PAGE = '/prototypes/ai-search-page';
/** The overview shows this many directory results; the rest are one press away. */
const OVERVIEW_HITS = 4;

/** Three of AI Search's own prompts, reworded short enough to sit in one line. */
const TRY: { label: string; question: string }[] = [
  { label: 'Filecoin teams in Berlin', question: SUGGESTED_PROMPTS[0].text },
  { label: 'PL members at Lisbon events', question: SUGGESTED_PROMPTS[2].text },
  { label: 'Lumen Storage vs Saturn Grid', question: SUGGESTED_PROMPTS[3].text },
];

interface Asked extends CannedAnswer {
  question: string;
  status: 'thinking' | 'done';
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
export function HomeAsk({ mode, signedIn }: { mode: AskMode; signedIn: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [asked, setAsked] = useState<Asked | null>(null);

  /* Switching modes starts over, so each is judged from rest. */
  useEffect(() => setAsked(null), [mode]);

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
    if (mode === 'handoff') {
      router.push(pageUrl(question, false));
      return;
    }
    setAsked({ question, status: 'thinking', ...buildAnswer(question) });
  };

  const clear = () => {
    setAsked(null);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <section className={s.root} aria-label="Ask AI Search">
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
          placeholder="Ask AI Search about the network"
          aria-label="Ask AI Search about the network"
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

      {!asked && (
        <p className={s.try}>
          <span className={s.tryLabel}>Try</span>
          {TRY.map((t) => (
            <button key={t.label} type="button" className={s.tryItem} onClick={() => ask(t.question)}>
              {t.label}
            </button>
          ))}
        </p>
      )}

      {asked && (
        <div className={clsx(ap.card, s.overview)} aria-live="polite">
          <div className={s.overviewHead}>
            <span className={s.overviewName}>
              <AiSearchIcon size={16} />
              AI Search
            </span>
            <button type="button" className={s.dismiss} onClick={clear} aria-label="Close the answer">
              <CloseIcon width={16} height={16} />
            </button>
          </div>

          {asked.status === 'thinking' ? (
            <AnswerStatus hits={asked.sql} sourceCount={asked.sources.length} />
          ) : (
            <>
              <div className={clsx(ap.content, s.prose)}>
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
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
