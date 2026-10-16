import { useEffect, useRef, useState } from 'react';

import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/common/Button';

import s from './AnswerFeedbackReasons.module.scss';

const REASONS = ['Wrong matches', 'Out of date', "Didn't answer", 'No sources'];

interface Props {
  onSend: (reasons: string[], comment: string) => Promise<void>;
  onSkip: () => void;
}

export const AnswerFeedbackReasons = (props: Props) => {
  const { onSend, onSkip } = props;

  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // The panel opens under an answer that is usually at the bottom of the scroll.
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  const toggleReason = (reason: string) =>
    setReasons((prev) => (prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason]));

  const send = async () => {
    setIsSending(true);
    await onSend(reasons, comment.trim());
    setIsSending(false);
  };

  return (
    <div className={s.root} ref={rootRef}>
      <div className={s.head}>
        <span className={s.title}>What was wrong?</span>
        <button type="button" className={s.skip} onClick={onSkip}>
          Skip
        </button>
      </div>
      <div className={s.reasons}>
        {REASONS.map((reason) => (
          <Tag
            key={reason}
            value={reason}
            variant="secondary"
            selected={reasons.includes(reason)}
            callback={() => toggleReason(reason)}
            tagsLength={1}
          />
        ))}
      </div>
      <textarea
        className={s.comment}
        rows={2}
        placeholder="Anything else? (optional)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className={s.footer}>
        <Button size="xs" disabled={isSending} onClick={send}>
          Send
        </Button>
      </div>
    </div>
  );
};
