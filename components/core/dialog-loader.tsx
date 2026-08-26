'use client';

import { EVENTS } from '@/utils/constants';
import { ProgressBar } from './Loader/ProgressBar';
import { useLoaderSignal } from './Loader/useLoaderSignal';

/**
 * Dialog-scoped variant, mounted only by the legacy `components/core/modal.tsx` and
 * driven by `triggerDialogLoader()`. It used to render its own dim + box at z-index
 * 10000 purely to out-stack modals; now it shares the global progress bar, so the two
 * signals look identical wherever both are visible.
 */
const DialogLoader = () => {
  const visible = useLoaderSignal(EVENTS.TRIGGER_DIALOG_LOADER);

  return visible ? <ProgressBar /> : null;
};

export default DialogLoader;
