'use client';

import React, { useCallback, useState } from 'react';

import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { StoredCvSection } from '@/components/common/profile/StoredCv';
import {
  ExperienceImportPanel,
  ExperienceImportReview,
  formatParsedDates,
  useCvImport,
} from '@/components/page/member-details/ExperienceDetails/components/ExperienceImport';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { useStoredCv } from '@/services/members/hooks/useStoredCv';
import { IMember } from '@/types/members.types';

interface MemberCvSectionProps {
  member: IMember;
}

/**
 * The CV this profile holds, on the member's own page.
 *
 * **Only drawn once there is one.** With no CV this renders nothing and the
 * Experience section keeps the offer it has always made — which is the ticket's
 * own first scenario, and the reason this is not a permanent card: a second
 * upload door standing open beside Experience's would be two entrances to one
 * mechanism, and the profile already has a rule against that.
 *
 * **It owns the importer for its own Replace.** The alternative was to hand the
 * file down to the Experience section's panel, which would make a replace a
 * conversation between two sections about whose editor is open. Here the card
 * that offers Replace is the card that reads the file, and the Experience
 * section's "Update from CV" stands down for as long as this is on screen —
 * `ExperienceDetails` asks the same query, so the two cannot disagree about
 * whether a CV exists.
 *
 * Mounted only on the owner's own profile. The document is theirs; nothing about
 * it belongs on a visitor's view, and the card's controls act on their record.
 */
export function MemberCvSection({ member }: MemberCvSectionProps) {
  const { data: storedCv } = useStoredCv(member.id);

  /** A replacement on its way to the panel — the card stands aside while it is set. */
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const { onCvImportCancelled } = useMemberAnalytics();
  const {
    parsed,
    setParsed,
    parseAndReport,
    abort,
    submitImport,
    currentExperiences,
    currentRole,
    hasLocation,
    currentSkills,
  } = useCvImport(member);

  /* The review is a fullscreen layer on mobile, and the bottom nav would sit on
     top of its Save — the same treatment the Experience section gives its own. */
  useMobileNavVisibility(reviewing);

  const closeImport = useCallback(() => {
    abort();
    setParsed(null);
    setReviewing(false);
    setReplacementFile(null);
  }, [abort, setParsed]);

  if (!storedCv && !replacementFile) {
    return null;
  }

  if (reviewing && parsed) {
    return (
      <DetailsSection editView>
        <ExperienceImportReview
          parsed={parsed}
          currentRole={currentRole}
          hasLocation={hasLocation}
          currentSkills={currentSkills}
          currentExperiences={currentExperiences}
          formatDates={formatParsedDates}
          onClose={() => {
            onCvImportCancelled('review');
            closeImport();
          }}
          /* The document is already stored by this point — the upload is what
             replaced it — so closing the review afterwards returns to the card
             showing the new file, not to the old one. */
          onSubmit={async (selection) => {
            await submitImport(selection);
            closeImport();
          }}
        />
      </DetailsSection>
    );
  }

  if (replacementFile) {
    return (
      <DetailsSection editView>
        <ExperienceImportPanel
          initialFile={replacementFile}
          privacyNote="We read the file to fill in your experience. It isn't sent with your applications."
          onParse={parseAndReport}
          onAbort={abort}
          onParsed={(result) => {
            setParsed(result);
            setReviewing(true);
          }}
          /* The dead end's way out. In the apply drawer this has to hand the
             importer back to another card before an Add form exists to reach;
             here the Experience section is already on the page with its own Add
             control, so closing *is* the hand-off — the destination is visible
             the moment this card steps aside. */
          onAddManually={closeImport}
          onCancelRead={() => {
            onCvImportCancelled('reading');
            closeImport();
          }}
        />
      </DetailsSection>
    );
  }

  return <StoredCvSection cv={storedCv!} memberUid={member.id} onReplace={setReplacementFile} />;
}
