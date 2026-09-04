'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';

import { InfoCircleIconOutlined, SpinnerIcon } from '@/components/icons';
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
 * TEMPORARY — flip back to `true` to get the scenario picker back.
 *
 * The "Prototype — result to return" row above the drop box. It is review
 * scaffolding, not design (see where it renders), and it is the loudest thing in
 * a card whose point is the sentence above it, so it is off while the card is
 * being looked at.
 *
 * Hiding it costs the two states nobody reaches by accident: a parse missing a
 * start date, and a parse that finds nothing. Every drop returns the default
 * `three-roles` while this is `false`; the `?canvas=` states still pin the
 * others (`canvasStates.ts`), so they remain reachable by URL.
 */
const SHOW_SCENARIO_PICKER = false;

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
 * **The recognition still has to happen somewhere**, and for a while it was a
 * clause at the end of the formats line: "PDF, DOC or DOCX, up to 5MB. A
 * LinkedIn PDF export works too." Two things were wrong with that. It sat in
 * the one line on this box that is read as small print — the line you check to
 * see whether your file is allowed, not the line you read to find out what else
 * you could bring. And it named an artifact most people do not have and cannot
 * picture getting: someone who has never exported LinkedIn as a PDF does not
 * learn from that sentence that they could.
 *
 * So the fact is now a **standing note under the box** — see `LINKEDIN_HINT`.
 * It is not the second door coming back: it is prose rather than a control, it
 * opens no picker, offers no second drop area, and ends by pointing at the box
 * already on screen.
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
   * The document has been read — whatever it said.
   *
   * "The upload is the store": production posts the file before it parses it,
   * so by the time a review or a dead end is on screen the file already exists
   * on the server. Hosts that keep the CV (`StoredCv`) set it here, on this
   * event, rather than on the review's Save — Cancel on the review cancels the
   * fill-in, not the upload, and the resting card shows the new file either
   * way. Fires for a successful read *and* for "nothing found": a document the
   * parser could not read is still the person's CV.
   */
  onFileRead?: (file: File) => void;
  /**
   * The reading row's Cancel was pressed. Production's panel has the same
   * prop. Without it the press only resets the panel to its drop area — right
   * for a first upload, wrong over a kept CV, where the person cancelling a
   * replacement wants their file back, not an empty box. The host that has a
   * file to go back to closes the import here.
   */
  onCancelRead?: () => void;
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
 * Back to being only that. The LinkedIn clause that used to end the description
 * moved out to `LINKEDIN_HINT`, because this line answers "is my file allowed"
 * and that is a different question from "what could I bring". Leaving it in both
 * places would be one fact stated twice on one box, and the copy a person skips
 * would still be the copy carrying it.
 */
const DROPZONE_COPY = {
  title: 'Drag & drop your CV',
  description: 'PDF, DOC or DOCX, up to 5MB.',
  formats: ['PDF', 'DOC', 'DOCX'],
};

/**
 * The way in for someone who has no CV file: one standing note under the box.
 *
 * **It was a disclosure, and the toggle has been removed.** "No CV? Your
 * LinkedIn profile works too" sat above this sentence and revealed it on a
 * press. The argument for that was that the fact is useless without the two
 * clicks that make it true, so the clicks should be *asked for* rather than
 * preached. But the whole thing is one line long — and a press that reveals a
 * single sentence is a door in front of a door, charging a click for something
 * that could simply have been said. The instruction *is* the fact here; there is
 * no shorter honest version of it to show first.
 *
 * **Why not a tooltip.** A tooltip is for a gloss you read and release. This is
 * an instruction you carry into another tab, and it has to survive the trip — a
 * hover that vanishes, and does not exist at all on a phone, is the wrong
 * container for something you follow.
 *
 * **What keeps it from becoming the second door again.** It is prose, not a
 * control: nothing here is pressable, so there is nothing to choose between it
 * and Upload, and the last sentence sends the person back to the box that is
 * already open. One sentence, not three steps, because the two clicks are one
 * menu.
 */
const LINKEDIN_HINT = {
  /* Split so the menu path can carry a little weight — it is the part someone
     scans back to while looking at LinkedIn rather than at this page. */
  before: 'On LinkedIn, open your profile and choose ',
  path: 'More → Save to PDF',
  after: '. Drop that file here.',
};

const MAX_FILE_SIZE_MB = 5;

/**
 * WHEN A DOCUMENT GAVE US NOTHING.
 *
 * This used to be `parsed.experiences.length === 0`, and the dead end it raised
 * said "we couldn't find any roles in that file". Both were too narrow, in a way
 * that cost real data: this importer fills a role, a location, a skills row and
 * the contact details as well as a work history, so a CV whose positions are
 * laid out in a way the extractor can't follow — a two-column PDF, a table — but
 * whose skills list and headline read perfectly well was thrown away whole, and
 * told the person their file was unreadable while holding six things from it.
 *
 * So the question is now "did anything at all come back", and everything else
 * goes to the review, which shows the person exactly which parts landed. The
 * only case that reaches the dead end is a document that yielded nothing to
 * offer — which is the only case where "we couldn't read details" is true.
 */
