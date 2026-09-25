import { memo } from 'react';

import s from './husky-answer-loader.module.scss';

function HuskyAnswerLoader({
  label = 'Understanding your question',
  'data-testid': testId = 'chat-answer-loader',
}: {
  label?: string;
  'data-testid'?: string;
}) {
  return (
    <div id="answer-loader" className={s.root} role="status" aria-live="polite" data-testid={testId}>
      <span className={s.mark} aria-hidden="true" />
      <span key={label} className={s.label}>
        {label}
      </span>
    </div>
  );
}

export default memo(HuskyAnswerLoader);
