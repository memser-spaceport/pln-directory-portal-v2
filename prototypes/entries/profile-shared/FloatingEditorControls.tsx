'use client';

import { type MouseEvent, type RefObject, type SVGProps, useEffect, useState } from 'react';
import clsx from 'clsx';

// `EditIcon` is, path for path, the pencil `EditButton` draws inline beside
// its "Edit" — the glyph the return button now wears.
import { EditIcon, SpinnerIcon } from '@/components/icons';
// The bar's *position* — fixed, bottom, above the mobile nav, z-index 9, the
// arriving animation — is the AI Apps floating feedback control's, imported
// rather than re-drawn. Same job: something that has to stay in reach while the
// person is somewhere else on the page. Its pill and label are not used; the
// bar draws its own ground and puts the design system's rounded buttons in it.
import fab from '@/components/page/ai-apps/components/FloatingFeedbackButton/FloatingFeedbackButton.module.scss';
// The status line wears the editor's control row's title — the bar reports on
// that row at a distance, so it borrows the row's type rather than
// approximating it.
import efc from '@/components/common/profile/EditFormControls/EditFormControls.module.scss';
// The design system's rectangular Button — the one the drawer's Continue and
// the cards' own Cancel/Save wear. *"Make buttons also rectangular for both
// onboarding and job board drawer prototypes."* (The navbar's rounded pair
// stood here while the bar was a pill; see the stylesheet.)
import { Button } from '@/components/common/Button';

// The CV importer's wait — its three lines (title, progress bar, "usually
// takes…" hint) and the spinner that stands before them — drawn here exactly
// as the importer's own row draws them, from the same value. See `ImportWait`.
import { ImportWaitStatus, type ImportWait } from './ExperienceImport/ImportWait';
import panel from './ExperienceImport/ExperienceImportPanel.module.scss';

import s from './FloatingEditorControls.module.scss';

/** What the row says and does about the open card — shared by both hosts of it. */
interface CardProps {
  /** The card that is open — for editing, or for a CV read. Observed, and scrolled back to. */
  target: RefObject<HTMLElement | null>;
  /**
   * Whether there is something to save — whether the bar carries a Save. The
   * section editors pass their dirty state; a CV review passes `true`,
   * because everything on it is pending until its Save by definition.
   */
  canSave: boolean;
  /**
   * What the bar reports. A claim about the host's surface — which card is
   * open and what state it is in — so each host writes its own, naming the
   * card as its own header spells it: the profile says "Editing Office Hours"
   * and, once dirty, "Unsaved changes in Office Hours"; the new-member page
   * says "Reviewing your experience", the review card's own title. Not read
   * while `importWait` is set — the wait carries its own sentence.
   */
  status: string;
  /** What the Save button says. "Save changes" for an editor; a review names what it saves. */
  saveLabel?: string;
  /**
   * The CV importer's wait, while the card at `target` is uploading or
   * reading a file — `null` (or absent) otherwise. Optional and off by
   * default: only a host that mounts the importer has one, and a host that
   * doesn't (the profile's section editors) never learns this state exists.
   * While set, the bar draws the wait instead of an editor — see the note on
   * the component. The host gets it from the panel's `onWaitChange`, and
   * should hand over `null` once the review has opened so the bar's two
   * states never overlap in one render.
   */
  importWait?: ImportWait | null;
  /** Sticky chrome that visually covers the top of the viewport while the card scrolls underneath. */
  topOcclusion?: RefObject<HTMLElement | null>;
}

interface Props extends CardProps {
  /**
   * Which card is open, or `null` for none. A key rather than a boolean so
   * the observer re-attaches when one card closes and another opens in the
   * same render — the ref object is stable across that, and a boolean would
   * not have changed. And, the other way round, *one* key for one card across
   * its beats: the new-member page keys the CV card once for its read and the
   * review that follows, so the observer stays attached through the handoff
   * and the bar changes what it says without a frame of no bar.
   */
  activeKey: string | null;
  /**
   * The host's editor becomes a full-screen fixed takeover below
   * tablet-landscape (production `DetailsSection`'s `editView`), with its own
   * close and Save. There is no page to scroll away on, so the bar is not drawn
   * there. A host fact, not a shared rule: the profile's section editors
   * un-fix that layer and keep their cards in flow on every width, and on a
   * phone their bar is the only way back. A fact about the *open card*, more
   * precisely, not the page: the new-member page has both kinds — its CV
   * review is the takeover, its section editors are in flow — and passes
   * this only while the import is what is open.
   */
  takeoverBelowTabletLandscape?: boolean;
  /** How much of the card can remain visible once its head is gone before the bar appears. */
  visibleRatioThreshold?: number;
}

