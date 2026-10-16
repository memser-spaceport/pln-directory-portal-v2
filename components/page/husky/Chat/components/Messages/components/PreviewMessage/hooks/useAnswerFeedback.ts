import { useRef, useState } from 'react';

import { getMemberInfo } from '@/services/members.service';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import { removeFeedback, saveFeedback } from '@/services/husky.service';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import type { AnswerFeedbackState } from '../types/answerFeedbackState';

// The feedback API stores a 1-5 rating; a thumb maps to its two ends.
const UP_RATING = 5;
const DOWN_RATING = 1;

interface MemberFeedbackFields {
  name: string;
  email: string;
  team: string;
  directoryId: string;
}

interface SendRequestInput {
  confirms: AnswerFeedbackState;
  isOptimistic: boolean;
  request: (authToken: string) => Promise<{ isSaved?: boolean }>;
}

interface Input {
  answerId: string;
  threadId?: string;
  question: string;
  answer: string;
  savedVote?: { rating: number };
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

function toFeedbackState(savedVote: Input['savedVote']): AnswerFeedbackState {
  if (savedVote?.rating === UP_RATING) {
    return 'up';
  }
  if (savedVote?.rating === DOWN_RATING) {
    return 'sent';
  }
  return 'none';
}

export function useAnswerFeedback(input: Input) {
  const { answerId, threadId, question, answer, savedVote } = input;

  const [feedback, setFeedback] = useState<AnswerFeedbackState>(() => toFeedbackState(savedVote));
  const [hasError, setHasError] = useState(false);
  const { trackFeedbackClick, trackFeedbackStatus } = useHuskyAnalytics();

  /* Thumbs answer at once and the requests follow in order, so quick toggles land on the server as pressed.
     When the latest of those fails, the thumbs go back to the last state the server confirmed. */
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const latestRequestRef = useRef(0);
  const confirmedRef = useRef(feedback);

  const sendRequest = (requestInput: SendRequestInput) => {
    const { confirms, isOptimistic, request } = requestInput;
    const requestNumber = ++latestRequestRef.current;
    const result = queueRef.current.then(async () => {
      let isSaved = false;
      try {
        const { newAuthToken } = await getUserCredentialsInfo();
        if (!newAuthToken) {
          throw new Error('No auth token for feedback');
        }
        isSaved = Boolean((await request(newAuthToken)).isSaved);
      } catch (error) {
        console.error('Error while sending feedback', error);
      }
      if (isSaved) {
        confirmedRef.current = confirms;
      }
      const isLatest = requestNumber === latestRequestRef.current;
      if (isLatest && !isSaved) {
        if (isOptimistic) {
          setFeedback(confirmedRef.current);
        }
        setHasError(true);
      }
      return { isSaved, isLatest };
    });
    queueRef.current = result;
    return result;
  };

  const postVote = async (authToken: string, fields: { rating: number; reasons?: string[]; comment?: string }) => {
    const { newUserInfo } = await getUserCredentialsInfo();
    const memberFields = newUserInfo ? await loadMemberFeedbackFields(newUserInfo.uid) : undefined;
    return saveFeedback(authToken, {
      comment: '',
      ...fields,
      prompt: question,
      response: answer,
      threadId,
      questionId: answerId,
      ...memberFields,
    });
  };

  const vote = async (target: 'up' | 'down') => {
    setFeedback(target);
    setHasError(false);
    trackFeedbackClick(question, answer);
    trackFeedbackStatus('initiated', target, question);
    // A saved thumbs-down is 'sent': going back to it never reopens the panel.
    const { isSaved } = await sendRequest({
      confirms: target === 'up' ? 'up' : 'sent',
      isOptimistic: true,
      request: (authToken) => postVote(authToken, { rating: target === 'up' ? UP_RATING : DOWN_RATING }),
    });
    trackFeedbackStatus(isSaved ? 'success' : 'error', target, question);
  };

  const unvote = () => {
    setFeedback('none');
    setHasError(false);
    sendRequest({ confirms: 'none', isOptimistic: true, request: (authToken) => removeFeedback(authToken, answerId) });
  };

  const onUp = () => (feedback === 'up' ? unvote() : vote('up'));

  // A thumbs-down that was already sent reopens its panel; the vote itself stays saved.
  const onDown = () => {
    if (feedback === 'down') {
      unvote();
    } else if (feedback === 'sent') {
      setFeedback('down');
    } else {
      vote('down');
    }
  };

  // The panel stays open until the reasons are saved, so a failed send keeps what was picked.
  const onSendReasons = async (reasons: string[], comment: string) => {
    setHasError(false);
    const { isSaved, isLatest } = await sendRequest({
      confirms: 'sent',
      isOptimistic: false,
      request: (authToken) => postVote(authToken, { rating: DOWN_RATING, reasons, comment }),
    });
    if (isSaved && isLatest) {
      setFeedback('sent');
    }
  };

  const onSkipReasons = () => setFeedback('sent');

  return { feedback, hasError, onUp, onDown, onSendReasons, onSkipReasons };
}
