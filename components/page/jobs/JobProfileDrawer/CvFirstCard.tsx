'use client';

import React, { useCallback, useState } from 'react';

import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import {
  ExperienceImportPanel,
  ExperienceImportReview,
  formatParsedDates,
  useCvImport,
} from '@/components/page/member-details/ExperienceDetails/components/ExperienceImport';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { IMember } from '@/types/members.types';

import d from './JobProfileDrawer.module.scss';

/**
 * "Start with your CV" — the first card in the drawer, while there is nothing to
 * start from.
 *
 * Not a second importer. It is the same mechanism the Experience section hosts
 * (`useCvImport`), moved to where it is worth offering: a CV answers the
 * **required current role**, plus location, skills and the work history, so on a
 * blank profile it is not an Experience feature at all — it is the fastest route
 * through every card below it. Offering it inside the Experience section
 * described it as smaller than it is and buried it four cards down.
 *
 * **Never on at the same time as the section's own offer.** `JobProfileDrawer`
 * picks exactly one host (`importAtTop`) and turns the other off; two entry
 * points to one mechanism on one screen is a choice the person cannot get right
 * or wrong.
 *
 * A quiet white card, not a tinted slab: the amber "your current role is
 * required" strip on the header card below has to stay the loudest thing on the
 * screen. This is an offer; that is a requirement.
 */
interface CvFirstCardProps {
  member: IMember;
  /**
   * The dead end's way out — see `onAddManually` below for why it hands the
   * importer back rather than opening a form.
   */
  onHandOff: () => void;
}

export function CvFirstCard({ member, onHandOff }: CvFirstCardProps) {
  /** The review is a different card from the drop area; this says which is up. */
  const [reviewing, setReviewing] = useState(false);
  /**
   * A save landed, and this card is on its way out.
   *
   * The host drops it the moment the profile stops being blank — but that is a
   * *refetch* away: `useApplyCvImport` invalidates on success and `mutateAsync`
   * resolves before the new record arrives. Without this the card spends that
   * gap back on its opening offer, telling someone who just filled their profile
   * in from a CV to start with their CV.
   */
  const [saved, setSaved] = useState(false);

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

  /* The same treatment the Experience section gives its own import: on mobile an
     `editView` card is a fullscreen fixed layer, and the bottom nav underneath it
     would sit on top of the review's Save. */
  useMobileNavVisibility(reviewing);

  const closeReview = useCallback(() => {
    abort();
    setParsed(null);
    setReviewing(false);
  }, [abort, setParsed]);

  /* Nothing, rather than the offer, for the render or two before the host drops
     this. The cards below already show what was just saved. */
  if (saved) return null;

  return (
    <DetailsSection editView={reviewing}>
      {reviewing && parsed ? (
        <ExperienceImportReview
          parsed={parsed}
          currentRole={currentRole}
          hasLocation={hasLocation}
          currentSkills={currentSkills}
          currentExperiences={currentExperiences}
          formatDates={formatParsedDates}
          onClose={() => {
            onCvImportCancelled('review');
            closeReview();
          }}
          /* Stood down on the line after the await, so a rejected save leaves
             the review up with the selection intact rather than discarding it. */
          onSubmit={async (selection) => {
            await submitImport(selection);
            setSaved(true);
          }}
        />
      ) : (
        <>
          {/* No action in the header slot, deliberately. In its resting state
              this card is an offer, not an open editor — there is nothing to
              cancel, the drawer's own footer is live below it, and the profile
              it would dismiss is right there to be filled in by hand. */}
          <DetailsSectionHeader title="Start with your CV" />
          {/* Names the work avoided, not just the work done — the alternative to
              uploading is typing it all in, stated. Word for word the sentence
              every other surface offering this uses; a cross-surface promise
              that reads differently per page is drift. */}
          <p className={d.cvFirstNote}>
            We&apos;ll fill in your role, skills and experience from it, so you don&apos;t have to type it all in.
          </p>
          <ExperienceImportPanel
            privacyNote="We read the file to fill in your experience. It isn't sent with your applications."
            onParse={parseAndReport}
            onAbort={abort}
            onParsed={(result) => {
              setParsed(result);
              setReviewing(true);
            }}
            /**
             * The dead end's second way out ("Add manually"), and the reason it
             * is a hand-off rather than a form.
             *
             * The Experience section's Add form is that section's own state, two
             * cards below and not reachable from here. So this stands down
             * instead: the drawer stops treating the profile as blank, which
             * hands the importer back to the Experience section — where the Add
             * button and the section's own drop area both are. A real
             * destination, and it keeps the one-host rule true on the way
             * there.
             */
            onAddManually={onHandOff}
            onCancelRead={() => onCvImportCancelled('reading')}
          />
        </>
      )}
    </DetailsSection>
  );
}
