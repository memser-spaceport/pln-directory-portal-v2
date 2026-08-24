'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';

import { SpinnerIcon } from '@/components/icons';
import { formatFileSize } from '@/utils/file.utils';
// The host section's own empty row and its connect-button slot. Production keeps
// `.connectButton` nested inside `.emptyData` in four of these stylesheets
// (Experience, Teams, Contributions, Repositories) and renders it in none of
// them — the affordance for "connect a source and this section fills itself" was
// drawn and never wired. This is that button, finally used, in the sheet it was
// drawn in.
import e from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList/ExperiencesList.module.scss';

import { PARSE_CANCELLED, PARSE_SCENARIOS, parseDocument, type ParseScenario } from './parseMocks';
import { ResumeDropzone } from './ResumeDropzone';
import type { ParsedProfile } from './types';
import p from './ExperienceImportPanel.module.scss';

/**
 * One door: bring a CV, and the Experience section fills itself in.
 *
 * **There was a second one, labelled "Import from LinkedIn", and it is gone.**
 * It never was a second mechanism. Nothing anyone can ship turns a LinkedIn
 * handle into a work history — production's own OAuth
 * (`useLinkedInVerification`) returns `ILinkedinProfile.profileData`: `sub`,
 * `name`, `email`, `locale`, `picture`, and not one employer or date, which is
 * why `ExperiencesList` carries a **commented-out** `Connect LinkedIn` button in
 * this exact empty state. So the door did the only thing that works: walked you
 * through LinkedIn's own More → Save to PDF and dropped the file into this same
 * parser.
 *
 * That was defended here as "one mechanism with two signposts, because people
 * look for the word LinkedIn". The defence was the tell. A second door that
 * lands in the same place is not a signpost, it is a decision the person has to
 * make and cannot get right or wrong — and it cost a three-step how-to
 * explaining why the door they had just chosen could not do the thing its label
 * implied. Whatever file you have — a CV, a LinkedIn export — this one door
 * takes it.
 *
 * **What the panel does not do.** It never writes. It hands a `ParsedProfile`
 * up and the review — a separate card, with Cancel and Save — is where anything
 * is agreed to. A parse that quietly landed in someone's public profile would be
 * announcing, not offering.
 */

interface ExperienceImportPanelProps {
  /** Production's own empty-state sentence, so the door sits under the words the
   *  profile page already uses rather than under a second copy of them.
   *  Unused in `direct` mode, which has no empty row. */
  emptyLabel?: string;
  /** Reading finished and found something. The parent opens the review.
   *  Deliberately doesn't hand over which door it came through: nothing
   *  downstream reads that, and a passed-along value nobody uses is a prop
   *  waiting to grow a use. */
  onParsed: (parsed: ParsedProfile) => void;
  /** The third door, from the dead end: the section's own Add form. */
  onAddManually: () => void;
  /**
   * How the panel is entered.
   *
   * `door` — the section's empty row with an "Upload your CV" pill, which opens
   * the drop area. Right when the panel is one option inside a section that has
   * other things in it.
   *
   * `direct` — the drop area straight away, with no pill and no "← Back". Right
   * when the panel IS the card: a host whose own title already says "start with
   * your CV" would otherwise be a button that reveals a button.
   */
  entry?: 'door' | 'direct';
  /** A file the host already collected — see `ResumeDropzone.externalFile`. */
  initialFile?: File | null;
  /**
   * What the person is told before handing over a document.
   *
   * A prop because the honest sentence is not the same on every surface. The
   * default states the general fact — read, not kept — which is true wherever
   * this panel mounts. The job board overrides it with the sharper promise its
   * own reader is actually wondering about ("it isn't sent with your
   * applications"), because there the file could plausibly be forwarded to a
   * hiring team and nowhere else can it.
   *
   * This was hardcoded to the job board's wording until the panel reached a
   * third surface, at which point two of the three were promising something
   * about applications that do not exist there.
   */
  privacyNote?: string;
  /**
   * DELETE WITH: the `design-canvas/` folder.
   *
   * Whether the drop area is open and what the panel is doing, forced from
   * outside so the design canvas can photograph each beat. All of it lives in
   * this component's own `useState` — a person reaches it by pressing the door
   * and dropping a file, and neither of those is a URL — so without this the
   * canvas could only ever hold the empty state.
   *
   * `reading` also needs a name to show beside the spinner, because the real
   * one comes from a `File` nobody dropped.
   */
  canvasOpen?: boolean;
  canvasStatus?: Status;
  canvasFileName?: string;
}

type Status = 'idle' | 'reading' | 'nothing-found';

/**
 * The formats the drop area takes, and what it says about them.
 *
 * A LinkedIn "Save to PDF" export is a PDF, so it lands here with everything
 * else — which is exactly why the second door was redundant. The copy stays
 * about the file rather than about where the file came from.
 */
const DROPZONE_COPY = {
  title: 'Drag & drop your CV',
  description: 'PDF, DOC or DOCX, up to 5MB. A LinkedIn PDF export works too.',
  formats: ['PDF', 'DOC', 'DOCX'],
};

const MAX_FILE_SIZE_MB = 5;

