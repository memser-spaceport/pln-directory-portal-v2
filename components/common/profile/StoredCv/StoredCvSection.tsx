'use client';

import React, { useState } from 'react';

import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { useRemoveStoredCv } from '@/services/members/hooks/useRemoveStoredCv';

import { CvFileCard } from './CvFileCard';
import { CvHeaderActions } from './CvHeaderActions';
import { RemoveCvDialog } from './RemoveCvDialog';
import type { StoredCv } from './types';

interface StoredCvSectionProps {
  cv: StoredCv;
  memberUid: string;
  /**
   * Someone picked a different document.
   *
   * The section does not import it — the host owns the importer (the drawer's
   * `CvFirstCard`, the profile's Experience section), and handing the file up is
   * what keeps one upload mechanism on the page instead of two. The host is also
   * the only thing that knows where the review should appear.
   */
  onReplace?: (file: File) => void;
  /** Fired after a replace is accepted, so a host tracking hand-off can reset. */
  onReplaced?: () => void;
  /**
   * The section's heading.
   *
   * "Your CV" is only true on your own profile. The read is wider than the
   * write — a directory admin, and a lead of a team you applied to, can both
   * reach this card on someone else's page — and a heading that calls their
   * document yours is a small lie the rest of the card then builds on.
   */
  title?: string;
  /**
   * Whether this reader may act on the document, not merely read it.
   *
   * The API draws that line itself and draws it in a different place:
   * `assertCanView` lets a lead read the CV of someone who applied to their
   * role, `assertCanManage` does not let them replace or remove it. Drawing
   * Replace and Remove for them would be offering two presses that answer 403 —
   * and Remove would offer it behind a confirmation dialog, which is the worst
   * possible place to discover you were never allowed.
   */
  canManage?: boolean;
}

/**
 * The CV a profile is holding, at rest.
 *
 * Drawn instead of the upload offer, never beside it — `pickCvImportHost`
 * returns `'stored'` and every other door stands down, because while this card
 * is on screen it is the document's only one.
 *
 * **Replace and Remove are in the header, not on the card.** They are actions on
 * the section, and every other section on these pages puts its controls in that
 * slot; the card itself is the file, and its only press opens it. See
 * `CvHeaderActions` and `CvFileCard`.
 *
 * **Removing the document does not remove what it filled.** The role, skills and
 * experience an import wrote are ordinary profile fields by the time anyone
 * reaches this card — nothing records that a document put them there, and they
 * may have been edited by hand since. `RemoveCvDialog` says so before the press,
 * because "remove" over a file that visibly produced half the page invites
 * exactly the opposite assumption.
 */
export function StoredCvSection({
  cv,
  memberUid,
  onReplace,
  onReplaced,
  title = 'Your CV',
  canManage = true,
}: StoredCvSectionProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const { mutate: remove, isPending } = useRemoveStoredCv(memberUid);

  return (
    <DetailsSection>
      <DetailsSectionHeader title={title}>
        {canManage && (
          <CvHeaderActions
            onReplace={(file) => {
              onReplace?.(file);
              onReplaced?.();
            }}
            onRemove={() => setConfirmingRemove(true)}
          />
        )}
      </DetailsSectionHeader>

      <CvFileCard cv={cv} />

      <RemoveCvDialog
        isOpen={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        onConfirm={() => {
          if (isPending) return;
          /* Closed on success rather than on press: the dialog staying up is the
             only thing on screen saying the removal is still going, and closing
             first would leave the card sitting there looking untouched. */
          remove(undefined, { onSuccess: () => setConfirmingRemove(false) });
        }}
      />
    </DetailsSection>
  );
}
