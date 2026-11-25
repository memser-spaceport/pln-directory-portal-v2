'use client';

import { useEffect, useRef, useState } from 'react';

import type { EmbedDetails } from '@/analytics/events.analytics';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Modal } from '@/components/common/Modal';
import { toast } from '@/components/core/ToastContainer';
import { CloseIcon } from '@/components/icons';
import { withEmbedDetails } from '@/services/events/all-events.filters';
import m from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';

import type { CalMode } from './calendar/weeks';
import type { AllEventsView } from './icons';
import s from './EmbedModal.module.scss';

/** How long "Link copied" / "Code copied" stays on the pressed button. */
export const COPIED_MS = 2000;

/**
 * "List view · Lisbon", "Month calendar · All live & upcoming events", "Map view · All past events": what the embed
 * shows, under the dialog's title.
 */
export function embedScopeLine(
  view: AllEventsView,
  calMode: CalMode,
  filterLabels: string[],
  past: boolean = false,
): string {
  const viewName =
    view === 'calendar'
      ? `${calMode === 'month' ? 'Month' : 'Week'} calendar`
      : view === 'map'
        ? 'Map view'
        : 'List view';
  const all = past ? 'All past events' : 'All live & upcoming events';
  return [viewName, ...(filterLabels.length ? filterLabels : [all])].join(' · ');
}

/** The iframe's `title`, which a screen reader announces for the embed, so it names the filters. */
export function embedFrameTitle(filterLabels: string[]): string {
  return filterLabels.length ? `Protocol Labs events: ${filterLabels.join(' · ')}` : 'Protocol Labs events';
}

const attr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * The code another site pastes: one line, the same link Copy link copies. `clipboard-write` lets the event drawer's
 * Copy link work inside the frame (LAB-3392); a browser refuses the clipboard to another site's frame without it.
 */
export function embedCode(src: string, title: string): string {
  return `<iframe src="${attr(src)}" width="100%" height="640" style="border: 1px solid #e2e8f0; border-radius: 12px;" title="${attr(title)}" allow="clipboard-write" loading="lazy"></iframe>`;
}

type Copied = 'link' | 'code';

/**
 * "Embed these events" (LAB-3365, Polina's design on LAB-3352; prototype `events-page-redesign/EmbedModal.tsx`): the
 * standard modal shell (Modal + SubmitDealModal.module.scss) with what the embed shows, a live preview of it, the iframe
 * code, and Copy link / Copy code. The page is the editor for what it shows (filter it, then embed it); the one option
 * is where an event's details open (LAB-3392): in the embed by default, or on LabOS in a new tab (`details=labos`).
 *
 * Ours, not in the prototype: a refused clipboard shows an error toast and leaves the button as it was (the prototype
 * says "copied" anyway); the code has `loading="lazy"`; focus goes back to the Embed button on close.
 */
export function EmbedModal({
  isOpen,
  onClose,
  link,
  previewSrc,
  scope,
  frameTitle,
  onCopied,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** The full embed link (`<origin>/events/embed?…`), before the details option: what Copy link copies and the code's `src`. */
  link: string;
  /** The same link on this origin, for the preview. */
  previewSrc: string;
  scope: string;
  frameTitle: string;
  /** After a copy the clipboard took, with where the copied embed opens an event. */
  onCopied: (what: Copied, details: EmbedDetails) => void;
}) {
  // Not kept between openings: each embed starts from the default.
  const [onLabOs, setOnLabOs] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setOnLabOs(false);
  }
  const fullLink = withEmbedDetails(link, onLabOs);
  const code = embedCode(fullLink, frameTitle);
  const [copied, setCopied] = useState<Copied | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Focus moves into the dialog on open and back to what opened it (the Embed button) on close.
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (isOpen) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      closeBtn.current?.focus();
      return;
    }
    returnTo.current?.focus();
    returnTo.current = null;
  }, [isOpen]);

  const copy = async (what: Copied) => {
    try {
      await navigator.clipboard.writeText(what === 'code' ? code : fullLink);
    } catch {
      toast.error(what === 'code' ? 'Could not copy the code' : 'Could not copy the link');
      return;
    }
    setCopied(what);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), COPIED_MS);
    onCopied(what, onLabOs ? 'labos' : 'embed');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabelledBy="events-embed-title" lockScroll inertBackground>
      <div className={`${m.root} ${s.root}`} data-testid="events-embed-dialog">
        <div className={m.header}>
          <div className={m.headerText}>
            <h2 id="events-embed-title" className={m.title}>
              Embed these events
            </h2>
            <p className={m.subtitle}>{scope}</p>
          </div>
          <button ref={closeBtn} type="button" className={m.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={`${m.content} ${s.content}`}>
          <div className={s.previewFrame}>
            {isOpen && (
              <iframe
                src={withEmbedDetails(previewSrc, onLabOs)}
                title={`Preview: ${frameTitle}`}
                className={s.preview}
              />
            )}
          </div>

          <div className={m.fieldGroup}>
            <span className={m.fieldLabel} id="events-embed-code-label">
              Embed code
            </span>
            <pre className={s.code} aria-labelledby="events-embed-code-label" tabIndex={0}>
              {code}
            </pre>
            <span className={m.helperText}>
              New events that match appear on their own. Change <code>height</code> to fit your page.
            </span>
          </div>

          <label className={s.option}>
            <Checkbox checked={onLabOs} onChange={setOnLabOs} aria-labelledby="events-embed-details-label" />
            <span className={s.optionText}>
              <span id="events-embed-details-label" className={s.optionLabel}>
                Open event details on LabOS
              </span>
              <span className={m.helperText}>
                In a new tab. Otherwise they open inside the embed, with a link to RSVP on LabOS.
              </span>
            </span>
          </label>
        </div>

        <div className={m.footer}>
          <button type="button" className={s.linkBtn} onClick={() => void copy('link')}>
            {copied === 'link' ? 'Link copied' : 'Copy link'}
          </button>
          <div className={m.footerActions}>
            <Button style="fill" variant="primary" size="s" onClick={() => void copy('code')}>
              {copied === 'code' ? 'Code copied' : 'Copy code'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
