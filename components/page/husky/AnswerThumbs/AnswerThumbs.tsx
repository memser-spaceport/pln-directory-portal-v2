import { useState } from 'react';
import clsx from 'clsx';

import { saveFeedback } from '@/services/husky.service';
import { getMemberInfo } from '@/services/members.service';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import { ThumbsDownIcon, ThumbsUpOutlinedIcon } from '@/components/icons';

import s from './AnswerThumbs.module.scss';

type Vote = 'up' | 'down';

// The feedback API stores a 1-5 rating; a thumb maps to its two ends.
const VOTE_RATING: Record<Vote, number> = { up: 5, down: 1 };

interface MemberFeedbackFields {
  name: string;
  email: string;
  team: string;
  directoryId: string;
}

interface Props {
  question: string;
  answer: string;
  disabled?: boolean;
}

// Member details are optional context for the feedback; a failed lookup does not stop the vote.
async function loadMemberFeedbackFields(memberUid: string): Promise<MemberFeedbackFields | undefined> {
  try {
    const member = (await getMemberInfo(memberUid))?.data;
    if (!member) {
      return undefined;
    }
    return {
      name: member.name,
      email: member.email,
      team: member.teamMemberRoles?.[0]?.teamTitle ?? '',
      directoryId: member.uid,
    };
  } catch (error) {
    console.error('Error while loading member info for feedback', error);
    return undefined;
  }
}

export const AnswerThumbs = (props: Props) => {
  const { question, answer, disabled = false } = props;

  const [saved, setSaved] = useState<Vote | null>(null);
  const [pending, setPending] = useState<Vote | null>(null);
  const [hasError, setHasError] = useState(false);
  const { trackFeedbackClick, trackFeedbackStatus } = useHuskyAnalytics();

  const isLocked = disabled || saved !== null || pending !== null;

  const onVote = async (vote: Vote) => {
    if (isLocked) {
      return;
    }
    setPending(vote);
    setHasError(false);
    trackFeedbackClick(question, answer);
    trackFeedbackStatus('initiated', vote, question);
    try {
      const { newAuthToken, newUserInfo: userInfo } = await getUserCredentialsInfo();
      if (!newAuthToken) {
        throw new Error('No auth token for feedback');
      }
      const memberFields = userInfo ? await loadMemberFeedbackFields(userInfo.uid) : undefined;

      const response = await saveFeedback(newAuthToken, {
        rating: VOTE_RATING[vote],
        comment: '',
        prompt: question,
        response: answer,
        ...memberFields,
      });
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
    <span className={s.root}>
      <button
        type="button"
        className={clsx(s.button, isChosen('up') && s.chosen)}
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
        className={clsx(s.button, isChosen('down') && s.chosen)}
        title="Not helpful"
        aria-label="Not helpful"
        aria-pressed={isChosen('down')}
        disabled={isLocked}
        onClick={() => onVote('down')}
      >
        <ThumbsDownIcon />
      </button>
      {saved && (
        <span className={s.receipt} role="status">
          Thanks for your response
        </span>
      )}
      {hasError && (
        <span className={s.error} role="alert">
          Could not save your rating. Try again.
        </span>
      )}
    </span>
  );
};
