'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { Tag } from '@/components/ui/Tag';
import ChatInput from '@/components/page/husky/chat-input';
import { NotePencilIcon, ThumbsDownIcon, ThumbsUpOutlinedIcon } from '@/components/icons';

import { PlTeamOnlyPill } from '../../profile-shared/PlTeamOnlyPill';
import { thinkingMsFor } from '../../ai-search/AnswerStatus';
import { FEEDBACK_REASONS } from '../../ai-search/mocks';
import type { AnswerPanel, FeedbackState, Turn } from '../../ai-search/AnswerPanel';
// The current panel's page frame (scroll region, reading column, pinned input)
// is reused as is — this pass changes what is drawn inside a turn, not where.
import frame from '../../ai-search/AnswerPanel.module.scss';

import { sourceRefsFor, withCitations } from './entities';
import { AnswerProse } from './AnswerProse';
import { AnswerShapes } from './AnswerShapes';
import { EntityList } from './EntityList';
import { SourcesButton } from './SourcesButton';
import { ThinkingStatus } from './ThinkingStatus';
import s from './ProposedAnswerPanel.module.scss';

type Props = React.ComponentProps<typeof AnswerPanel>;

/**
 * The proposed answer components for AI mode, as a drop-in for the ai-search
 * `AnswerPanel` (same props, same `Turn`s, same simulated stream). See
 * PROPOSAL.md for each component's before → after.
 *
 * The one structural move: **the answer is no longer a bordered card.** Every
 * current answer surface (ChatGPT, Gemini, Claude, Perplexity, Dropbox Dash,
 * Google AI Mode) sets the question as a quiet bubble and lets the answer run
 * on the page; a white box with a 1px border around each reply is the
 * 2020-chatbot look Anuj called "old school". Without the card the parts of
 * an answer — prose, table, directory results, actions, follow-ups — stand on
 * their own spacing, and the panels that *are* objects (table, results) get
 * the only borders.
 *
 * Order inside a turn changes by one step: the actions row moves up, under
 * what it acts on (prose, table, results), and the follow-ups come last,
 * nearest the composer — the order ChatGPT, Dash and Fireflies use. No
 * control is added or removed.
 */
