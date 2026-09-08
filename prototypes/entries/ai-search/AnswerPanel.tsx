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
import ChatInput from '@/components/page/husky/chat-input';
import { ArrowUpRightIcon, NotePencilIcon, ThumbsUpOutlinedIcon } from '@/components/icons';

import btn from '@/components/common/Button/Button.module.scss';

import { buildAnswer, FEEDBACK_REASONS, type CannedAnswer } from './mocks';
import { DirectoryResultsCards } from './DirectoryResultsCards';
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
  /** Present when the person arrived from a list they can go back to. */
  onBackToResults?: () => void;
  /** What that list was — "results" by default; the full history names itself. */
  backLabel?: string;
}

/**
 * The AI half of the search dialog, as a **state** of the same dialog rather
 * than a second column beside the keyword list.
 *
 * Copy-simplify of production's `AiChatPanel` (components/core/application-search)
 * and the Husky page's `Messages` → `PreviewMessage` → `ChatMessageActions`.
 * The answer anatomy is production's, imported: `InfoBox` + `HuskySourceCard`
 * for sources, the local `DirectoryResultsCards` for "Results from the
 * directory" (production's `DirectoryResults` redrawn — see that file),
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
 *   AI Search` (the Husky page, named as the product names the feature),
 *   which is where a thread gets a URL.
 *
 * Streaming is simulated (words revealed on a timer) so the loader, the stop
 * button and the disabled follow-ups all get exercised.
 */
export function AnswerPanel({
  turns,
  onTurnsChange,
  onAsk,
  onBackToResults,
  backLabel = 'Back to results',
}: AnswerPanelProps) {
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
          Continue names the destination (the full AI Search page — Husky in
          code, "AI Search" to a person) rather than the mechanism ("open full page"). Databricks' palette ends the same way. */}
      <div className={s.bar}>
        {onBackToResults ? (
          <Button style="link" variant="neutral" size="xs" onClick={onBackToResults}>
            ← {backLabel}
          </Button>
        ) : (
          <span />
        )}
        <a href="/husky/chat" className={clsx(btn.root, btn.link, btn.primary, btn.xs, s.continueLink)}>
          Continue in AI Search
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

          {!streaming && turn.sql.length > 0 && <DirectoryResultsCards hits={turn.sql} />}

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
 * Production's `ChatMessageActions` row (16px gap) with the feedback glyph
 * replaced by a thumbs pair — and every glyph on one scale.
 *
 * Production draws its three actions as 18px image files with `#64748B`
 * baked in, in bare buttons; the thumbs came in as 16px DS icons taking the
 * tertiary token, in a 24px hover disc. Five marks, two sizes, two greys, two
 * hit areas: "make these icons look similar". The thumbs were the member
 * already on-token, so the other three came to them (lesson 8): all five are
 * 16px `currentColor` glyphs in the same `.iconBtn` disc. Edit is the DS
 * `NotePencilIcon` — the same square-and-pencil drawing as production's
 * edit-chat.svg. Refresh and copy have no DS icon, so their production
 * paths are transcribed below with the fill handed back to `currentColor`.
 *
 * The thumbs are the DS `ThumbsUpOutlinedIcon`; the down glyph is the same
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
            <button
              type="button"
              className={s.iconBtn}
              title="Regenerate response"
              aria-label="Regenerate response"
              onClick={onRegenerate}
            >
              <RefreshCircleIcon />
            </button>
          )}
          {isLast && (
            <button
              type="button"
              className={s.iconBtn}
              title="Edit question"
              aria-label="Edit question"
              onClick={onEdit}
            >
              <NotePencilIcon width={16} height={16} />
            </button>
          )}
          <button type="button" className={s.iconBtn} title="Copy response" aria-label="Copy response" onClick={copy}>
            <CopyIcon />
          </button>

          <span className={s.thumbs}>
            <button
              type="button"
              className={clsx(s.iconBtn, turn.feedback === 'up' && s.thumbOn)}
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
                s.iconBtn,
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

/* ------------------------------------------------------------------------ */
/* Glyphs production only has as image files                                  */
/* ------------------------------------------------------------------------ */

