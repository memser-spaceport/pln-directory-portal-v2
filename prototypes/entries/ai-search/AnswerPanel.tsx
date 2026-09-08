'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { Markdown } from '@/components/common/Markdown';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/ui/Tag';
import InfoBox from '@/components/ui/info-box';
import { PopoverDp } from '@/components/core/popover-dp';
import HuskySourceCard from '@/components/core/husky/husky-source-card';
import HuskyAnswerLoader from '@/components/core/husky/husky-answer-loader';
import FollowupQuestions from '@/components/page/husky/followup-questions';
import DirectoryResults from '@/components/page/husky/directory-results';
import ChatInput from '@/components/page/husky/chat-input';
import { ArrowUpRightIcon, ThumbsUpOutlinedIcon } from '@/components/icons';

import btn from '@/components/common/Button/Button.module.scss';

import { buildAnswer, FEEDBACK_REASONS, type CannedAnswer } from './mocks';
import s from './AnswerPanel.module.scss';

export type TurnStatus = 'thinking' | 'streaming' | 'done';
export type FeedbackState = 'none' | 'up' | 'down' | 'sent';

export interface Turn extends CannedAnswer {
  id: number;
  question: string;
  /** What has streamed so far; `answer` is the whole thing. */
  shown: string;
  status: TurnStatus;
  feedback: FeedbackState;
}

let nextId = 1;

export function makeTurn(question: string): Turn {
  return {
    id: nextId++,
    question,
    shown: '',
    status: 'thinking',
    feedback: 'none',
    ...buildAnswer(question),
  };
}

interface AnswerPanelProps {
  turns: Turn[];
  onTurnsChange: (next: Turn[] | ((prev: Turn[]) => Turn[])) => void;
  onAsk: (question: string) => void;
  /** Present when the person arrived from a keyword result list. */
  onBackToResults?: () => void;
}

/**
 * The AI half of the search dialog, as a **state** of the same dialog rather
 * than a second column beside the keyword list.
 *
 * Copy-simplify of production's `AiChatPanel` (components/core/application-search)
 * and the Husky page's `Messages` → `PreviewMessage` → `ChatMessageActions`.
 * The answer anatomy is production's, imported: `InfoBox` + `HuskySourceCard`
 * for sources, `DirectoryResults` for "Results from the directory",
 * `FollowupQuestions`, `HuskyAnswerLoader`, `ChatInput`, `Markdown`. What is
 * transcribed rather than imported is `PreviewMessage`'s card (its styles are
 * styled-jsx, so the values are copied into AnswerPanel.module.scss verbatim)
 * and the actions row, which this prototype changes on purpose:
 *
 * - Feedback is an inline thumbs pair in the actions row, and a thumbs-down
 *   opens a reason panel *under the answer* — the pattern every reference
 *   answer surface uses (Reddit Answers, Bard, Mistral). Production's 1–5
 *   rating in a `<dialog>` needs three presses to say "this was wrong"; a
 *   survey collects ratings, not signals. Deviation from production, on purpose.
 * - "Share entire thread" is dropped: a thread that exists only inside a
 *   search dialog has no permalink to share. It comes back with `Continue in
 *   Husky`, which is where a thread gets a URL.
 *
 * Streaming is simulated (words revealed on a timer) so the loader, the stop
 * button and the disabled follow-ups all get exercised.
 */