export function ProposedAnswerPanel({
  turns,
  onTurnsChange,
  onAsk,
  onBackToResults,
  backLabel = 'Back to results',
  onNewQuestion,
  onOpenTarget,
  draft = '',
  onDraftChange,
  hideBar = false,
  layout = 'dialog',
  InputComponent = ChatInput,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const last = turns[turns.length - 1];
  const busy = !!last && last.status !== 'done';

  /* The same simulated stream as the current panel (text loader timing). */
  useEffect(() => {
    if (!last || last.status === 'done') return;
    const id = last.id;
    if (last.status === 'thinking') {
      const t = setTimeout(() => {
        onTurnsChange((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'streaming' } : x)));
      }, thinkingMsFor('text'));
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

  useEffect(() => {
    const box = messagesRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [turns.length, last?.status]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el || !el.value) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 1}px`;
  }, []);

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
    onDraftChange?.('');
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
    onDraftChange?.(turn.question);
  };

  const setFeedback = (turn: Turn, feedback: FeedbackState) => {
    onTurnsChange((prev) => prev.map((x) => (x.id === turn.id ? { ...x, feedback } : x)));
  };

  return (
    <div className={clsx(frame.root, layout === 'page' && frame.rootPage)}>
      {!hideBar && (
        <div className={frame.bar}>
          {onBackToResults ? (
            <Button style="link" variant="neutral" size="xs" onClick={onBackToResults}>
              ← {backLabel}
            </Button>
          ) : (
            <span />
          )}
          {onNewQuestion && (
            <Button style="link" variant="primary" size="xs" onClick={onNewQuestion}>
              New question
            </Button>
          )}
        </div>
      )}

      <div className={frame.messages} ref={messagesRef}>
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
            onOpenTarget={onOpenTarget}
          />
        ))}
      </div>

      <form className={frame.inputWrap} onSubmit={(e) => e.preventDefault()}>
        <InputComponent
          ref={inputRef}
          placeholder="Ask a follow-up"
          rows={1}
          defaultValue={draft}
          onChange={(e) => onDraftChange?.(e.target.value)}
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
  onOpenTarget?: (target: string) => void;
}

function Message({ turn, isLast, busy, onFollowup, onRegenerate, onEdit, onFeedback, onOpenTarget }: MessageProps) {
  const streaming = turn.status === 'streaming';
  const scoped = turn.scoped;
  /* A scoped answer reads the profile, so it has no external sources. */
  const refs = useMemo(() => (scoped ? [] : sourceRefsFor(turn.sources)), [scoped, turn.sources]);
  const prose = useMemo(() => withCitations(turn.shown, refs), [turn.shown, refs]);
  const showResults =
    !scoped && !streaming && turn.sql.length > 0 && !turn.blocks?.some((b) => b.kind === 'intros');

  return (
    <article className={s.turn}>
      {/* The question as the asker's own line, right-aligned in a quiet
          bubble — not a heading over a box. */}
      <div className={s.askRow}>
        <h2 className={s.ask}>{turn.question}</h2>
      </div>

      {turn.status === 'thinking' ? (
        <ThinkingStatus hits={turn.sql} sourceCount={turn.sources.length} scoped={scoped} />
      ) : (
        <div className={s.answer}>
          {scoped && (
            <div className={s.retrieved}>
              <span>
                <span className={s.retrievedLabel}>Retrieved:</span> {scoped.retrieved}
              </span>
              {scoped.restrictedTo && <PlTeamOnlyPill label={scoped.restrictedTo} />}
            </div>
          )}
          {scoped && turn.sql.length > 0 && <EntityList hits={turn.sql} title="Found on the profile" />}

          <AnswerProse markdown={prose} refs={refs} streaming={streaming} />

          {!streaming && turn.blocks && turn.blocks.length > 0 && <AnswerShapes blocks={turn.blocks} />}

          {showResults && <EntityList hits={turn.sql} />}

          {scoped?.door && !streaming && onOpenTarget && (
            <div>
              <Button style="border" variant="neutral" size="xs" onClick={() => onOpenTarget(scoped.door!.target)}>
                {scoped.door.label}
              </Button>
            </div>
          )}

          {!streaming && (
            <Actions
              turn={turn}
              refs={refs}
              isLast={isLast}
              busy={busy}
              onRegenerate={onRegenerate}
              onEdit={onEdit}
              onFeedback={onFeedback}
            />
          )}

          {!streaming && turn.followUpQuestions.length > 0 && (
            <FollowUps questions={turn.followUpQuestions} disabled={busy} onAsk={onFollowup} />
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Follow-up questions. Maps to production's `FollowupQuestions`
 * (components/page/husky/followup-questions.tsx): orange "Follow up
 * questions" with a lightbulb, then full-width #f1f5f9 slabs with black text.
 *
 * Proposed: the section label every part of the answer now shares (14/600
 * primary), then a hairline-divided list of rows — Perplexity's "Related",
 * Reddit Answers' "Related", Fireflies' suggested questions. Each row leads
 * with a ↳ (it continues this thread, it doesn't leave it) and turns brand on
 * hover. Orange is not in the PL palette, and grey slabs read as disabled
 * inputs.
 */
function FollowUps({ questions, disabled, onAsk }: { questions: string[]; disabled: boolean; onAsk: (q: string) => void }) {
  return (
    <section className={s.follow} aria-label="Follow-up questions">
      <h3 className={s.sectionTitle}>Follow-up questions</h3>
      <ul className={s.followList}>
        {questions.map((q) => (
          <li key={q}>
            <button type="button" className={s.followRow} disabled={disabled} onClick={() => onAsk(q)}>
              <ReplyGlyph />
              <span>{q}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ActionsProps {
  turn: Turn;
  refs: ReturnType<typeof sourceRefsFor>;
  isLast: boolean;
  busy: boolean;
  onRegenerate: () => void;
  onEdit: () => void;
  onFeedback: (f: FeedbackState) => void;
}

/**
 * The answer's actions. Maps to production's `ChatMessageActions` /
 * AnswerView `.actions` and the current panel's `Actions`.
 *
 * Same five presses, same 16px glyphs, in 28px targets (24 → 28, the size a
 * finger can hit on a phone). Changes: the sources pill leads the row instead
 * of trailing it — it is a receipt for the answer, read before you rate it
 * (Perplexity, Dash); the presses on *the answer* (copy, thumbs) come first
 * and the two that only exist on the last turn (regenerate, edit) follow a
 * hairline, so older turns keep the same left edge (ChatGPT's order); copy
 * confirms with a check for 1.5s; and the thumbs-down is the DS
 * `ThumbsDownIcon` rather than a rotated thumbs-up (which mirrors the hand).
 * Copy and regenerate are production's own SVG files, drawn through a CSS
 * mask so they take `currentColor` without transcribing their paths.
 */
function Actions({ turn, refs, isLast, busy, onRegenerate, onEdit, onFeedback }: ActionsProps) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const whyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turn.feedback === 'down') whyRef.current?.scrollIntoView({ block: 'nearest' });
  }, [turn.feedback]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const toggleReason = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const copy = () => {
    navigator.clipboard?.writeText(turn.answer);
    setCopied(true);
  };

  const down = turn.feedback === 'down' || turn.feedback === 'sent';

  return (
    <>
      <div className={clsx(s.actions, busy && s.actionsBusy)}>
        <SourcesButton refs={refs} />
        <div className={s.actionsRow}>
          <button type="button" className={s.iconBtn} title="Copy" aria-label="Copy response" onClick={copy}>
            {copied ? <CheckGlyph /> : <span className={clsx(s.mask, s.maskCopy)} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={clsx(s.iconBtn, turn.feedback === 'up' && s.on)}
            title="Good answer"
            aria-label="Good answer"
            aria-pressed={turn.feedback === 'up'}
            onClick={() => onFeedback(turn.feedback === 'up' ? 'none' : 'up')}
          >
            <ThumbsUpOutlinedIcon />
          </button>
          <button
            type="button"
            className={clsx(s.iconBtn, down && s.on)}
            title="Not helpful"
            aria-label="Not helpful"
            aria-pressed={down}
            onClick={() => onFeedback(turn.feedback === 'down' ? 'none' : 'down')}
          >
            <ThumbsDownIcon />
          </button>
          {isLast && (
            <>
              <span className={s.sep} aria-hidden="true" />
              <button
                type="button"
                className={s.iconBtn}
                title="Regenerate"
                aria-label="Regenerate response"
                onClick={onRegenerate}
              >
                <span className={clsx(s.mask, s.maskRefresh)} aria-hidden="true" />
              </button>
              <button type="button" className={s.iconBtn} title="Edit question" aria-label="Edit question" onClick={onEdit}>
                <NotePencilIcon width={16} height={16} />
              </button>
            </>
          )}
          {(turn.feedback === 'up' || turn.feedback === 'sent') && (
            <span className={s.receipt} role="status">
              Thanks for your response
            </span>
          )}
        </div>
      </div>

      {turn.feedback === 'down' && (
        <div className={s.why} ref={whyRef}>
          <div className={s.whyHead}>
            <span className={s.whyTitle}>What was wrong?</span>
            <button type="button" className={s.whySkip} onClick={() => onFeedback('sent')}>
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

/** ↳ — continues the thread. 16-grid, 1.5 stroke, like the DS line icons. */
function ReplyGlyph() {
  return (
    <svg className={s.followGlyph} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 3v4.5a2 2 0 0 0 2 2h7M10 7l2.5 2.5L10 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
