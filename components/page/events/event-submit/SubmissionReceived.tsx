import { Button } from '@/components/common/Button';

import s from './SubmitEventPage.module.scss';

/** What a signed-out visitor sees in place of the form after a submit: the event waits for approval. */
export function SubmissionReceived({ onAnother }: { onAnother: () => void }) {
  return (
    <div className={s.received} role="status">
      <h2 className={s.receivedTitle}>We received your event</h2>
      <p className={s.receivedText}>
        It waits for approval. Once a curator approves it, it shows on the Events page. We will use your email only if
        we have a question about it.
      </p>
      <Button type="button" variant="primary" size="s" onClick={onAnother}>
        Submit another event
      </Button>
    </div>
  );
}