export function AnswerPanel({ turns, onTurnsChange, onAsk, onBackToResults }: AnswerPanelProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const last = turns[turns.length - 1];
  const busy = !!last && last.status !== 'done';

  /* Simulated stream. `thinking` shows the skeleton for a beat, then words
     arrive in small bursts until the whole answer is on screen. */
  useEffect(() => {
    if (!last || last.status === 'done') return;
    const id = last.id;

    if (last.status === 'thinking') {
      const t = setTimeout(() => {
        onTurnsChange((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'streaming' } : x)));
      }, 700);
      return () => clearTimeout(t);
    }

    const words = last.answer.split(' ');
    const shownWords = last.shown ? last.shown.split(' ').length : 0;
    if (shownWords >= words.length) {
      onTurnsChange((prev) => prev.map((x) => (x.id === id ? { ...x, shown: x.answer, status: 'done' } : x)));
      return;
    }
    const t = setTimeout(() => {
      const next = words.slice(0, shownWords + 3).join(' ');
      onTurnsChange((prev) => prev.map((x) => (x.id === id ? { ...x, shown: next } : x)));
    }, 45);
    return () => clearTimeout(t);
  }, [last, onTurnsChange]);

  /* Keep the newest turn in view as it grows. */
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [turns.length, last?.status]);

  const stop = () => {
    if (!last) return;
    onTurnsChange((prev) => prev.map((x) => (x.id === last.id ? { ...x, status: 'done' } : x)));
  };

  const submit = () => {
    const value = inputRef.current?.value.trim();
    if (!value || busy) return;
    onAsk(value);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 1024) {
      e.preventDefault();
      submit();
    }
  };

  const regenerate = (turn: Turn) => {
    if (busy) return;
    onTurnsChange((prev) =>
      prev.map((x) => (x.id === turn.id ? { ...x, shown: '', status: 'thinking', feedback: 'none' } : x)),
    );
  };

  const editQuestion = (turn: Turn) => {
    if (!inputRef.current) return;
    inputRef.current.value = turn.question;
    inputRef.current.focus();
  };

  const setFeedback = (turn: Turn, feedback: FeedbackState) => {
    onTurnsChange((prev) => prev.map((x) => (x.id === turn.id ? { ...x, feedback } : x)));
  };

  return (
    <div className={s.root}>
      {/* One bar, two exits. Back returns the list this answer was reached from;
          Continue names the destination (the Husky page) rather than the
          mechanism ("open full page"). Databricks' palette ends the same way. */}
      <div className={s.bar}>
        {onBackToResults ? (
          <Button style="link" variant="neutral" size="xs" onClick={onBackToResults}>
            ← Back to results
          </Button>
        ) : (
          <span />
        )}
        <a href="/husky/chat" className={clsx(btn.root, btn.link, btn.primary, btn.xs, s.continueLink)}>
          Continue in Husky
          <ArrowUpRightIcon />
        </a>
      </div>

      <div className={s.messages}>
        {turns.map((turn, i) => (
          <Message
            key={turn.id}
            turn={turn}
            isLast={i === turns.length - 1}
            busy={busy}
            onFollowup={onAsk}
            onRegenerate={() => regenerate(turn)}
            onEdit={() => editQuestion(turn)}
            onFeedback={(f) => setFeedback(turn, f)}
          />
        ))}
        <div ref={endRef} />
      </div>

      <form className={s.inputWrap} onSubmit={(e) => e.preventDefault()}>
        <ChatInput
          ref={inputRef}
          placeholder="Go ahead, ask anything!"
          rows={1}
          onKeyDown={handleKeyDown}
          onTextSubmit={submit}
          onStopStreaming={stop}
          isAnswerLoading={last?.status === 'thinking'}
          isLoadingObject={last?.status === 'streaming'}
        />
      </form>
    </div>
  );
}

interface MessageProps {
  turn: Turn;
  isLast: boolean;
  busy: boolean;
  onFollowup: (q: string) => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onFeedback: (f: FeedbackState) => void;
}