export type ScrollDirection = 'up' | 'down';

/** The open card is out of view: which one, and which way it went. */
export interface CardAway {
  key: string;
  direction: ScrollDirection;
}

/** The editor's head: the title row and the first field's label and box. */
const HEAD_PX = 160;

/**
 * **Whether the open card has been scrolled away** — `null` while it is in
 * view, or nothing is open.
 *
 * "Out of view" means both of: the card's head — its title and first field,
 * the top `HEAD_PX` — is off screen, *and* less than half of what could be on
 * screen is on screen (half the card, or half the viewport for a card taller
 * than the viewport). The first rule was "none of the card is visible", and
 * it was right on the 800px viewport it was tested on and never true on a
 * tall monitor: a mid-page card on a page that is only a screen and a half
 * long cannot be scrolled fully away, so the way back never appeared. *"Still
 * no floating button to scroll to editing."* The head clause is what keeps
 * the fix from nagging: pressing a pencil near the bottom of a tall screen
 * opens an editor whose body runs below the fold, and the person reading its
 * title is at the card, however little of the body they can see. (For the
 * reading card the head is the whole card — a header and a 100px row — so
 * the bar appears once that row has gone past the top.)
 *
 * Keyed rather than a boolean so a value left over from the last card can
 * never show the bar for the next one; see `activeKey`.
 */
