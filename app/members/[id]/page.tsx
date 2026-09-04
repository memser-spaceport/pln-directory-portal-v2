'use client';

import Error from '@/components/core/error';
import styles from './page.module.scss';
import { getMember } from '@/services/members.service';
import IrlMemberContribution from '@/components/page/member-details/member-irl-contributions';
import { ProfileDetails } from '@/components/page/member-details/ProfileDetails';
import { ContactDetails } from '@/components/page/member-details/ContactDetails';
import { JobSearchStatusDetails } from '@/components/page/member-details/JobSearchStatusDetails';
import { ExperienceDetails } from '@/components/page/member-details/ExperienceDetails';
import { ContributionsDetails } from '@/components/page/member-details/ContributionsDetails';
import { RepositoriesDetails } from '@/components/page/member-details/RepositoriesDetails';
import { OneClickVerification } from '@/components/page/member-details/OneClickVerification';
import { TeamsDetails } from '@/components/page/member-details/TeamsDetails';
import { OfficeHoursDetails } from '@/components/page/member-details/OfficeHoursDetails';
import { InvestorProfileDetails } from '@/components/page/member-details/InvestorProfileDetails';
import { BackButton } from '@/components/ui/BackButton';
import React, { useEffect, use } from 'react';
import { BookWithOther } from '@/components/page/member-details/BookWithOther';
import { getMemberListForQuery } from '@/app/actions/members.actions';
import qs from 'qs';
import clsx from 'clsx';
import { isDemodaySignUpSource, isMemberAvailableToConnect } from '@/utils/member.utils';
import { useCurrentUserStore } from '@/services/auth/store';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useQuery } from '@tanstack/react-query';
import { IMember } from '@/types/members.types';
import { useSearchParams } from 'next/navigation';
import { AccountCreatedView } from '@/components/page/member-details/AccountCreatedView';

import MemberPageLoader from './loading';
import Head from 'next/head';
import { MembersQueryKeys, SHOW_CV_IMPORT } from '@/services/members/constants';
import { useGetMemberInvestorSettings } from '@/services/members/hooks/useGetMemberInvestorSettings';
import { ForumActivity } from '@/components/page/member-details/ForumActivity';
import { TeamNewsDetails } from '@/components/page/member-details/TeamNewsDetails';
import { useMemberTeamNewsCard } from '@/components/page/member-details/TeamNewsDetails/hooks/useMemberTeamNewsCard';
import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { useAffinityAccess } from '@/services/access-control/hooks/useAffinityAccess';
import { useAffinityMember } from '@/services/affinity/hooks/useAffinityMember';
import { RelationshipDetails } from '@/components/page/member-details/RelationshipDetails';
import { useLoginRedirect } from '@/components/core/login/utils';

const shouldShowInvestorProfileForThirdParty = (
  member: IMember,
  isOwner: boolean,
  isAdmin: boolean,
  isInvestor?: boolean,
): boolean => {
  if (!isOwner && !isAdmin) {
    return false;
  }

  if (isInvestor === null || isInvestor) {
    return true;
  }

  return false;
};

