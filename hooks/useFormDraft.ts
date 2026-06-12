import { useCallback, useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { clearFormDraft, readFormDraft, writeFormDraft } from '@/utils/formDraftStorage';

export type UseFormDraftOptions<TForm extends FieldValues, TDraft> = {
  storageKey: string;
  enabled: boolean;
  methods: UseFormReturn<TForm>;
  getDefaults: () => TForm;
  toDraft: (form: TForm) => TDraft;
  fromDraft: (draft: TDraft) => TForm;
  isEmpty: (draft: TDraft) => boolean;
  onRestore?: (draft: TDraft | null) => void;
  saveDeps?: readonly unknown[];
  debounceMs?: number;
};

export function useFormDraft<TForm extends FieldValues, TDraft>({
  storageKey,
  enabled,
  methods,
  getDefaults,
  toDraft,
  fromDraft,
  isEmpty,
  onRestore,
  saveDeps = [],
  debounceMs = 500,
}: UseFormDraftOptions<TForm, TDraft>) {
  const { watch, reset, getValues } = methods;
  const values = watch();
  const skipSaveRef = useRef(true);

  const clearDraft = useCallback(() => {
    clearFormDraft(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (!enabled) {
      skipSaveRef.current = true;
      return;
    }

    skipSaveRef.current = true;
    const draft = readFormDraft<TDraft>(storageKey);

    if (draft && !isEmpty(draft)) {
      reset(fromDraft(draft));
      onRestore?.(draft);
    } else {
      reset(getDefaults());
      onRestore?.(null);
    }

    const id = window.setTimeout(() => {
      skipSaveRef.current = false;
    }, 0);

    return () => window.clearTimeout(id);
    // Restore only when the modal opens or the draft key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || skipSaveRef.current) {
      return;
    }

    const id = window.setTimeout(() => {
      const draft = toDraft(getValues());
      if (isEmpty(draft)) {
        clearFormDraft(storageKey);
      } else {
        writeFormDraft(storageKey, draft);
      }
    }, debounceMs);

    return () => window.clearTimeout(id);
    // saveDeps carries non-RHF fields (e.g. objective title) into the draft envelope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, storageKey, values, debounceMs, ...saveDeps]);

  return { clearDraft };
}
