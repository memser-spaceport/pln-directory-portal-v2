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
 * "Upload your CV" — the first card in the profile step, until there is a work
 * history to have uploaded.
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
              cancel, the flow's own footer is live below it, and the profile it
              would dismiss is right there to be filled in by hand.

              **Marked optional, and it has to be.** This card sits directly above
              two sections that carry a required strip. An unmarked card in that
              stack reads as a third thing being asked for — and the whole point
              of it is that it is the shortcut, not another form. That is doing
              more work now the title is an imperative: "Upload your CV" is the
              same grammar as the asks below it, and `(Optional)` is the only
              thing separating an offer from a fourth requirement. Do not drop
              it. */}
          <DetailsSectionHeader
            title={
              <>
                Upload your CV
                <span className={d.optionalMark}>(Optional)</span>
              </>
            }
          />
          {/* One line, and it is the mechanism: the fields below fill themselves.
              (It ran longer — "We'll fill in your role, skills and experience
              from it, so you don't have to type it all in" — naming the work
              avoided as well as the work done. Two sentences of persuasion above
              a drop area that is already the shortcut.) */}
          <p className={d.cvFirstNote}>We will autofill applicable fields.</p>
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
