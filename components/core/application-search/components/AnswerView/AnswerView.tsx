'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Markdown } from '@/components/common/Markdown';
import InfoBox from '@/components/ui/info-box';
import { PopoverDp } from '@/components/core/popover-dp';
import HuskySourceCard from '@/components/core/husky/husky-source-card';
import HuskyAnswerLoader from '@/components/core/husky/husky-answer-loader';
import HuskyLimitStrip from '@/components/core/husky/husky-limit-strip';
import FollowupQuestions from '@/components/page/husky/followup-questions';
import ChatInput from '@/components/page/husky/chat-input';
import { ArrowBackIcon, ArrowUpRightIcon, NotePencilIcon, ThumbsUpOutlinedIcon, ThumbsDownIcon } from '@/components/icons';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { saveFeedback } from '@/services/husky.service';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import type { HuskyTurn, StreamStatus } from '@/services/husky/hooks/useHuskyChat';
import type { LimitLevel } from '@/services/husky/hooks/useDailyChatLimit';
import { DirectoryResultCards } from '@/components/core/application-search/components/DirectoryResultCards';

import s from './AnswerView.module.scss';

/** Why an answer was wrong. Sent as a prefix on the existing free-text field. */
const FEEDBACK_REASONS = ['Wrong matches', 'Out of date', "Didn't answer", 'No sources'] as const;

type FeedbackState = 'none' | 'up' | 'down' | 'sent' | 'failed';

interface Props {
  turns: HuskyTurn[];
  status: StreamStatus;
  isBusy: boolean;
  threadId: string | null;
  limitLevel: LimitLevel;
  limitRemaining: number;
  isLoggedIn: boolean;
  /** Only present when the answer was reached from a list there is a way back to. */
  onBack?: () => void;
  backLabel: string;
  onAsk: (question: string) => void;
  onRegenerate: (question: string) => void;
  onStop: () => void;
  onClose: () => void;
}

/**
 * The AI half of the dialog, as a *state* of it rather than a second column.
 *
 * The answer anatomy is production's — sources popover, markdown, follow-ups,
 * loader — with three deliberate changes. `ChatInput` is a footer under the
 * thread instead of sticky over it. Feedback is an inline thumbs pair, because
 * production's 1–5 rating in a dialog takes three presses to say "this was
 * wrong" and a survey collects ratings, not signals. And "Share entire thread"
 * is gone: a thread inside a search dialog has no permalink, which is exactly
 * what `Continue in AI Search` is for.
 */
