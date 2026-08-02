'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { useFormDraft } from '@/hooks/useFormDraft';

export type DraftStatus = 'idle' | 'saving' | 'saved' | 'restored';

const DEBOUNCE_MS = 500;

/**
 * Wraps production's real `useFormDraft` and adds the one thing it doesn't
 * have: a status the UI can render.
 *
 * The hook itself is untouched — this prototype deliberately runs on the
 * shipped implementation to prove it already covers every surface in the
 * audit. All that's missing upstream is `status` and `savedAt`, which is a
 * small additive change rather than a new system.
 */
export function useTrackedFormDraft<TForm extends FieldValues, TDraft>({
  storageKey,
  enabled,
  methods,
  getDefaults,
  toDraft,
  fromDraft,
  isEmpty,
}: {
  storageKey: string;
  enabled: boolean;
  methods: UseFormReturn<TForm>;
  getDefaults: () => TForm;
  toDraft: (form: TForm) => TDraft;
  fromDraft: (draft: TDraft) => TForm;
  isEmpty: (draft: TDraft) => boolean;
}) {
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const restoreTimer = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  const onRestore = useCallback((draft: TDraft | null) => {
    if (!draft) {
      setStatus('idle');
      setSavedAt(null);
      return;
    }

    // "Draft restored" is an acknowledgement, not a permanent badge — it
    // decays into the quieter "Draft saved" so it doesn't nag.
    setStatus('restored');
    if (restoreTimer.current) window.clearTimeout(restoreTimer.current);
    restoreTimer.current = window.setTimeout(() => setStatus('saved'), 4000);
  }, []);

  const { clearDraft: clearStoredDraft } = useFormDraft<TForm, TDraft>({
    storageKey,
    enabled,
    methods,
    getDefaults,
    toDraft,
    fromDraft,
    isEmpty,
    onRestore,
  });

  const { watch, getValues } = methods;
  const values = watch();
  const skipFirstRef = useRef(true);

  // Mirrors useFormDraft's own debounce window so the chip flips to "Saved" at
  // the same moment the write actually lands, not before it.
  useEffect(() => {
    if (!enabled) return;

    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }

    const draft = toDraft(getValues());
    if (isEmpty(draft)) {
      setStatus('idle');
      setSavedAt(null);
      return;
    }

    setStatus('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      setStatus('saved');
      setSavedAt(Date.now());
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, values]);

  useEffect(() => {
    return () => {
      if (restoreTimer.current) window.clearTimeout(restoreTimer.current);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const clearDraft = useCallback(() => {
    clearStoredDraft();
    setStatus('idle');
    setSavedAt(null);
    skipFirstRef.current = true;
  }, [clearStoredDraft]);

  return { status, savedAt, clearDraft };
}
