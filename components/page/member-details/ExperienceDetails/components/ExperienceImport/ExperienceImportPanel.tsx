'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { SpinnerIcon } from '@/components/icons';
import { formatFileSize } from '@/utils/file.utils';
// The host section's own empty row and its connect-button slot. `.connectButton`
// is nested inside `.emptyData` in four of these stylesheets (Experience, Teams,
// Contributions, Repositories) and rendered in none of them — the affordance for
// "connect a source and this section fills itself" was drawn and never wired.
// This is that button, finally used, in the sheet it was drawn in.
import e from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList/ExperiencesList.module.scss';

import { ResumeDropzone } from './ResumeDropzone';
import type { ParsedProfile } from './types';
import p from './ExperienceImportPanel.module.scss';

/**
 * One door: bring a CV, and the Experience section fills itself in.
 *
 * There is deliberately no second door labelled "Import from LinkedIn". It would
 * not be a second mechanism — `useLinkedInVerification` returns identity claims
 * (`sub`, `name`, `email`, `locale`, `picture`) and not one employer or date, so
 * the best a LinkedIn door could do is walk someone through LinkedIn's own
 * More → Save to PDF and drop the file into this same parser. A second door that
 * lands in the same place is not a signpost, it is a choice the person cannot
 * get right or wrong. Whatever file you have, this one door takes it.
 *
 * **The panel never writes.** It hands a `ParsedProfile` up, and the review — a
 * separate card with its own Cancel and Save — is where anything is agreed to. A
 * parse that quietly landed in someone's profile would be announcing, not
 * offering.
 *
 * **It doesn't parse either.** The caller injects `onParse`, so this component
 * stays presentational and the request, its abort signal and its retries live in
 * the host's mutation. That also keeps the panel testable without a network.
 */

interface ExperienceImportPanelProps {
  /** The section's own empty-state sentence, so the door sits under the words
   *  the profile already uses rather than under a second copy of them. Unused in
   *  `direct` mode, which has no empty row. */
  emptyLabel?: string;
  /**
   * Reads the document. Rejecting is a failure; resolving with no experiences is
   * a document that carried none. The two get different dead ends — see below.
   */
  onParse: (file: File) => Promise<ParsedProfile>;
  /** Drop an in-flight parse. Called on Cancel and on unmount. */
  onAbort: () => void;
  /** Reading finished and found something. The parent opens the review.
   *  Deliberately doesn't say which door it came through: nothing downstream
   *  reads that, and a passed-along value nobody uses is a prop waiting to grow
   *  a use. */
  onParsed: (parsed: ParsedProfile) => void;
  /** The way out of a dead end: the section's own Add form. */
  onAddManually: () => void;
  /**
   * The empty-row pill was pressed and the drop area is now showing.
   *
   * Analytics, kept out here rather than fired inside: the panel has no reason
   * to know what PostHog is, and the host already owns every other event in this
   * funnel. Absent in `direct` mode, where the drop area was never behind a
   * door.
   */
  onOpened?: () => void;
  /**
   * Cancel was pressed *while reading*.
   *
   * Distinct from `onAbort`, which also fires on unmount, on a superseding file
   * and on backing out of a dead end — so it cannot answer "how many people give
   * up waiting", which is the number that says whether the parse is too slow.
   */
  onCancelRead?: () => void;
  /**
   * How the panel is entered.
   *
   * `door` — the section's empty row with an "Upload your CV" pill, which opens
   * the drop area. Right when the panel is one option inside a section that has
   * other things in it.
   *
   * `direct` — the drop area straight away, with no pill and no "← Back". Right
   * when the panel IS the card: a host reached by pressing something that
   * already says "Update from CV" would otherwise be a button revealing a
   * button.
   */
  entry?: 'door' | 'direct';
  /** A file the host already collected — see `ResumeDropzone.externalFile`. */
  initialFile?: File | null;
  /**
   * What the person is told before handing over a document.
   *
   * A prop because the honest sentence is not the same on every surface. The
   * default states the general fact — read, not kept — which is true wherever
   * this panel mounts. The job board sharpens it to the promise its own reader
   * is actually wondering about ("it isn't sent with your applications"),
   * because there the file could plausibly be forwarded to a hiring team and
   * nowhere else can it.
   */
  privacyNote?: string;
}