const isEmptyParse = (parsed: ParsedProfile) =>
  parsed.experiences.length === 0 &&
  parsed.skills.length === 0 &&
  parsed.role.trim() === '' &&
  parsed.location.trim() === '' &&
  (parsed.name ?? '').trim() === '' &&
  (parsed.email ?? '').trim() === '';

export function ExperienceImportPanel({
  emptyLabel = '',
  onParsed,
  onAddManually,
  entry = 'door',
  initialFile,
  onFileRead,
  onCancelRead,
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
        onFileRead?.(picked);
        if (isEmptyParse(parsed)) {
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
          here, above the box and shown to everyone who took the LinkedIn door.
          It went with the door — it existed to explain why the thing the label
          promised wasn't what the door did, which is a sentence no door should
          need. The same facts now live *under* the box, in one sentence, behind
          a press: see `LINKEDIN_HINT` and the disclosure below. Requested, not
          preached, is the whole difference. */}

      {status === 'reading' ? (
        <div className={p.reading}>
          <SpinnerIcon className={p.spinner} />
          <div className={p.readingText}>
            {/* `canvasFileName` only ever fills in for a frame the canvas pinned,
                where no File was dropped. DELETE WITH: design-canvas/. */}
            <div className={p.readingTitle}>Reading {file?.name ?? canvasFileName ?? 'your file'}…</div>
            {file && <div className={p.readingMeta}>{formatFileSize(file.size)}</div>}
          </div>
          <button
            type="button"
            className={p.quietButton}
            onClick={() => {
              reset();
              onCancelRead?.();
            }}
          >
            Cancel
          </button>
        </div>
      ) : status === 'nothing-found' ? (
        /* An empty state that earns its place: a document really can carry
           nothing this importer can use — a scan, a photograph of a page, a file
           whose text layer is empty. Both ways out are offered, because "try
           again" is useless advice to someone whose file will never work.

           It is reached only when the parse came back *entirely* empty — see
           `isEmptyParse`. A file that gave up skills or a headline but no
           positions goes to the review instead, which can show what it got; this
           screen is for the file that gave up nothing, and its copy says so
           rather than naming one field.

           Wearing production's `.emptyData` rather than a lookalike, for two
           reasons. It *is* an empty state — the same grey 12px panel this
           section shows when there is nothing in it — and production scopes
           `.connectButton` **inside** `.emptyData`, so "Try another file" only
           gets its pill by being in one. A local copy of that rule would have
           rendered identically today and drifted from it later. */
        <div className={clsx(e.emptyData, p.emptyStack, p.deadEnd)}>
          {/* "Any details", not "any roles". The title names what the whole
              import was for, because that is what failed — the file gave up no
              positions AND no headline, skills or contact details. Naming only
              roles told someone whose skills list had been read perfectly well
              that their document was unreadable.

              The body still says "experience", and that is deliberate rather
              than an oversight: it is describing where the button below actually
              goes, which is the section's own Add form. A body promising to fill
              in a profile by hand next to a button that opens one five-field
              form would be the more general sentence and the less true one. */}
          <div className={p.deadEndTitle}>We couldn&apos;t read details from that file.</div>
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
              of the design.

              Currently hidden — see `SHOW_SCENARIO_PICKER` at the top of the
              file for how to get it back and what is unreachable while it's off. */}
          {SHOW_SCENARIO_PICKER && (
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
          )}

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

          {/* Under the box rather than beside the formats, and closer to the box
              than to the note below it — this is a way *into* the drop area, and
              `.panel`'s uniform 12px gap would otherwise assert it belongs to
              neither. See `.linkedinSteps` for the four pixels that fixes.

              The two asides here are still two tones and no more: this one is
              secondary and marked with the info glyph, because it is something
              to act on; the privacy note is tertiary and unmarked, because it is
              something to read once. */}
          <p className={p.linkedinSteps}>
            {/* The DS's own mark for a quiet inline note, not a new one:
                `DataIncomplete` — production's 12px/500 note row — reaches for
                this exact glyph beside this exact size of text, at a 4px gap.
                The *outlined* one, which is the half of that pair that means
                "here is a fact"; the filled `InfoCircleIcon` carries banners and
                tooltip triggers (`AiGeneratedTeamProfileBanner`,
                `FollowControl`), which are louder things than this.

                Rendered at 14px rather than its native 18: see the note on
                `.linkedinStepsIcon` for why it shrank once the line got a
                ground of its own to sit on. */}
            <InfoCircleIconOutlined width={14} height={14} className={p.linkedinStepsIcon} aria-hidden />
            <span>
              {LINKEDIN_HINT.before}
              <span className={p.linkedinPath}>{LINKEDIN_HINT.path}</span>
              {LINKEDIN_HINT.after}
            </span>
          </p>

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