function Message({ turn, isLast, busy, onFollowup, onRegenerate, onEdit, onFeedback }: MessageProps) {
  const streaming = turn.status === 'streaming';

  return (
    <div className={s.message}>
      <h2 className={s.question}>{turn.question}</h2>

      {turn.status === 'thinking' ? (
        <HuskyAnswerLoader />
      ) : (
        <div className={s.card}>
          {turn.sources.length > 0 && !streaming && (
            <div className={s.sourcesRow}>
              <PopoverDp.Wrapper>
                <InfoBox info={`${turn.sources.length} source(s)`} imgUrl="/icons/globe-blue.svg" />
                <PopoverDp.Pane position="bottom">
                  <HuskySourceCard sources={turn.sources as any} />
                </PopoverDp.Pane>
              </PopoverDp.Wrapper>
            </div>
          )}

          <div className={s.content}>
            <Markdown>{turn.shown}</Markdown>
          </div>

          {!streaming && turn.sql.length > 0 && <DirectoryResults actions={turn.sql} />}

          {!streaming && turn.followUpQuestions.length > 0 && (
            <FollowupQuestions
              followupQuestions={turn.followUpQuestions}
              onFollowupClicked={onFollowup}
              isAnswerLoading={busy}
              isLoadingObject={busy}
            />
          )}

          {!streaming && (
            <Actions
              turn={turn}
              isLast={isLast}
              busy={busy}
              onRegenerate={onRegenerate}
              onEdit={onEdit}
              onFeedback={onFeedback}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ActionsProps {
  turn: Turn;
  isLast: boolean;
  busy: boolean;
  onRegenerate: () => void;
  onEdit: () => void;
  onFeedback: (f: FeedbackState) => void;
}

/**
 * Production's `ChatMessageActions` row (16px gap, `<img>` glyphs from
 * /icons) with the feedback glyph replaced by a thumbs pair.
 *
 * The thumbs are the DS `ThumbsUpOutlinedIcon`, stroked and `currentColor`,
 * so tone lives in CSS like every other DS glyph; the down glyph is the same
 * icon rotated — there is no thumbs-down in components/icons, and a rotated
 * thumbs-up is what every product draws for it.
 */
function Actions({ turn, isLast, busy, onRegenerate, onEdit, onFeedback }: ActionsProps) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const whyRef = useRef<HTMLDivElement>(null);

  /* The panel opens under an actions row that is usually at the bottom of the
     scroll; bring it into view so a press is answered by something visible. */
  useEffect(() => {
    if (turn.feedback === 'down') whyRef.current?.scrollIntoView({ block: 'nearest' });
  }, [turn.feedback]);

  const toggleReason = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const copy = () => navigator.clipboard?.writeText(turn.answer);

  return (
    <>
      <div className={clsx(s.actions, busy && s.actionsBusy)}>
        <div className={s.actionsRow}>
          {isLast && (
            <button type="button" className={s.iconBtn} title="Regenerate response" onClick={onRegenerate}>
              <img src="/icons/refresh-circle.svg" alt="" />
            </button>
          )}
          {isLast && (
            <button type="button" className={s.iconBtn} title="Edit question" onClick={onEdit}>
              <img src="/icons/edit-chat.svg" alt="" />
            </button>
          )}
          <button type="button" className={s.iconBtn} title="Copy response" onClick={copy}>
            <img src="/icons/copy.svg" alt="" className={s.copyGlyph} />
          </button>

          <span className={s.thumbs}>
            <button
              type="button"
              className={clsx(s.thumb, turn.feedback === 'up' && s.thumbOn)}
              title="Good answer"
              aria-label="Good answer"
              aria-pressed={turn.feedback === 'up'}
              onClick={() => onFeedback(turn.feedback === 'up' ? 'none' : 'up')}
            >
              <ThumbsUpOutlinedIcon />
            </button>
            <button
              type="button"
              className={clsx(
                s.thumb,
                s.thumbDown,
                (turn.feedback === 'down' || turn.feedback === 'sent') && s.thumbOn,
              )}
              title="Not helpful"
              aria-label="Not helpful"
              aria-pressed={turn.feedback === 'down' || turn.feedback === 'sent'}
              onClick={() => onFeedback(turn.feedback === 'down' ? 'none' : 'down')}
            >
              <ThumbsUpOutlinedIcon />
            </button>
          </span>

          {/* Receipt for the one-press path. Production's dialog says
              "Thanks for your response" on success; same words, no dialog. */}
          {(turn.feedback === 'up' || turn.feedback === 'sent') && (
            <span className={s.receipt} role="status">
              Thanks for your response
            </span>
          )}
        </div>
      </div>

      {/* The "why" only after a thumbs-down, only for this answer, and never
          required — the press already counted. Chips are the DS control
          `Tag` (secondary/selected), the same chip the filter rails use. */}
      {turn.feedback === 'down' && (
        <div className={s.why} ref={whyRef}>
          <div className={s.whyHead}>
            <span className={s.whyTitle}>What was wrong?</span>
            <button type="button" className={s.whyClose} aria-label="Close" onClick={() => onFeedback('sent')}>
              Skip
            </button>
          </div>
          <div className={s.whyChips}>
            {FEEDBACK_REASONS.map((r) => (
              <Tag
                key={r}
                value={r}
                variant="secondary"
                selected={reasons.includes(r)}
                callback={() => toggleReason(r)}
                tagsLength={1}
              />
            ))}
          </div>
          <textarea
            className={s.whyComment}
            rows={2}
            placeholder="Anything else? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className={s.whyFooter}>
            <Button size="xs" onClick={() => onFeedback('sent')}>
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