/** public/icons/refresh-circle.svg, fill handed to `currentColor`, drawn at 16. */
function RefreshCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.99922 2.17422C5.22988 2.17422 2.17422 5.22988 2.17422 8.99922C2.17422 12.7686 5.22988 15.8242 8.99922 15.8242C12.7686 15.8242 15.8242 12.7686 15.8242 8.99922C15.8242 5.22988 12.7686 2.17422 8.99922 2.17422ZM0.824219 8.99922C0.824219 4.48429 4.48429 0.824219 8.99922 0.824219C13.5141 0.824219 17.1742 4.48429 17.1742 8.99922C17.1742 13.5141 13.5141 17.1742 8.99922 17.1742C4.48429 17.1742 0.824219 13.5141 0.824219 8.99922ZM12.5906 8.83364C12.9596 8.88689 13.2155 9.22917 13.1623 9.59814C13.0384 10.4564 12.6563 11.3068 11.9815 11.9815L11.9802 11.9828C10.4952 13.4598 8.18499 13.6091 6.53909 12.4256V12.8842C6.53909 13.257 6.23688 13.5592 5.86409 13.5592C5.49129 13.5592 5.18909 13.257 5.18909 12.8842V10.8817C5.18909 10.5089 5.49129 10.2067 5.86409 10.2067H5.99602C6.00271 10.2066 6.0094 10.2066 6.01609 10.2067H7.86657C8.23937 10.2067 8.54157 10.5089 8.54157 10.8817C8.54157 11.2545 8.23937 11.5567 7.86657 11.5567H7.702C8.77582 12.0997 10.1243 11.9241 11.0275 11.0263C11.4774 10.5762 11.74 10.0018 11.8261 9.40529C11.8794 9.03632 12.2216 8.78039 12.5906 8.83364ZM11.9814 7.7917H10.1316C9.75882 7.7917 9.45662 7.48949 9.45662 7.1167C9.45662 6.74391 9.75882 6.4417 10.1316 6.4417H10.293C9.21446 5.89796 7.86722 6.07574 6.97148 6.97148C6.52033 7.42263 6.25841 7.99003 6.17239 8.59218C6.11967 8.96122 5.77776 9.21766 5.40872 9.16494C5.03967 9.11221 4.78324 8.7703 4.83596 8.40126C4.95994 7.53341 5.34303 6.69074 6.01688 6.01689C7.49751 4.53626 9.80887 4.39037 11.4591 5.57421V5.11422C11.4591 4.74142 11.7613 4.43922 12.1341 4.43922C12.5069 4.43922 12.8091 4.74142 12.8091 5.11422V7.1167C12.8091 7.48949 12.5069 7.7917 12.1341 7.7917H12.0032C11.996 7.79182 11.9887 7.79182 11.9814 7.7917Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** public/icons/copy.svg, fill handed to `currentColor`, drawn at 16. */
function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.6998 5.17187C6.6998 3.92842 6.95278 3.2401 7.3479 2.84497C7.74302 2.44985 8.43134 2.19687 9.6748 2.19687H12.8248C14.0683 2.19687 14.7566 2.44985 15.1517 2.84497C15.5468 3.2401 15.7998 3.92842 15.7998 5.17187V8.32187C15.7998 9.56533 15.5468 10.2537 15.1517 10.6488C14.7566 11.0439 14.0683 11.2969 12.8248 11.2969H12.6998V9.67187C12.6998 8.29033 12.4278 7.14115 11.6417 6.35502C10.8555 5.5689 9.70634 5.29687 8.3248 5.29687H6.6998V5.17187ZM5.2998 5.29688V5.17187C5.2998 3.79033 5.57183 2.64115 6.35795 1.85503C7.14408 1.0689 8.29326 0.796875 9.6748 0.796875H12.8248C14.2063 0.796875 15.3555 1.0689 16.1417 1.85503C16.9278 2.64115 17.1998 3.79033 17.1998 5.17187V8.32187C17.1998 9.70341 16.9278 10.8526 16.1417 11.6387C15.3555 12.4249 14.2063 12.6969 12.8248 12.6969H12.6998V12.8219C12.6998 14.2034 12.4278 15.3526 11.6417 16.1387C10.8555 16.9249 9.70634 17.1969 8.3248 17.1969H5.1748C3.79326 17.1969 2.64408 16.9249 1.85795 16.1387C1.07183 15.3526 0.799805 14.2034 0.799805 12.8219V9.67187C0.799805 8.29033 1.07183 7.14115 1.85795 6.35502C2.64408 5.5689 3.79326 5.29688 5.1748 5.29688H5.2998ZM5.9998 6.69687H5.1748C3.93134 6.69687 3.24302 6.94985 2.8479 7.34497C2.45278 7.74009 2.1998 8.42841 2.1998 9.67187V12.8219C2.1998 14.0653 2.45278 14.7537 2.8479 15.1488C3.24302 15.5439 3.93134 15.7969 5.1748 15.7969H8.3248C9.56826 15.7969 10.2566 15.5439 10.6517 15.1488C11.0468 14.7537 11.2998 14.0653 11.2998 12.8219L11.2998 11.9969V9.67187C11.2998 8.42841 11.0468 7.74009 10.6517 7.34497C10.2566 6.94985 9.56826 6.69687 8.3248 6.69687H5.9998Z"
        fill="currentColor"
      />
    </svg>
  );
}
