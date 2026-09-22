'use client';

import React, { useCallback, useState } from 'react';

import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
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
  /** Whether the reader is the member. Decides everything this card offers. */
  isOwner: boolean;
}

/** The note the owner reads before handing over a document. */
const PRIVACY_NOTE = "We read the file to fill in your experience. It isn't sent with your applications.";

/**
 * The CV this profile holds.
 *
 * **Who sees it is the API's answer, not ours.** `GET /cv-imports/latest` is
 * guarded by `assertCanView`: the member, a directory admin, or a lead of a team
 * this member applied to — and that last clause is a `jobApplication` lookup no
 * client can perform. So this mounts for every signed-in reader, asks, and draws
 * what comes back; a refusal arrives as `null` (see `getStoredCv`) and is
 * indistinguishable here from "there is no CV", which is what it should be.
 *
 * **For the owner the section is permanent.** With a CV it is the resting card;
 * without one it is the drop area. A document needs one home rather than an
 * offer that appears in the Experience section and vanishes the moment somebody
 * types a job in by hand.
 *
 * **It owns the importer for its own Replace.** The alternative was to hand the
 * file down to the Experience section's panel, which would make a replace a
 * conversation between two sections about whose editor is open. Here the card
 * that offers Replace is the card that reads the file.
 *
 * Only the owner is offered anything: Replace and Remove answer to
 * `assertCanManage`, which is narrower than the read, so a lead or an admin gets
 * the document and none of the controls.
 */
export function MemberCvSection({ member, isOwner }: MemberCvSectionProps) {
  const { data: storedCv, isError, isFetching } = useStoredCv(member.id);

  /** A replacement on its way to the panel — the card stands aside while it is set. */
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [reviewing, setReviewing] = useState(false);
  /**
   * Remounts the resting drop area.
   *
   * The Replace panel leaves by being unmounted, and the Experience section's
   * empty-row panel leaves by the section switching to its Add form. This one
   * has nowhere to go: it *is* the resting state, so after a failed read its
   * "Add manually" — whose destination is the Experience section below — would
   * press against a dead end that stays on screen. Bumping the key puts the box
   * back.
   */
  const [panelKey, setPanelKey] = useState(0);

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
    setPanelKey((key) => key + 1);
  }, [abort, setParsed]);

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
          privacyNote={PRIVACY_NOTE}
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

  if (storedCv) {
    return (
      <StoredCvSection
        cv={storedCv}
        memberUid={member.id}
        title={isOwner ? 'Your CV' : 'CV'}
        canManage={isOwner}
        onReplace={setReplacementFile}
      />
    );
  }

  /* No CV to draw, and nothing to offer someone who cannot upload one. Returning
     `null` rather than an empty wrapper is what lets `.section:empty` collapse
     the `ProfileSection` around this and spare the column a gap. */
  if (!isOwner) {
    return null;
  }

  /**
   * The answer is not in yet — the header, and nothing under it.
   *
   * `undefined` is a third state and must not read as "no CV": the drop area
   * would appear for a beat on every profile that has one and then swap for the
   * file under the reader. `isFetching` covers the same flash on the way back,
   * when an upload has invalidated the query and the last answer — `null` — is
   * still what the cache holds until the refetch lands.
   */
  const answered = storedCv !== undefined || isError;
  if (!answered || isFetching) {
    return (
      <DetailsSection>
        <DetailsSectionHeader title="Your CV" />
      </DetailsSection>
    );
  }

  /* No CV, and this is whose profile it is. A read that failed lands here too:
     the upload replaces whatever is up there anyway, so offering it costs
     nothing, while withholding it would strand the owner behind a bad request. */
  return (
    <DetailsSection>
      <DetailsSectionHeader title="Your CV" />
      <ExperienceImportPanel
        key={panelKey}
        privacyNote={PRIVACY_NOTE}
        onParse={parseAndReport}
        onAbort={abort}
        onParsed={(result) => {
          setParsed(result);
          setReviewing(true);
        }}
        onAddManually={closeImport}
        onCancelRead={() => {
          onCvImportCancelled('reading');
          closeImport();
        }}
      />
    </DetailsSection>
  );
}
