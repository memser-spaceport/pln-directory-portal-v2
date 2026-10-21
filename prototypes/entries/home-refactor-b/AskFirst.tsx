'use client';

import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

import { CloseIcon } from '@/components/icons';

import { buildAnswer, type CannedAnswer } from '../ai-search/mocks';
import { USUAL_THINKING_MS } from '../ai-search/AnswerStatus';
import ap from '../ai-search/AnswerPanel.module.scss';
import { AnswerProse } from '../ai-mode-results/proposed/AnswerProse';
import { AnswerShapes } from '../ai-mode-results/proposed/AnswerShapes';
import { EntityList } from '../ai-mode-results/proposed/EntityList';
import { SourcesButton } from '../ai-mode-results/proposed/SourcesButton';
import { ThinkingStatus } from '../ai-mode-results/proposed/ThinkingStatus';
import { sourceRefsFor, withCitations } from '../ai-mode-results/proposed/entities';
import Composer from '../ai-search-page/Composer';
import type { AskMode } from '../home-ai-ask/HomeAsk';
import homeAsk from '../home-ai-ask/HomeAsk.module.scss';

import { KindGlyph } from './KindGlyph';
import { KIND_LABEL, PROMPTS, SCOPES, type AskScope } from './mocks';
import s from './HomeRefactorB.module.scss';

/** The updated AI Search page — the same door A's field and the navbar open. */
const PAGE = '/prototypes/ai-mode-results';

interface Asked extends CannedAnswer {
  question: string;
  status: 'thinking' | 'done';
}

/**
 * The composer, its scope chips and the "Start with a question" cards.
 *
 * The answer is A's: the same canned answer (`buildAnswer`), the same proposed
 * answer pieces (ai-mode-results), the same "Continue in AI Search" foot, in
 * HomeAsk's own classes. What is new is around the field: a scope you pick
 * inside it (Higgsfield's mode selector), and prompt cards built from this
 * week's content (Obvious / Descript's "Start with an idea").
 *
 * HomeAsk itself can't be imported for this: it owns its headline, its Try
 * line and its value, so a prompt card can't fill it. The answer block below
 * is its overview branch, transcribed without the founder request door.
 */
export const AskFirst = forwardRef<HTMLDivElement, { mode: AskMode; signedIn: boolean }>(function AskFirst(
  { mode, signedIn },
  fieldWrapRef,
) {
  const router = useRouter();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [composerKey, setComposerKey] = useState(0);
  const [value, setValue] = useState('');
  const [scope, setScope] = useState<AskScope>('anything');
  const [asked, setAsked] = useState<Asked | null>(null);
  const refs = useMemo(() => sourceRefsFor(asked?.sources ?? []), [asked?.sources]);

  const scopeDef = SCOPES.find((x) => x.value === scope)!;

  /* Switching the review band's mode starts over, as in A. */
  useEffect(() => {
    setAsked(null);
    setValue('');
    setComposerKey((k) => k + 1);
  }, [mode]);

  useEffect(() => {
    if (asked?.status !== 'thinking') return;
    const t = setTimeout(() => setAsked((a) => (a ? { ...a, status: 'done' } : a)), USUAL_THINKING_MS);
    return () => clearTimeout(t);
  }, [asked?.status, asked?.question]);

  const pageUrl = (question: string, answered: boolean) => {
    const params = new URLSearchParams({ q: question });
    if (answered) params.set('answered', '1');
    if (!signedIn) params.set('viewer', 'out');
    /* The page has no scope param today; carried so the hand-off could read it. */
    if (scope !== 'anything') params.set('scope', scope);
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
    setComposerKey((k) => k + 1);
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  return (
    <div className={s.ask}>
      <div ref={fieldWrapRef} className={s.fieldWrap}>
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
            rows={2}
            value={value}
            placeholder={scopeDef.placeholder}
            aria-label={`Ask AI Search: ${scopeDef.placeholder}`}
            className={s.composer}
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

        {/* The scope, inside the field's bottom band (the Composer leaves 56px
            of padding there for its send). Control chips: brand when on. */}
        <div className={s.scopes} role="radiogroup" aria-label="What to ask about">
          {SCOPES.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={scope === o.value}
              className={clsx(s.scopeChip, scope === o.value && s.scopeChipOn)}
              onClick={() => {
                setScope(o.value);
                composerRef.current?.focus();
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {asked && (
        <div className={clsx(ap.card, homeAsk.overview, homeAsk.cornerCard)} aria-live="polite">
          <button
            type="button"
            className={clsx(homeAsk.dismiss, homeAsk.cornerClose)}
            onClick={clear}
            aria-label="Close the answer"
          >
            <CloseIcon width={16} height={16} />
          </button>

          {asked.status === 'thinking' ? (
            <div className={homeAsk.clearOfClose}>
              <ThinkingStatus hits={asked.sql} sourceCount={asked.sources.length} />
            </div>
          ) : (
            <>
              <div className={clsx(homeAsk.prose, homeAsk.clearOfClose)}>
                <AnswerProse markdown={withCitations(asked.answer, refs)} refs={refs} streaming={false} />
              </div>
              {asked.blocks && asked.blocks.length > 0 && <AnswerShapes blocks={asked.blocks} />}
              {asked.sql.length > 0 && <EntityList hits={asked.sql} />}
              <div>
                <SourcesButton refs={refs} />
              </div>
              <div className={homeAsk.overviewFoot}>
                <a className={homeAsk.continue} href={pageUrl(asked.question, true)}>
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
                <span className={homeAsk.footNote}>
                  {signedIn ? 'Ask follow-ups and keep this chat in your history' : 'Ask follow-ups'}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {!asked && (
        <section className={s.prompts} aria-labelledby="hrb-prompts-title">
          <h2 id="hrb-prompts-title" className={s.smallHead}>
            Start with a question
          </h2>
          <ul className={s.promptRow}>
            {PROMPTS[scope].map((p) => (
              <li key={p.question} className={s.promptItem}>
                <button type="button" className={s.promptCard} onClick={() => ask(p.question)}>
                  <span className={s.promptKind}>
                    <KindGlyph kind={p.kind} />
                    {KIND_LABEL[p.kind]}
                  </span>
                  <span className={s.promptQuestion}>{p.question}</span>
                  <span className={s.promptFrom}>{p.from}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
});
