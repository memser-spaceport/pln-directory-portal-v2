'use client';

import { EVENTS } from '@/utils/constants';
import { ProgressBar } from './ProgressBar';
import { useLoaderSignal } from './useLoaderSignal';

/**
 * Global loading indicator, mounted once in the root layout.
 *
 * Driven by `triggerLoader()` from `utils/common.utils` via a document CustomEvent.
 * The event API is unchanged from the previous blocking overlay so that all existing
 * call sites keep working; only what gets painted is different.
 */
const Loader = () => {
  const visible = useLoaderSignal(EVENTS.TRIGGER_LOADER);

  return visible ? <ProgressBar /> : null;
};

export default Loader;
