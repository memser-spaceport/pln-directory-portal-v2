'use client';

/**
 * Embed this view (2026-11-20). One press in the toolbar → the gantry "standard modal" shell
 * (Modal + SubmitDealModal.module.scss) holding what Luma's calendar Embed page, Mural's and
 * Rows' Embed tabs hold: a live preview of what the other site will show, the iframe code, one
 * Copy. What it embeds is what you are looking at: the current view and every applied filter
 * (a topic, a city, a host), at `?embed=1`, which drops the navbar, header, city band and
 * toolbar. No options: the page itself is the editor (filter it, then embed it).
 */

import { useState } from 'react';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import m from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';

import s from './EmbedModal.module.scss';

export function EmbedModal({
  isOpen,
  onClose,
  src,
  scope,
  filterLabels,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** The embed URL: this page at ?embed=1 with the view and filters. */
  src: string;
  /** What the embed shows, in words ("Upcoming events · #AI · Lisbon"). */
  scope: string;
  /** The applied filters' chip labels ("AI", "Lisbon"); they name the iframe for screen readers. */
  filterLabels: string[];
}) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  // The iframe's title is what a screen reader announces for the embed, so it names what's in it.
  const frameTitle = filterLabels.length ? `Protocol Labs events: ${filterLabels.join(' · ')}` : 'Protocol Labs events';
  const attr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const code = `<iframe src="${attr(src)}" width="100%" height="640" style="border: 1px solid #e2e8f0; border-radius: 12px;" title="${attr(frameTitle)}"></iframe>`;

  const copy = (what: 'code' | 'link') => {
    try {
      void navigator.clipboard?.writeText(what === 'code' ? code : src);
    } catch {
      /* The text stays selectable in the box. */
    }
    setCopied(what);
    window.setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabelledBy="embed-title" lockScroll>
      <div className={`${m.root} ${s.root}`}>
        <div className={m.header}>
          <div className={m.headerText}>
            <h2 id="embed-title" className={m.title}>
              Embed these events
            </h2>
            <p className={m.subtitle}>{scope}</p>
          </div>
          <button type="button" className={m.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={`${m.content} ${s.content}`}>
          <div className={s.previewFrame}>
            {isOpen && <iframe src={src} title={`Preview: ${frameTitle}`} className={s.preview} />}
          </div>

          <div className={m.fieldGroup}>
            <span className={m.fieldLabel}>Embed code</span>
            <pre className={s.code}>{code}</pre>
            <span className={m.helperText}>
              New events that match appear on their own. Change <code>height</code> to fit your page.
            </span>
          </div>
        </div>

        <div className={m.footer}>
          <button type="button" className={s.linkBtn} onClick={() => copy('link')}>
            {copied === 'link' ? 'Link copied' : 'Copy link'}
          </button>
          <div className={m.footerActions}>
            <Button style="fill" variant="primary" size="s" onClick={() => copy('code')}>
              {copied === 'code' ? 'Code copied' : 'Copy code'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
