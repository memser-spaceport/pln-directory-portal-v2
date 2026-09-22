'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { CvAttachmentLine } from '@/components/common/profile/StoredCv';
import { CvPreviewModal } from '@/components/common/profile/StoredCv/CvPreviewModal';
import { useStoredCv } from '@/services/members/hooks/useStoredCv';
import {
  DetailsSection,
  DetailsSectionGreyContentContainer,
  DetailsSectionHeader,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
import { ProfileSection } from '@/components/common/profile/SectionEditLock';
import { ContactDetails } from '@/components/page/member-details/ContactDetails';
import { ContributionsDetails } from '@/components/page/member-details/ContributionsDetails';
import { ExperienceDetails } from '@/components/page/member-details/ExperienceDetails';
import { OfficeHoursDetails } from '@/components/page/member-details/OfficeHoursDetails';
import { ProfileDetails } from '@/components/page/member-details/ProfileDetails';
import { RepositoriesDetails } from '@/components/page/member-details/RepositoriesDetails';
import { TeamsDetails } from '@/components/page/member-details/TeamsDetails';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import type { TeamApplicant } from '@/schema/team-applicants';
import { useCurrentUserStore } from '@/services/auth/store';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMember } from '@/services/members.service';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { formatRelativeDays } from '@/utils/jobs.utils';

import s from './ApplicantPane.module.scss';

interface Props {
  applicant: TeamApplicant;
  isLoggedIn: boolean;
}

/**
 * The person, as the directory shows them, with what they sent underneath.
 *
 * **The real member page's sections, not a transcription of them.** The design
 * prototype rebuilt the header, bio, office hours, contact and repositories
 * markup against thirteen borrowed stylesheets and a synthesised `IMember`;
 * this composes the same components `/members/[id]` composes, so the profile a
 * lead judges cannot drift from the profile the directory shows. They read
 * `isOwner` off the viewer themselves, and the viewer is never the applicant,
 * so every one of them renders read-only without being told to.
 *
 * **The row is not the profile.** The list carries a name and a headline; the
 * whole record is fetched here, on selection. That is why the applicants
 * contract stays thin — one description of a member in the app, not two.
 *
 * Sections deliberately absent, each for its own reason: Forum Activity and IRL
 * hide themselves with no activity and would be two empty cards on most people;
 * Job Search Status is owner-only and the API omits it for anyone else; the
 * desktop rail's Relationship and team-news cards belong to a page whose right
 * side is not already taken by an applicant list.
 */
export function ApplicantPane({ applicant, isLoggedIn }: Props) {
  const { currentUser: userInfo } = useCurrentUserStore();
  const isAdmin = isAdminUser(userInfo);

  /* The same key and the same call the member page and the investor drawer
     make, so a profile already read elsewhere in this session is a cache hit. */
  const {
    data: member,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, applicant.memberUid, isLoggedIn, userInfo?.uid],
    queryFn: () =>
      getMember(
        applicant.memberUid,
        { with: 'image,skills,location,teamMemberRoles.team' },
        isLoggedIn,
        userInfo,
        !isAdmin,
        true,
      ),
    enabled: !!applicant.memberUid,
    select: (data) => data?.data?.formattedData,
  });

  const application = <ApplicationSection applicant={applicant} />;

  if (isLoading) {
    return (
      <div className={s.state}>
        <NoDataBlock>Loading profile…</NoDataBlock>
      </div>
    );
  }

  /* The application still shows. It is the part this page owns, it is what the
     lead came to read, and a profile that failed to load is no reason to
     withhold the note somebody wrote. */
  if (isError || !member) {
    return (
      <div className={s.column}>
        <DetailsSectionGreyContentContainer>
          <NoDataBlock>This member’s profile could not be loaded.</NoDataBlock>
        </DetailsSectionGreyContentContainer>
        {application}
      </div>
    );
  }

  return (
    <div className={s.column}>
      <ProfileSection name="Profile Details">
        <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
      </ProfileSection>

      {application}

      <ProfileSection name="Office Hours">
        <OfficeHoursDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
      </ProfileSection>
      <ProfileSection name="Contact Details">
        <ContactDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
      </ProfileSection>
      <ProfileSection name="Teams">
        <TeamsDetails member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />
      </ProfileSection>
      <ProfileSection name="Experience">
        <ExperienceDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
      </ProfileSection>
      <ProfileSection name="Project Contributions">
        <ContributionsDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
      </ProfileSection>
      <ProfileSection name="Repositories">
        <RepositoriesDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
      </ProfileSection>
    </div>
  );
}