export const AnswerView = ({
  turns,
  status,
  isBusy,
  threadId,
  limitLevel,
  limitRemaining,
  isLoggedIn,
  onBack,
  backLabel,
  onAsk,
  onRegenerate,
  onStop,
  onClose,
}: Props) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const analytics = useHuskyAnalytics();

  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});
  const [openReasons, setOpenReasons] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const last = turns[turns.length - 1];
  const showLoader = status === 'submitting' && !!last && !last.answer;

  useEffect(() => {
    if (isBusy) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, isBusy]);

  const submitInput = useCallback(() => {
    const value = inputRef.current?.value?.trim();
    if (!value) return;
    onAsk(value);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.style.height = 'auto';
    }
  }, [onAsk]);

  const send = useCallback(
    async (turn: HuskyTurn, rating: 1 | 5, reasons: string[], freeText: string) => {
      try {
        const { newAuthToken } = await getUserCredentialsInfo();
        /* The endpoint's `comment` is a required string, so a bare thumbs-up
           has to send an empty one rather than omitting it. The reasons ride
           in front of the free text under a stable prefix — there is no
           structured field for them yet. */
        const prefix = reasons.length ? `[reasons: ${reasons.join(', ')}] ` : '';
        const result = await saveFeedback(newAuthToken, {
          rating,
          comment: `${prefix}${freeText}`.trim(),
          prompt: turn.question,
          response: turn.answer,
        });
        setFeedback((prev) => ({ ...prev, [turn.chatId]: 'isSaved' in result && result.isSaved ? 'sent' : 'failed' }));
      } catch {
        setFeedback((prev) => ({ ...prev, [turn.chatId]: 'failed' }));
      }
    },
    [],
  );

  const onThumbUp = useCallback(
    (turn: HuskyTurn) => {
      analytics.trackFeedbackClick(turn.question, turn.answer);
      setOpenReasons(null);
      setFeedback((prev) => ({ ...prev, [turn.chatId]: 'up' }));
      void send(turn, 5, [], '');
    },
    [analytics, send],
  );

  const onThumbDown = useCallback(
    (turn: HuskyTurn) => {
      analytics.trackFeedbackClick(turn.question, turn.answer);
      setFeedback((prev) => ({ ...prev, [turn.chatId]: 'down' }));
      setSelectedReasons([]);
      setComment('');
      setOpenReasons(turn.chatId);
    },
    [analytics],
  );

  const canContinue = !!threadId && !isBusy;

  return (
    <div className={s.root}>
      {/* Announce only on a terminal state, and on every terminal state: a
          token-by-token live region is unusable, and "announce on completion"
          alone leaves an aborted or failed answer entirely silent. */}
      <div className={s.srOnly} role="status" aria-live="polite">
        {status === 'submitting' && 'Generating answer'}
        {status === 'done' && 'Answer ready'}
        {status === 'stopped' && 'Answer stopped'}
        {status === 'errored' && 'Answer failed'}
      </div>

      <div className={s.bar}>
        {onBack ? (
          <button type="button" className={s.barButton} onClick={onBack}>
            <ArrowBackIcon />
            {backLabel}
          </button>
        ) : (
          <span />
        )}
        {/* Enabled only once the turn is terminal: the thread document is
            written when the server's stream finishes, so a link followed
            mid-answer would land on a thread that does not exist yet. */}
        <a
          className={s.barButton}
          href={canContinue ? `/husky/chat/${threadId}` : undefined}
          aria-disabled={!canContinue}
          data-disabled={!canContinue || undefined}
          onClick={(e) => {
            if (!canContinue) e.preventDefault();
          }}
        >
          Continue in AI Search
          <ArrowUpRightIcon />
        </a>
      </div>

      <div className={s.thread}>
        {turns.map((turn) => {
          const state = feedback[turn.chatId] ?? 'none';
          return (
            <div key={turn.chatId} className={s.turn}>
              <div className={s.question}>{turn.question}</div>

              {!!turn.sources.length && (
                <div className={s.sources}>
                  <PopoverDp.Wrapper>
                    <InfoBox info={`${turn.sources.length} source(s)`} imgUrl="/icons/globe-blue.svg" />
                    <PopoverDp.Pane position="bottom">
                      <HuskySourceCard sources={turn.sources} />
                    </PopoverDp.Pane>
                  </PopoverDp.Wrapper>
                </div>
              )}

              {!!turn.answer && (
                <div className={s.answer}>
                  <Markdown>{turn.answer}</Markdown>
                </div>
              )}

              {turn.isError && (
                <p className={s.error}>
                  Something went wrong while answering.{' '}
                  <button type="button" className={s.retry} onClick={() => onRegenerate(turn.question)}>
                    Try again
                  </button>
                </p>
              )}

              <DirectoryResultCards actions={turn.actions} onSelect={onClose} />

              {!!turn.followUpQuestions.length && (
                <FollowupQuestions
                  followupQuestions={turn.followUpQuestions}
                  onFollowupClicked={(question: string) => onAsk(question)}
                  isAnswerLoading={isBusy}
                  isLoadingObject={isBusy}
                />
              )}

              {!!turn.answer && (
                <div className={s.actions}>
                  <button
                    type="button"
                    className={s.action}
                    aria-label="Regenerate answer"
                    onClick={() => onRegenerate(turn.question)}
                  >
                    <ArrowBackIcon />
                  </button>
                  <button
                    type="button"
                    className={s.action}
                    aria-label="Edit question"
                    onClick={() => {
                      if (!inputRef.current) return;
                      inputRef.current.value = turn.question;
                      inputRef.current.focus();
                      analytics.trackQuestionEdit(turn.question);
                    }}
                  >
                    <NotePencilIcon />
                  </button>
                  <button
                    type="button"
                    className={s.action}
                    aria-label="Copy answer"
                    onClick={() => {
                      void navigator.clipboard?.writeText(turn.answer);
                      analytics.trackAnswerCopy(turn.answer);
                    }}
                  >
                    <span className={s.copyGlyph} aria-hidden>
                      ⧉
                    </span>
                  </button>

                  {/* Feedback is hidden signed-out: the endpoint needs a token,
                      so the thumbs would look like they worked and 401. */}
                  {isLoggedIn && (
                    <>
                      <button
                        type="button"
                        className={s.action}
                        aria-label="Good answer"
                        aria-pressed={state === 'up' || state === 'sent'}
                        data-active={state === 'up' || state === 'sent' || undefined}
                        disabled={state === 'sent'}
                        onClick={() => onThumbUp(turn)}
                      >
                        <ThumbsUpOutlinedIcon />
                      </button>
                      <button
                        type="button"
                        className={s.action}
                        aria-label="Bad answer"
                        aria-pressed={state === 'down'}
                        data-active={state === 'down' || undefined}
                        disabled={state === 'sent'}
                        onClick={() => onThumbDown(turn)}
                      >
                        <ThumbsDownIcon />
                      </button>
                    </>
                  )}

                  {state === 'sent' && <span className={s.receipt}>Thanks for your response</span>}
                  {state === 'failed' && (
                    <span className={s.receipt}>
                      Couldn&rsquo;t send that.{' '}
                      <button type="button" className={s.retry} onClick={() => onThumbUp(turn)}>
                        Retry
                      </button>
                    </span>
                  )}
                </div>
              )}

              {openReasons === turn.chatId && state === 'down' && (
                <div className={s.reasons}>
                  <div className={s.reasonsTitle}>What went wrong?</div>
                  <div className={s.reasonsList}>
                    {FEEDBACK_REASONS.map((reason) => {
                      const active = selectedReasons.includes(reason);
                      return (
                        <button
                          key={reason}
                          type="button"
                          className={s.reason}
                          data-active={active || undefined}
                          aria-pressed={active}
                          onClick={() =>
                            setSelectedReasons((prev) =>
                              prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
                            )
                          }
                        >
                          {reason}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    className={s.commentBox}
                    value={comment}
                    maxLength={1000}
                    placeholder="Anything else? (optional)"
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button
                    type="button"
                    className={s.send}
                    onClick={() => {
                      setOpenReasons(null);
                      void send(turn, 1, selectedReasons, comment);
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {showLoader && <HuskyAnswerLoader />}
        <div ref={endRef} />
      </div>

      {limitLevel && (
        <HuskyLimitStrip
          type={limitLevel}
          count={Math.max(0, limitRemaining)}
          mode="chat"
          from="ai-search-dialog"
          onDialogClose={onClose}
        />
      )}

      {/* A footer of the dialog, under the thread — not sticky over it. */}
      <form
        className={s.footer}
        onSubmit={(e) => {
          e.preventDefault();
          submitInput();
        }}
      >
        <ChatInput
          ref={inputRef}
          placeholder="Ask a follow-up"
          isAnswerLoading={status === 'submitting'}
          isLoadingObject={status === 'streaming'}
          onStopStreaming={onStop}
          isLimitReached={limitLevel === 'warn'}
          onSubmit={submitInput}
          onTextSubmit={submitInput}
        />
      </form>
    </div>
  );
};