export function ExperienceImportPanel({
  emptyLabel = '',
  onParsed,
  onAddManually,
  entry = 'door',
  initialFile,
  privacyNote = 'We read the file to fill in your profile. The file itself is not kept.',
  canvasOpen,
  canvasStatus,
  canvasFileName,
}: ExperienceImportPanelProps) {
  /* The canvas props seed the initial state and then stop mattering — every
     control still works from there, so a frame is a real screen a person could
     have pressed their way to, not a locked one. DELETE WITH: design-canvas/. */
  const [open, setOpen] = useState<boolean>(entry === 'direct' ? true : (canvasOpen ?? false));
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>(canvasStatus ?? 'idle');
  const [scenario, setScenario] = useState<ParseScenario>('three-roles');
  const cancelRef = useRef<(() => void) | null>(null);

  const reset = () => {
    cancelRef.current?.();
    cancelRef.current = null;
    setFile(null);
    setStatus('idle');
  };

  const closeDoor = () => {
    reset();
    setOpen(false);
  };

  const startReading = (picked: File) => {
    setFile(picked);
    setStatus('reading');

    const { result, cancel } = parseDocument(scenario);
    cancelRef.current = cancel;

    result
      .then((parsed) => {
        cancelRef.current = null;
        if (parsed.experiences.length === 0) {
          setStatus('nothing-found');
          return;
        }
        /* The panel's job ends here. It does not keep the parse — the parent
           does, because the parent owns which card is open. */
        setStatus('idle');
        setFile(null);
        onParsed(parsed);
      })
      .catch((reason) => {
        /* Cancelling is the person changing their mind, not a failure. Anything
           else can't happen here — `parseDocument` resolves empty rather than
           throwing — but swallowing it silently would hide a real one later. */
        if (reason !== PARSE_CANCELLED) setStatus('nothing-found');
      });
  };

  /* ----------------------------------------------------------- the one door --- */

  if (!open) {
    return (
      <div className={p.panel}>
        {/* Production's `.emptyData` is `space-between` — a sentence on the left
            and one `.connectButton` on the right — and with a single door that
            layout would now fit again. It stays a column because the vertical
            gap between the sentence and the button was tuned deliberately;
            restoring the row would silently undo that. */}
        <div className={clsx(e.emptyData, p.emptyStack)}>
          <span className={e.label}>{emptyLabel}</span>
          <div className={p.doorRow}>
            <button type="button" className={e.connectButton} onClick={() => setOpen(true)}>
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
          <button type="button" className={p.backLink} onClick={() => closeDoor()}>
            ← Back
          </button>
        </div>
      )}

      {/* A three-step "open LinkedIn → More → Save to PDF" block used to sit
          here, shown only behind the LinkedIn door. It went with the door: it
          existed to explain why the thing the label promised wasn't what the
          door did, which is a sentence no door should need. */}

      {status === 'reading' ? (
        <div className={p.reading}>
          <SpinnerIcon className={p.spinner} />
          <div className={p.readingText}>
            {/* `canvasFileName` only ever fills in for a frame the canvas pinned,
                where no File was dropped. DELETE WITH: design-canvas/. */}
            <div className={p.readingTitle}>Reading {file?.name ?? canvasFileName ?? 'your file'}…</div>
            {file && <div className={p.readingMeta}>{formatFileSize(file.size)}</div>}
          </div>
          <button type="button" className={p.quietButton} onClick={reset}>
            Cancel
          </button>
        </div>
      ) : status === 'nothing-found' ? (
        /* An empty state that earns its place: a document really can carry no
           parseable positions — a one-page portfolio, a scan, a CV in a layout
           the extractor can't follow. Both ways out are offered, because "try
           again" is useless advice to someone whose file will never work.

           Wearing production's `.emptyData` rather than a lookalike, for two
           reasons. It *is* an empty state — the same grey 12px panel this
           section shows when there is nothing in it — and production scopes
           `.connectButton` **inside** `.emptyData`, so "Try another file" only
           gets its pill by being in one. A local copy of that rule would have
           rendered identically today and drifted from it later. */
        <div className={clsx(e.emptyData, p.emptyStack, p.deadEnd)}>
          <div className={p.deadEndTitle}>We couldn&apos;t find any roles in that file.</div>
          <p className={p.deadEndBody}>Try a different file, or add your experience by hand — it&apos;s five fields.</p>
          <div className={p.deadEndActions}>
            <button type="button" className={e.connectButton} onClick={reset}>
              <span className={p.doorLabel}>Try another file</span>
            </button>
            <button type="button" className={p.quietButton} onClick={onAddManually}>
              Add manually
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* SCAFFOLDING. There is no parser in a prototype, so which result comes
              back is the reviewer's choice — otherwise the two states that matter
              most (a missing start date, and finding nothing) are states nobody
              ever sees. Delete this row the day extraction is real; it is not part
              of the design. */}
          <div className={p.mockRow}>
            <span className={p.mockLabel}>Prototype — result to return:</span>
            {PARSE_SCENARIOS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={clsx(p.mockOption, { [p.mockOptionOn]: scenario === option.value })}
                onClick={() => setScenario(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

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