/**
 * The one section this page adds: when they acted, what they said, and the file
 * that came with it.
 *
 * Headed **Application** or **Interest**, because they are not the same act. An
 * application has words and asks for a reply; an interest press is a bare
 * signal, and heading it "Application" would promise a note that was never
 * written.
 */
function ApplicationSection({ applicant }: { applicant: TeamApplicant }) {
  const isApplication = applicant.kind === 'application';
  const acted = isApplication ? 'Applied' : 'Interested';
  const [previewing, setPreviewing] = useState(false);

  /**
   * The document itself, which the application row does not carry.
   *
   * The row names the file — `fileName`, `size`, `uploadedAt` — and stops there,
   * because signing a URL per row would mint links for fifty people to read one.
   * The signed link lives on the member's own CV endpoint, and a lead of a team
   * this member applied to is exactly who `assertCanView` admits.
   *
   * Fetched on selection rather than on the press: the request is already in
   * flight by the time someone reaches for the file, so the preview opens on a
   * page rather than on a spinner. Skipped entirely for an application with no
   * CV — most interests — so nothing is asked for a document that is not there.
   */
  const { data: storedCv } = useStoredCv(applicant.cv ? applicant.memberUid : undefined);

  /* The row's own metadata until the signed link lands, so the header names the
     right file from the first frame. `CvPreviewModal` draws its page only once
     there is a `url`. */
  const previewCv = applicant.cv
    ? (storedCv ?? {
        fileName: applicant.cv.fileName,
        size: applicant.cv.size,
        uploadedAt: applicant.cv.uploadedAt,
      })
    : null;

  return (
    <DetailsSection>
      <div className={s.applicationHead}>
        <DetailsSectionHeader title={isApplication ? 'Application' : 'Interest'} />
        <span className={s.when}>
          <ClockIcon />
          {acted} {formatRelativeDays(applicant.createdAt)}
        </span>
      </div>

      {applicant.coverLetter || applicant.cv ? (
        <DetailsSectionGreyContentContainer>
          {/* `pre-line`, because what somebody typed had paragraphs in it and
              collapsing them is a quiet way of misquoting them. */}
          {applicant.coverLetter && <p className={s.note}>{applicant.coverLetter}</p>}
          {applicant.cv && (
            /* The chip stays what it is — `CvAttachmentLine` is deliberately
               inert, because the same component renders inside the email preview
               where nothing is pressable. The press belongs to this surface, so
               this surface wraps it. */
            <button
              type="button"
              className={s.cvButton}
              onClick={() => setPreviewing(true)}
              aria-label={`Preview ${applicant.cv.fileName}`}
            >
              <CvAttachmentLine
                cv={{
                  fileName: applicant.cv.fileName,
                  size: applicant.cv.size,
                  uploadedAt: applicant.cv.uploadedAt,
                }}
                variant="chip"
                className={s.cv}
              />
            </button>
          )}
        </DetailsSectionGreyContentContainer>
      ) : (
        /* Not an apology for a gap that isn't one: an interest press carries no
           note by design, so this says what the act was rather than what it
           lacked. */
        <DetailsSectionGreyContentContainer>
          <NoDataBlock>
            {isApplication
              ? 'They applied without a note.'
              : 'They pressed “I’m interested” — this signal carries no message.'}
          </NoDataBlock>
        </DetailsSectionGreyContentContainer>
      )}

      {previewCv && <CvPreviewModal cv={previewCv} isOpen={previewing} onClose={() => setPreviewing(false)} />}
    </DetailsSection>
  );
}
