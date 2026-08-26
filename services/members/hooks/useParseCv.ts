import { useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

import { parseCv } from '@/services/members/cv-import.service';
import type { ParsedProfile } from '@/components/page/member-details/ExperienceDetails/components/ExperienceImport';

/**
 * How long a read is allowed to hang before we stop waiting.
 *
 * A parse that never comes back would otherwise leave "Reading your-cv.pdf…"
 * spinning forever, with only a Cancel that reads as the person's fault. The
 * ceiling is generous — the target p95 is well under this — because cutting off
 * a slow-but-working parse is worse than waiting: the file is gone and there is
 * nothing to show for it.
 *
 * A timeout abort is deliberately indistinguishable from a failure downstream.
 * It lands in the panel's `failed` dead end ("we couldn't read that file just
 * now"), which is true, rather than in silence — silence is reserved for aborts
 * the person asked for.
 */
const PARSE_TIMEOUT_MS = 60_000;

/**
 * Reads a CV, once at a time.
 *
 * Owns the `AbortController` rather than leaving it to the panel, because the
 * panel is presentational and an abort is a fact about a request. Three things
 * end a read: the person pressing Cancel, a newer file superseding it, and the
 * timeout above. All three abort the same way, and the panel's own `readToken`
 * decides which of them are worth telling anybody about.
 */
export function useParseCv(uid: string) {
  const controllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation<ParsedProfile, Error, File>({
    mutationFn: async (file: File) => {
      /* A second file while one is in flight supersedes it — the person changed
         their mind about which document, and the old upload is bytes nobody is
         waiting for. */
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;
      const timer = setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS);

      try {
        return await parseCv(uid, file, controller.signal);
      } finally {
        clearTimeout(timer);
        /* Only clear the slot if it is still ours: a newer read may already have
           claimed it while this one was unwinding. */
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
  });

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  return {
    /** Hand straight to `ExperienceImportPanel.onParse`. */
    parse: mutation.mutateAsync,
    /** Hand straight to `ExperienceImportPanel.onAbort`. */
    abort,
    isParsing: mutation.isPending,
    error: mutation.error,
  };
}