type Status = 'idle' | 'reading' | 'nothing-found' | 'failed';

/**
 * The formats the drop area takes, and what it says about them.
 *
 * A LinkedIn "Save to PDF" export is a PDF, so it lands here with everything
 * else — which is exactly why a second door would be redundant. The copy stays
 * about the file rather than about where the file came from.
 */
/* PDF only, and that is the server's rule rather than a preference: the upload
   endpoint checks the mime type AND that the bytes start with `%PDF`
   (`assertPdfFile`), then extracts text with `pdf-parse`. A DOCX offered here
   would be accepted by the dropzone and refused by the endpoint — a rejection
   the person could have been spared by the sentence above the box. */
const DROPZONE_COPY = {
  title: 'Drag & drop your CV',
  description: 'PDF, up to 5MB. A LinkedIn PDF export works too.',
  formats: ['PDF'],
};

const MAX_FILE_SIZE_MB = 5;

export function ExperienceImportPanel({
  emptyLabel = '',
  onParse,
  onAbort,
  onParsed,
  onAddManually,
  onOpened,
  onCancelRead,
  entry = 'door',
  initialFile,
  privacyNote = 'We read the file to fill in your profile. The file itself is not kept.',
}: ExperienceImportPanelProps) {
  const [open, setOpen] = useState<boolean>(entry === 'direct');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  /**
   * Which read the panel is still interested in.
   *
   * Bumped by every cancel, every new file and unmount, so a resolution from a
   * superseded read is dropped by comparing tokens rather than by sniffing
   * whether the rejection was an `AbortError`. Cancelling and being overtaken
   * are the same event as far as this component is concerned, and neither is a
   * failure to report.
   */
  const readToken = useRef(0);

  /* `onAbort` through a ref so the unmount cleanup below can stay keyed on []
     and still call the current one — a cleanup that re-ran on every render of
     the parent would abort the parse it is meant to be waiting for.

     Kept in sync inside an effect rather than assigned during render, which
     `react-hooks/refs` forbids: a render can be thrown away, and a ref written
     by one that was would be reporting a callback that never mounted. */
  const abortRef = useRef(onAbort);
  useEffect(() => {
    abortRef.current = onAbort;
  }, [onAbort]);

  useEffect(
    () => () => {
      readToken.current += 1;
      abortRef.current();
    },
    [],
  );

  const reset = () => {
    readToken.current += 1;
    onAbort();
    setFile(null);
    setStatus('idle');
  };

  const closeDoor = () => {
    reset();
    setOpen(false);
  };

  const startReading = async (picked: File) => {
    readToken.current += 1;
    const token = readToken.current;

    setFile(picked);
    setStatus('reading');

    try {
      const parsed = await onParse(picked);
      if (token !== readToken.current) return;

      if (parsed.experiences.length === 0) {
        setStatus('nothing-found');
        return;
      }

      /* The panel's job ends here. It does not keep the parse — the parent
         does, because the parent owns which card is open. */
      setStatus('idle');
      setFile(null);
      onParsed(parsed);
    } catch {
      /* A cancelled or superseded read is the person changing their mind, and
         owes them nothing. Anything else is a failure, and says so — see the
         two dead ends below. */
      if (token !== readToken.current) return;
      setStatus('failed');
    }
  };

  /* ----------------------------------------------------------- the one door --- */

  if (!open) {
    return (
      <div className={p.panel}>
        {/* `.emptyData` is `space-between` — a sentence on the left and one
            `.connectButton` on the right — and with a single door that layout
            would fit again. It stays a column because the vertical gap between
            the sentence and the button was tuned deliberately; restoring the row
            would silently undo that. */}
        <div className={clsx(e.emptyData, p.emptyStack)}>
          <span className={e.label}>{emptyLabel}</span>
          <div className={p.doorRow}>
            <button
              type="button"
              className={e.connectButton}
              onClick={() => {
                setOpen(true);
                onOpened?.();
              }}
            >
              <UploadSimpleIcon />
              <span className={p.doorLabel}>Upload your CV</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- the panel --- */

  return (
    <div className={p.panel}>
      {/* One step back, to the empty state. Not a Cancel: leaving the importer
          altogether is the *card's* action, so it lives in the section header
          where every other section in this stack puts its control, and the host
          renders it. Two exits at two distances, each where its scope belongs.

          Absent in `direct` mode, where there is no empty state behind the drop
          area to go back to — a Back that returns you to where you already are
          is a control that does nothing. */}
      {entry === 'door' && (
        <div className={p.panelHead}>
          <button type="button" className={p.backLink} onClick={closeDoor}>
            ← Back
          </button>
        </div>
      )}

      {status === 'reading' ? (
        <div className={p.reading}>
          <SpinnerIcon className={p.spinner} />
          <div className={p.readingText}>
            <div className={p.readingTitle}>Reading {file?.name ?? 'your file'}…</div>
            {file && <div className={p.readingMeta}>{formatFileSize(file.size)}</div>}
          </div>
          <button
            type="button"
            className={p.quietButton}
            onClick={() => {
              onCancelRead?.();
              reset();
            }}
          >
            Cancel
          </button>
        </div>
      ) : status === 'nothing-found' || status === 'failed' ? (
        /* TWO DEAD ENDS, NOT ONE.
           A document really can carry no parseable positions — a one-page
           portfolio, a scan, a layout the extractor can't follow — and that is a
           true statement about the file. A request that never came back is not:
           telling someone "we couldn't find any roles in that file" when the
           server was down is a false claim about their document, and it sends
           them off to fix a file that is fine. Same shape, same two ways out,
           different sentence and different verb on the primary.

           Both wear `.emptyData` rather than a lookalike: it *is* an empty state
           — the same grey 12px panel this section shows when there is nothing in
           it — and `.connectButton` is scoped **inside** `.emptyData`, so the
           primary only gets its pill by being in one. A local copy of that rule
           would render identically today and drift later. */
        <div className={clsx(e.emptyData, p.emptyStack, p.deadEnd)}>
          <div className={p.deadEndTitle}>
            {status === 'failed' ? 'We couldn’t read that file just now.' : 'We couldn’t find any roles in that file.'}
          </div>
          <p className={p.deadEndBody}>
            {status === 'failed'
              ? 'Something went wrong on our end. Try again, or add your experience by hand — it’s five fields.'
              : 'Try a different file, or add your experience by hand — it’s five fields.'}
          </p>
          <div className={p.deadEndActions}>
            <button type="button" className={e.connectButton} onClick={reset}>
              <span className={p.doorLabel}>{status === 'failed' ? 'Try again' : 'Try another file'}</span>
            </button>
            <button type="button" className={p.quietButton} onClick={onAddManually}>
              Add manually
            </button>
          </div>
        </div>
      ) : (
        <>
          <ResumeDropzone
            title={DROPZONE_COPY.title}
            description={DROPZONE_COPY.description}
            supportedFormats={DROPZONE_COPY.formats}
            maxFileSize={MAX_FILE_SIZE_MB}
            file={file}
            externalFile={initialFile}
            onSelect={startReading}
            onRemove={() => setFile(null)}
          />

          {/* The one thing a person is entitled to know before handing over a
              document, in the place they hand it over — a promise nobody states
              is a promise nobody believes. Wording is the host's; see the prop. */}
          <p className={p.privacyNote}>{privacyNote}</p>
        </>
      )}
    </div>
  );
}

/** A plain upload arrow, at the 24px the `.connectButton` slot was drawn around. */
const UploadSimpleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M12 15.5V4.5M12 4.5L8 8.5M12 4.5L16 8.5M4.5 14.5V17.5C4.5 18.6046 5.39543 19.5 6.5 19.5H17.5C18.6046 19.5 19.5 18.6046 19.5 17.5V14.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
