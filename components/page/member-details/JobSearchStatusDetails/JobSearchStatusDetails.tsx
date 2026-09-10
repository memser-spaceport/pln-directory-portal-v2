'use client';

import { toast } from '@/components/core/ToastContainer';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { PlTeamOnlyPill } from '@/components/page/jobs/PlTeamOnlyPill/PlTeamOnlyPill';
import { JobSearchStatusInput } from '@/components/page/jobs/JobSearchStatusInput/JobSearchStatusInput';
import { isJobSearchStatus, type JobSearchStatus } from '@/services/jobs/job-board-viewer';
import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';
import { useCurrentUserStore } from '@/services/auth/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IMember } from '@/types/members.types';

interface Props {
  member: IMember;
}

/**
 * Where this member is with job hunting, on their own profile.
 *
 * **The second host for a question that had only one.** Until this card, the
 * job-board apply drawer was the only place in the product that wrote
 * `jobSearchStatus` — so a member who was not mid-application could not set it,
 * could not change it, and (because that drawer hides "Not looking" unless it is
 * already the stored answer) could not turn it off at all. A private "surface me
 * to founders" flag with no off switch is a promise the product cannot keep.
 *
 * **No stylesheet of its own, deliberately.** `DetailsSection` supplies the card
 * chrome and `JobSearchStatusInput` supplies everything inside it. If this
 * folder ever grows a `.module.scss`, something was composed wrong.
 */
export function JobSearchStatusDetails({ member }: Props) {
  const { currentUser } = useCurrentUserStore();
  const updateMember = useUpdateMemberParams();
  const { onJobSearchStatusChanged } = useMemberAnalytics();

  /* Two gates, and only one of them is this line. The member page already
     computes `isOwner` and mounts this behind it, which is where the visibility
     rule belongs — beside the section order it applies to. This one is a
     backstop: the field is private by contract, and a future host mounting the
     card without that gate would leak it silently rather than loudly. Cheap
     insurance on a promise the pill inside makes in words. */
  if (!currentUser || currentUser.uid !== member.id) {
    return null;
  }

  /* Validated rather than cast: `members.service.ts` already narrows unknown
     wire values to null on the way in, and this keeps that true if the record
     ever reaches here by another route. Values are still unagreed with BE. */
  const value: JobSearchStatus | null = isJobSearchStatus(member.jobSearchStatus) ? member.jobSearchStatus : null;

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Job search status">
        <PlTeamOnlyPill />
      </DetailsSectionHeader>
      <JobSearchStatusInput
        /* Not the component's default `job-search-status`. Two radio groups
           sharing a `name` are one group as far as the browser is concerned,
           and the component's own doc comment flags the trap; this keeps the
           two hosts separate by construction rather than by never colliding. */
        name="profile-job-search-status"
        value={value}
        /* No `hiddenValues`, unlike the drawer's two options. The drawer hides
           "Not looking" because you are mid-application there and it is not an
           answer that step is asking for. This card is the one surface where
           turning yourself off is the entire point, so it offers all three.
           The divergence is the feature — do not "fix" it to match the drawer.
           (The drawer already copes: its `hiddenValues` is conditional on the
           stored value, so a member who picks "Not looking" here still sees it
           selected there.) */
        onChange={(next) => {
          /* No status value in the payload, ever — see the note on
             JOB_SEARCH_STATUS_OPTIONS. This measures whether the card is used
             at all, which is the whole justification for adding it; the answer
             itself does not travel. `source` is a parameter rather than a
             literal inside the helper so the drawer can adopt the same event
             later without it lying about where the change came from. */
          onJobSearchStatusChanged({ source: 'member-profile' });

          /* A partial PATCH of exactly one field — NOT `buildMemberUpdatePayload`,
             which exists for the PUT full-replace path and would post the whole
             record back from a card that asked one question. The hook patches
             every cached entry for this member by key prefix, so the dot moves
             before the round trip and rolls back if the server disagrees.

             Not disabled while pending, deliberately: the write is optimistic,
             so the dot has already moved, and two fast clicks race with the
             later PATCH's invalidation settling last — which is the answer
             picked last. */
          updateMember.mutate(
            { uid: member.id, payload: { jobSearchStatus: next } },
            {
              /* The hook owns the rollback; each caller owns what it says. And
                 it has to say something: optimistically the dot moves and then
                 un-moves on its own, which turns a silent failure into a
                 misleading one. */
              onError: () => toast.error("Couldn't save your job search status. Please try again."),
            },
          );
        }}
      />
    </DetailsSection>
  );
}
