'use client';

import { EVENTS } from '@/utils/constants';
import { ProgressBar } from '@/components/core/Loader/ProgressBar';
import { useLoaderSignal } from '@/components/core/Loader/useLoaderSignal';

/**
 * Register/form-scoped variant, driven by `triggerRegisterLoader()`. Shares the global
 * top progress bar rather than carrying its own copy of the dim + "Loading..." box.
 */
const RegsiterFormLoader = () => {
  const visible = useLoaderSignal(EVENTS.TRIGGER_REGISTER_LOADER);

  return visible ? <ProgressBar /> : null;
};

export default RegsiterFormLoader;