const MemberDetails = (props: { params: Promise<any> }) => {
  const params = use(props.params);
  const memberId = params?.id;
  const searchParams = useSearchParams();
  const goToLogin = useLoginRedirect();

  const { currentUser: userInfo } = useCurrentUserStore();
  const isAdmin = isAdminUser(userInfo);
  const isOwner = !!userInfo && userInfo.uid === memberId;
  const isLoggedIn = !!userInfo;

  // Check for prefillEmail and returnTo parameters
  const prefillEmail = searchParams.get('prefillEmail');
  const returnTo = searchParams.get('returnTo');
  const shouldShowAccountCreated = !isLoggedIn && prefillEmail && returnTo;
  const {
    data: member,
    isError,
    isLoading,
  } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, memberId, isLoggedIn, userInfo?.uid],
    queryFn: () =>
      getMember(
        memberId,
        { with: 'image,skills,location,teamMemberRoles.team' },
        isLoggedIn,
        userInfo,
        !isAdmin && !isOwner,
        true,
      ),
    enabled: !!memberId,
    select: (data) => data?.data?.formattedData,
  });

  // Fetch investor settings to check visibility preference
  const { data: memberInvestorSettings } = useGetMemberInvestorSettings(memberId);
  const { authToken } = getCookiesFromClient();
  const { data: availableToConnectCount } = useQuery({
    queryKey: ['memberList'],
    queryFn: () => getMemberListForQuery(qs.stringify({ hasOfficeHours: true }), 1, 1, authToken),
    enabled: !!authToken,
    select: (data) => data?.total,
  });
  const { currentUser } = useCurrentUserStore();
  const isAvailableToConnect = isMemberAvailableToConnect(member);
  const { hasAccess: hasAffinityAccess } = useAffinityAccess();
  const { data: affinityData, isLoading: affinityLoading } = useAffinityMember(memberId, hasAffinityAccess);
  const hasAffinityContent =
    hasAffinityAccess && (affinityLoading || (!!affinityData && !affinityData.relationship.empty));
  const showOtherConnectOptions =
    !hasAffinityContent && !isAvailableToConnect && isLoggedIn && currentUser?.rbac?.status === 'APPROVED' && !isOwner;
  // The news card lives in the rail, so its visibility has to open the rail —
  // otherwise a member whose only rail content is news gets no rail at all.
  // Resolved here and in the card itself; both land on the same query entry.
  const isBelowTabletLandscape = useIsBelowTabletLandscape();
  const { visible: showTeamNews } = useMemberTeamNewsCard({ member, isLoggedIn, userInfo });
  const showSidebar = showOtherConnectOptions || hasAffinityContent || (showTeamNews && !isBelowTabletLandscape);
  const status = member?.rbac?.status;
  const isNewInvestor = status === 'PENDING' && isOwner && isDemodaySignUpSource(member?.signUpSource);

  /* Scroll to top when a member's page finishes loading, or when you navigate
     to a different member.

     **Keyed on the id, not on the `member` object.** The dependency used to be
     `member` itself, which is a new object every time anything patches the
     query cache — and `useUpdateMemberParams` patches it optimistically on
     every inline save. So picking a job search status radio, or saving any
     section that writes through that hook, snapped the page to the top under
     the person's hands mid-interaction. The trigger this effect wants is "a
     different member's page is now on screen", and that is what `loadedMemberId`
     changes on. */
  const loadedMemberId = member && !isLoading ? memberId : null;
  useEffect(() => {
    if (!loadedMemberId) {
      return;
    }
    document.body.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [loadedMemberId]);

  // Handle login click from AccountCreatedView
  const handleLoginClick = () => {
    // Stay on the same page and add #login hash
    goToLogin();
  };

  // Show AccountCreatedView if user is not logged in and has prefillEmail and returnTo params
  if (shouldShowAccountCreated) {
    return <AccountCreatedView onLoginClick={handleLoginClick} />;
  }

  if (isError) {
    return <Error />;
  }

  if (isLoading) {
    return <MemberPageLoader />;
  }

  if (!member) {
    return <Error title="This member doesn't exist or isn't approved yet" description="Member not found" />;
  }

  function renderPageContent() {
    if (!member) {
      return null;
    }

    const showInvestorProfile = shouldShowInvestorProfileForThirdParty(
      member,
      isOwner,
      isAdmin,
      memberInvestorSettings?.isInvestor,
    );
    const isInvestorOnly =
      isNewInvestor || member.rbac.policies?.every((p: { role: string }) => p.role.toLowerCase() === 'investor');

    return (
      <>
        <OneClickVerification
          userInfo={userInfo}
          member={member}
          isLoggedIn={isLoggedIn}
          isNewInvestor={isNewInvestor}
        />
        <ProfileDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
        {showInvestorProfile && (
          <InvestorProfileDetails
            userInfo={userInfo}
            member={member}
            isLoggedIn={isLoggedIn}
            isInvestor={memberInvestorSettings?.isInvestor}
            useInlineAddTeam
          />
        )}
        <OfficeHoursDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
        <ContactDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
        <ForumActivity member={member} userInfo={userInfo} isOwner={isOwner} />
        <TeamsDetails member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />
        {/* Below the two-column breakpoint the rail is hidden, so the card falls
            in here — directly under the teams it describes, as the prototype
            does. Exactly one of the two mounts is ever rendered: two would put
            duplicate data-story-uid nodes on the page and focus restore
            resolves that attribute by querySelector. */}
        {isBelowTabletLandscape && <TeamNewsDetails member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />}
        {/* Private to the member, so it is mounted only on their own profile —
            the API omits `jobSearchStatus` for every other viewer anyway, but
            the pill inside promises "only visible to you" and that sentence has
            to be true of the surface, not just of the payload. The card carries
            the same check itself as a backstop.

            Sits directly above Experience, and deliberately OUTSIDE the
            `!isInvestorOnly` block below it: an investor-only member loses the
            Experience and Contributions sections, and their own job search
            status is not one of the things that should go with them. */}
        {isOwner && <JobSearchStatusDetails member={member} />}
        {!isInvestorOnly && (
          <>
            {/* The CV importer's second host. The section decides *where* to put
                the offer (empty-state drop area, or the header's "Update from
                CV") and refuses both to anyone who cannot edit this profile —
                `canEditMemberProfile`, the same gate its Add and Edit controls
                use — so this prop only has to say that the host allows it. */}
            <ExperienceDetails
              userInfo={userInfo}
              member={member}
              isLoggedIn={isLoggedIn}
              enableCvImport={SHOW_CV_IMPORT}
            />
            <ContributionsDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />
          </>
        )}

        {member.eventGuests.length > 0 && (
          <div className={styles?.memberDetail__irlContribution}>
            <IrlMemberContribution member={member} userInfo={userInfo} />
          </div>
        )}
        {!isInvestorOnly && <RepositoriesDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />}
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`${member?.name} | Protocol Labs Directory`}</title>
      </Head>
      <div className={styles?.memberDetail}>
        <div
          className={clsx(styles.container, {
            [styles.singleColumn]: !showSidebar,
          })}
        >
          <div className={styles.content}>
            <BackButton to={`/members`} />
            <div
              className={clsx(styles?.memberDetail__container, {
                [styles.centered]: isAvailableToConnect || isOwner,
              })}
            >
              {renderPageContent()}
            </div>
          </div>
          {showSidebar && (
            <div className={styles.desktopOnly}>
              <div style={{ visibility: 'hidden' }}>
                <BackButton to={`/members`} />
              </div>
              {hasAffinityAccess && <RelationshipDetails memberUid={memberId} />}
              {!isBelowTabletLandscape && (
                <TeamNewsDetails member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />
              )}
              {showOtherConnectOptions && <BookWithOther count={availableToConnectCount} member={member} />}
            </div>
          )}
        </div>

        {/* {userInfo.uid === member.id && (
          <>
            <SubscribeToRecommendationsWidget userInfo={userInfo} />
            <UpcomingEventsWidget userInfo={userInfo} />
          </>
        )} */}
      </div>
    </>
  );
};

export default MemberDetails;
