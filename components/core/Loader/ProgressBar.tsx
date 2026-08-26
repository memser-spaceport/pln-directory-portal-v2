'use client';

import s from './ProgressBar.module.scss';

/**
 * Indeterminate top-of-viewport progress bar.
 *
 * Purely presentational and non-blocking: `pointer-events: none` so the page stays
 * fully interactive while it is on screen. There is no real progress signal behind
 * it (the trigger is a boolean), so it sweeps rather than faking a percentage.
 */
export const ProgressBar = ({ 'data-testid': testId }: { 'data-testid'?: string } = {}) => (
  <>
    <span className={s.srOnly} role="status" aria-live="polite">
      Loading
    </span>
    <div className={s.bar} data-testid={testId} aria-hidden="true" />
  </>
);

export default ProgressBar;
