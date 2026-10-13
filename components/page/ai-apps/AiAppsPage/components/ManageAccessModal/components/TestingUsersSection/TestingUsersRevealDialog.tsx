'use client';

import { useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { AiAppTestingUserAccess } from '@/services/ai-apps/testing-users.service';

import s from './TestingUsersSection.module.scss';

interface Props {
  items: AiAppTestingUserAccess[];
  onClose: () => void;
}

function formatExpiry(items: AiAppTestingUserAccess[]): string | null {
  const earliest = items
    .map((item) => new Date(item.expiresAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  return earliest ? earliest.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;
}

/**
 * Shows freshly minted Preview tokens exactly once. Closing the dialog drops
 * them: nothing is stored, so they can't be shown again.
 */
export function TestingUsersRevealDialog({ items, onClose }: Props) {
  // 'all' or a testing user uid: which copy action last reached the clipboard.
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const expiry = formatExpiry(items);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setCopyError(false);
    } catch {
      setCopied(null);
      setCopyError(true);
    }
  };

  // One line per testing user, name and token tab-separated (pastes into a spreadsheet or a load-test script).
  const allText = items.map((item) => `${item.name}\t${item.token}`).join('\n');

  return (
    <Modal
      isOpen
      onClose={onClose}
      className={s.revealModal}
      closeOnBackdropClick={false}
      ariaLabelledBy="ai-app-testing-tokens-title"
    >
      <div className={s.reveal}>
        <h3 id="ai-app-testing-tokens-title" className={s.title}>
          Testing user tokens
        </h3>
        <p className={s.notice}>
          Copy these tokens now. They are shown only once: after you close this window they can&apos;t be shown again.
          {expiry ? ` They stop working on ${expiry} (24 hours).` : ' They stop working after 24 hours.'}
        </p>
        {items.length === 0 ? (
          <p className={s.muted}>There are no active testing users to get tokens for.</p>
        ) : (
          <ul className={s.tokenList} aria-label="Tokens">
            {items.map((item) => (
              <li key={item.uid} className={s.tokenRow}>
                <span className={s.name}>{item.name}</span>
                <code className={s.token}>{item.token}</code>
                <button
                  type="button"
                  className={s.linkBtn}
                  onClick={() => copy(item.uid, item.token)}
                  aria-label={`Copy token for ${item.name}`}
                >
                  {copied === item.uid ? 'Copied' : 'Copy'}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className={s.status} role="status">
          {copyError
            ? 'Could not copy to the clipboard. Select the token and copy it by hand.'
            : copied
              ? copied === 'all'
                ? 'All tokens copied to the clipboard.'
                : 'Token copied to the clipboard.'
              : ''}
        </p>
        <div className={s.revealFooter}>
          {items.length > 1 && (
            <Button style="border" variant="neutral" size="s" onClick={() => copy('all', allText)}>
              {copied === 'all' ? 'Copied all' : 'Copy all'}
            </Button>
          )}
          <Button style="fill" variant="primary" size="s" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