export function useCardAway(
  target: RefObject<HTMLElement | null>,
  activeKey: string | null,
  { topOcclusion, visibleRatioThreshold = 0.5 }: Pick<Props, 'topOcclusion' | 'visibleRatioThreshold'> = {},
): CardAway | null {
  const [cardAway, setCardAway] = useState<CardAway | null>(null);

  useEffect(() => {
    const card = target.current;
    if (!activeKey || !card) return;
    /* Thresholds every 5% of the card, so the crossing is caught wherever it
       falls — "half of what could be on screen" is half the *viewport* for a
       card taller than it, which is some fraction of the card that depends on
       both heights. The observer also fires when the card's own size changes
       (the review is taller than the reading row it replaces), so the rule is
       re-read at the handoff without the key changing. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        const rect = entry.boundingClientRect;
        const rootTop = entry.rootBounds?.top ?? 0;
        const rootBottom = entry.rootBounds?.bottom ?? window.innerHeight;
        const rootHeight = rootBottom - rootTop;
        const occlusionBottom = topOcclusion?.current?.getBoundingClientRect().bottom ?? rootTop;
        const visibleTop = Math.min(Math.max(rootTop, occlusionBottom), rootBottom);
        const visible = Math.max(0, Math.min(rect.bottom, rootBottom) - Math.max(rect.top, visibleTop));
        const couldBeVisible = Math.min(rect.height, Math.max(1, rootHeight - (visibleTop - rootTop)));
        const headVisible = rect.top < rootBottom && rect.top + HEAD_PX > visibleTop;
        const away = !headVisible && visible < couldBeVisible * visibleRatioThreshold;
        const direction: ScrollDirection = rect.top >= rootBottom ? 'down' : 'up';
        setCardAway(away ? { key: activeKey, direction } : null);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [activeKey, target, topOcclusion, visibleRatioThreshold]);

  if (!activeKey || !cardAway || cardAway.key !== activeKey) return null;
  return cardAway;
}

/** The two presses, and the bar-as-a-whole press, for the card at `target`. */
function cardActions(target: RefObject<HTMLElement | null>, topOcclusion?: RefObject<HTMLElement | null>) {
  const back = () => {
    const el = target.current;
    if (!el) return;
    const occlusionBottom = topOcclusion?.current?.getBoundingClientRect().bottom ?? 0;
    scrollToTargetStart(el, occlusionBottom > 0 ? occlusionBottom + 12 : 0);
    /* `preventScroll`, or the focus jump fights the smooth scroll and the card
       lands wherever the browser's own focus-scroll put it. The field is the
       first one the editor draws — the same place a fresh open would start. */
    const field = el.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, [contenteditable="true"]');
    field?.focus({ preventScroll: true });
  };

  const handleBarClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    back();
  };

  const save = () => {
    /* The open form's own submit, so the same validation and the same
       `onSubmit` run as for the card's Save. `requestSubmit` rather than
       `submit()`: the latter skips validation and React's handler alike. */
    target.current?.querySelector('form')?.requestSubmit();
  };

  return { back, handleBarClick, save };
}

/**
 * **The bar's content, as a row in a bar the host already has.**
 *
 * The apply flow's drawer ends in a sticky footer holding Continue, and the
 * floating bar over that footer was a second bar standing on the first —
 * *"for job board drawer put progress bar in the footer, next to Continue to
 * apply."* So the drawer hosts mount this row in that footer (through a slot
 * the drawer hands the profile step, and a portal) and never draw the
 * floating wrap. Lesson 10's grid case: join the row the page already has.
 *
 * What it says follows the bar's rules: **only once the card is away**, for
 * the read as much as for an editor. While the card — its reading row, or
 * its own Cancel/Save — is in front of you the footer keeps its own hint
 * ("Save this card to continue."), and the read's row with its Cancel, or
 * the way back with Keep editing and Save, take that hint's place when you
 * leave — the editor without the bar's sentence, which the footer has no
 * room for beside Continue and no need of (see the note in the body).
 * Renders nothing otherwise, so the slot can collapse (`:empty`).
 */
export function EditorStatusRow({
  target,
  away,
  canSave,
  status,
  saveLabel = 'Save changes',
  importWait = null,
  topOcclusion,
}: CardProps & { away: CardAway | null }) {
  const { back, handleBarClick, save } = cardActions(target, topOcclusion);

  /* Both states wait for the card to be away — the read too. The first cut
     showed the read for its whole length, on the argument that a footer is
     standing chrome and progress there costs nothing; *"show loading CV only
     when CV is out of view."* The card's own row is the progress while it is
     in front of you, and a second copy of it an inch below is the same
     report twice. */
  if (!away) return null;

  if (importWait) {
    return (
      <div className={s.row} onClick={handleBarClick}>
        <ScrollArrowIcon className={s.directionMark} direction={away.direction} aria-hidden />
        <SpinnerIcon className={panel.spinner} />
        <ImportWaitStatus wait={importWait} live />
        <div className={s.actions}>
          <Button type="button" style="border" size="m" className={s.btn} onClick={importWait.cancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  /* No sentence here — *"Remove 'Review your…', keep there only arrow, make
     it same size as buttons."* The bar the row joined already names the step
     and holds Continue, and the row shares its width with that button, so
     the sentence was truncating before it said which card. The arrow then
     stood as a round button of its own beside Keep editing — two presses for
     one job — until *"let it be 1 button keep editing with the arrow"*: the
     way back wears the direction as its glyph, where the bar's Keep editing
     wears the pencil, and the sentence survives as its tooltip. Left-aligned
     (*"align arrow and buttons to the left"*): the row reads in the page's
     order — back to the card, its Save, and the step's Continue at the far
     end of the bar. */
  return (
    <div className={s.row}>
      <div className={s.actions}>
        <Button type="button" style="border" size="m" className={s.btn} onClick={back} title={status}>
          <ScrollArrowIcon className={s.btnIcon} direction={away.direction} aria-hidden />
          Keep editing
        </Button>
        {canSave && (
          <Button type="button" style="fill" size="m" className={s.btn} onClick={save}>
            {saveLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * **The status bar for an open card — what is pending, and the way back.**
 *
 * Shared by every surface that opens something in a card of a long page: the
 * profile's section editors (`member-profile-edit`) and the CV card on the
 * new-member page (`onboarding`), through its read and its review. It first
 * lived in the former and was asked for on the latter with a screenshot of a
 * review card scrolled off the top of a tall page — *"still nothing"* — so it
 * moved here rather than being copied. (The apply flow's drawer is the third
 * host of the *content* and not of the bar: it has a footer, and the row
 * goes there — see `EditorStatusRow`.)
 *
 * One bar, centred at the bottom of the viewport, that stands while the open
 * card is scrolled out of view. It has two things to say, and says one at a
 * time:
 *
 * **An editor is open.** It names what was left, and carries the way back
 * and — once there is something to save — the Save. It began as two separate
 * floating pills in the bottom-right corner (Keep editing beside Save);
 * *"instead of 2 floating buttons ... let's do 1 status bar in the center
 * with buttons appearing there."* The references bear it out — Aboard's
 * unpublished-contract bar ("This contract has not yet been published." ·
 * Cancel · Save), Google AI Studio's "Unsaved changes · Discard · Save", and
 * the selection bars in Higgsfield and Dovetail ("3 selected" and its
 * actions) all put one sentence and its actions in one centred object. Two
 * pills were two objects asking two things; a bar is one object saying what
 * is pending, with the presses beside the sentence they answer.
 *
 * - **Keep editing** — always. Scrolls the card back to the top of the view
 *   and puts focus in its first field.
 * - **Save** — once there is something to save. It *is* the card's own Save,
 *   at a distance: pressing it submits the open form (`requestSubmit`, so
 *   validation runs and a failed field gets focus and scrolls itself into
 *   view exactly as if the card's Save had been pressed).
 *
 * **A CV is being read** (`importWait`). *"Add status bar in this floating
 * status for CV uploading when it's loading."* The read is ten to thirty
 * seconds, and someone who dropped a file and scrolled off to look at
 * something else has the same two questions the importer's own row answers —
 * how far, and is it still going — with the row now off screen. So the bar
 * shows the row: the importer's own title ("Uploading <file>…", then
 * "Reading <file>…"), its 6px progress bar, its "Usually takes about N
 * seconds" line that turns into "Taking longer than usual — still reading",
 * and its spinner — all rendered from the *same* wait value the card's row
 * renders from (`ImportWaitStatus`), so the two can never disagree about
 * where the read is. The one control is the row's own Cancel, as the bordered
 * pill: there is no Save (nothing has landed yet) and no Keep editing
 * (nothing to edit yet — the card is a spinner). The bar is still one object;
 * this is what the object says during that beat, not a second bar.
 *
 * When the read finishes the review opens in the same card, the host drops
 * the wait, and the bar becomes the editor bar for that review — same key,
 * same observer, no frame without a bar.
 *
 * **Only while the card is out of view.** *"Show this bar only when scrolled
 * out of view."* The bar is a report about something you cannot see; while
 * the card and its own Cancel/Save — or its own reading row — are in front of
 * you it has nothing to add. (The Save had stood at every scroll position for
 * a day, after a tall-screen check found no floating control at all when the
 * whole form fit — that was two independent pills, and a Save with no bar
 * around it. With the sentence naming the card, the bar's whole meaning is
 * *you left this*, and the gate is the meaning, not a refinement of it.) The
 * rule itself is `useCardAway`.
 *
 * The status line wears `EditFormControls`' title type, so the sentence reads
 * as the editor's own row speaking from a distance; the wait's lines wear the
 * importer's, for the same reason. The buttons are the design system's
 * `Button` — Keep editing and Cancel bordered, Save filled — the same
 * control the cards' own Cancel/Save and the drawer's Continue are. They
 * were the navbar's rounded pair for a day, while the bar itself was a pill
 * (*"use rounded button components from ds"*); once the bar became a card
 * (*"rectangular not circular"*) its presses followed (*"make buttons also
 * rectangular"*), and the rounded lineage is gone from the bar entirely.
 *
 * Where the open card is a full-screen takeover below tablet-landscape
 * (the new-member page's CV card), the host says so and the bar is not
 * drawn there — see `takeoverBelowTabletLandscape`. Where the cards stay in
 * flow (the section editors, on either page), the bar stands on every width.
 *
 * Floating rather than in a bar in the page, because this is a control for
 * someone mid-task who has moved: the surface under them is whatever they
 * scrolled to, and the control has to stay in reach regardless. (Lesson 10's
 * detail-view case, not its grid case — there is no row on the page for it to
 * join that would be in view. The drawer *has* such a row, which is why it
 * gets `EditorStatusRow` instead.)
 */
export function FloatingEditorControls({
  target,
  activeKey,
  canSave,
  status,
  saveLabel = 'Save changes',
  takeoverBelowTabletLandscape = false,
  importWait = null,
  visibleRatioThreshold = 0.5,
  topOcclusion,
}: Props) {
  const away = useCardAway(target, activeKey, { topOcclusion, visibleRatioThreshold });
  const { back, handleBarClick, save } = cardActions(target, topOcclusion);

  /* The bar stands only while the card is away — see the note above. */
  if (!away) return null;

  return (
    <div className={clsx(fab.wrap, s.wrap, takeoverBelowTabletLandscape && s.desktopOnly)}>
      <FloatingEditorBar
        away={away}
        canSave={canSave}
        status={status}
        saveLabel={saveLabel}
        importWait={importWait}
        onBack={back}
        onSave={save}
        onClick={handleBarClick}
      />
    </div>
  );
}

/**
 * The bar itself — the card with the sentence and the presses, or the
 * reading row — without its position. `FloatingEditorControls` puts it in
 * the fixed wrap; the states sheet (`status-bar-states`) lays it on a page,
 * one per state, so every state can be seen without producing it.
 */
export function FloatingEditorBar({
  away,
  canSave,
  status,
  saveLabel = 'Save changes',
  importWait = null,
  onBack,
  onSave,
  onClick,
}: {
  away: CardAway;
  canSave: boolean;
  status: string;
  saveLabel?: string;
  importWait?: ImportWait | null;
  onBack: () => void;
  onSave: () => void;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}) {
  if (importWait) {
    return (
      /* The importer's reading row, at a distance: its spinner, its three
         lines, its Cancel. The spinner is the row's alive signal — the
         one thing a held bar cannot show — and it is not optional here
         either; the bar exists for the person who can no longer see the
         row, so it carries every signal the row does. */
      <div className={clsx(s.bar, s.barWait)} onClick={onClick}>
        <ScrollArrowIcon className={s.directionMark} direction={away.direction} aria-hidden />
        <SpinnerIcon className={panel.spinner} />
        <ImportWaitStatus wait={importWait} live />
        <div className={s.actions}>
          <Button type="button" style="border" size="m" className={s.btn} onClick={importWait.cancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.bar} onClick={onClick}>
      {/* The live region is the sentence, not the bar: a screen reader should
          hear what became pending, and buttons do not belong inside a
          status region. The sentence leads with a direction arrow, so the
          bar says where the open section is before the person presses it. */}
      <span className={clsx(efc.title, s.status)} role="status">
        <ScrollArrowIcon className={s.directionMark} direction={away.direction} aria-hidden />
        <span className={s.statusText}>{status}</span>
      </span>
      <div className={s.actions}>
        <Button type="button" style="border" size="m" className={s.btn} onClick={onBack}>
          <EditIcon className={s.btnIcon} aria-hidden />
          Keep editing
        </Button>
        {canSave && (
          <Button type="button" style="fill" size="m" className={s.btn} onClick={onSave}>
            {saveLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function ScrollArrowIcon({ direction, ...props }: { direction: ScrollDirection } & SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g transform={direction === 'up' ? 'rotate(180 8 8)' : undefined}>
        <path
          d="M8 3.5V12.5M8 12.5L4.5 9M8 12.5L11.5 9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * Scrolls whatever actually scrolls the card — the drawer's column, or the
 * page — so the card's top lands `topOffset` below the top of the view.
 *
 * The page host is the case that bit: this app scrolls its `<body>` (the
 * root layout gives it the overflow), not the document, so a walk that
 * stopped short of `body` found nothing and fell back to `window.scrollTo`,
 * which moves the document — a no-op here. *"On click on status bar on
 * onboarding … we should scroll user to the corresponding section."* The walk
 * now goes all the way up, and the last resort is the document's own
 * scrolling element rather than the window.
 */
function scrollToTargetStart(target: HTMLElement, topOffset: number) {
  const scrollHost = findScrollableParent(target) ?? document.scrollingElement ?? document.documentElement;
  /* The document's scroller has no box that moves with its content, so its
     origin is the viewport's top; any other scroller's is its own rect. */
  const hostTop = scrollHost === document.scrollingElement ? 0 : scrollHost.getBoundingClientRect().top;
  const nextTop = scrollHost.scrollTop + target.getBoundingClientRect().top - hostTop - topOffset;
  scrollHost.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
}

function findScrollableParent(target: HTMLElement): HTMLElement | null {
  let node = target.parentElement;
  while (node) {
    const overflowY = window.getComputedStyle(node).overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}
