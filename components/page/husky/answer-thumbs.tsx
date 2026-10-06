import { useState } from 'react';
import { getMemberInfo } from '@/services/members.service';
import { saveFeedback } from '@/services/husky.service';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { ThumbsUpOutlinedIcon } from '@/components/icons';

type Vote = 'up' | 'down';

// The feedback API stores a 1-5 rating; a thumb maps to its two ends.
const VOTE_RATING: Record<Vote, number> = { up: 5, down: 1 };

interface AnswerThumbsProps {
  question: string;
  answer: string;
  disabled?: boolean;
}

// Inline thumbs up / down for one answer on the AI Search page (replaces the 1-5 feedback dialog there).
const AnswerThumbs = ({ question, answer, disabled = false }: AnswerThumbsProps) => {
  const [saved, setSaved] = useState<Vote | null>(null);
  const [pending, setPending] = useState<Vote | null>(null);
  const [hasError, setHasError] = useState(false);
  const { trackFeedbackStatus } = useHuskyAnalytics();

  const isLocked = disabled || saved !== null || pending !== null;

  const onVote = async (vote: Vote) => {
    if (isLocked) {
      return;
    }
    setPending(vote);
    setHasError(false);
    trackFeedbackStatus('initiated', vote, question);
    try {
      const { newAuthToken, newUserInfo: userInfo } = await getUserCredentialsInfo();
      let payload = {
        rating: VOTE_RATING[vote],
        comment: '',
        prompt: question,
        response: answer,
      } as any;

      if (userInfo) {
        const memberInfo = await getMemberInfo(userInfo.uid);
        const memberDetails = memberInfo.data;
        payload = {
          ...payload,
          name: memberDetails.name,
          email: memberDetails.email,
          team: memberDetails.teamMemberRoles[0]?.teamTitle ?? '',
          directoryId: memberDetails.uid,
        };
      }

      const response = await saveFeedback(newAuthToken, payload);
      if (response.isSaved) {
        trackFeedbackStatus('success', vote, question);
        setSaved(vote);
      } else {
        trackFeedbackStatus('error', vote, question);
        setHasError(true);
      }
    } catch (error) {
      console.error('Error while sending feedback', error);
      trackFeedbackStatus('error', vote, question);
      setHasError(true);
    } finally {
      setPending(null);
    }
  };

  const isChosen = (vote: Vote) => saved === vote || pending === vote;

  return (
    <>
      <span className="answer-thumbs">
        <button
          type="button"
          className={`answer-thumbs__btn ${isChosen('up') ? 'answer-thumbs__btn--on' : ''}`}
          title="Good answer"
          aria-label="Good answer"
          aria-pressed={isChosen('up')}
          disabled={isLocked}
          onClick={() => onVote('up')}
        >
          <ThumbsUpOutlinedIcon />
        </button>
        <button
          type="button"
          className={`answer-thumbs__btn answer-thumbs__btn--down ${isChosen('down') ? 'answer-thumbs__btn--on' : ''}`}
          title="Not helpful"
          aria-label="Not helpful"
          aria-pressed={isChosen('down')}
          disabled={isLocked}
          onClick={() => onVote('down')}
        >
          <ThumbsUpOutlinedIcon />
        </button>
        {saved && (
          <span className="answer-thumbs__receipt" role="status">
            Thanks for your response
          </span>
        )}
        {hasError && (
          <span className="answer-thumbs__error" role="alert">
            Could not save your rating. Try again.
          </span>
        )}
      </span>
      <style jsx>{`
        .answer-thumbs {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .answer-thumbs__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          padding: 0;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .answer-thumbs__btn:hover:not(:disabled) {
          color: #0f172a;
          background: rgba(15, 23, 42, 0.04);
        }

        .answer-thumbs__btn:disabled {
          cursor: default;
        }

        .answer-thumbs__btn--down :global(svg) {
          transform: rotate(180deg);
        }

        .answer-thumbs__btn--on,
        .answer-thumbs__btn--on:disabled {
          color: #156ff7;
        }

        .answer-thumbs__receipt {
          margin-left: 4px;
          color: #64748b;
          font-size: 12px;
          line-height: 16px;
        }

        .answer-thumbs__error {
          margin-left: 4px;
          color: #dc2626;
          font-size: 12px;
          line-height: 16px;
        }
      `}</style>
    </>
  );
};

export default AnswerThumbs;
