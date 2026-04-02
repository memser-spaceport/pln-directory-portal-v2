'use client';

import Error from '@/components/core/error';
import styles from './page.module.scss';
import { getMember } from '@/services/members.service';
import IrlMemberContribution from '@/components/page/member-details/member-irl-contributions';
import { ProfileDetails } from '@/components/page/member-details/ProfileDetails';
import { ContactDetails } from '@/components/page/member-details/ContactDetails';
import { ExperienceDetails } from '@/components/page/member-details/ExperienceDetails';
import { ContributionsDetails } from '@/components/page/member-details/ContributionsDetails';
import { RepositoriesDetails } from '@/components/page/member-details/RepositoriesDetails';
import { SubscribeToRecommendationsWidget } from '@/components/page/member-info/components/SubscribeToRecommendationsWidget';
import { UpcomingEventsWidget } from '@/components/page/member-info/components/UpcomingEventsWidget';
import { OneClickVerification } from '@/components/page/member-details/OneClickVerification';
import { TeamsDetails } from '@/components/page/member-details/TeamsDetails';
import { OfficeHoursDetails } from '@/components/page/member-details/OfficeHoursDetails';
import { InvestorProfileDetails } from '@/components/page/member-details/InvestorProfileDetails';
import { BackButton } from '@/components/ui/BackButton';
import React, { useEffect, useMemo } from 'react';
import { BookWithOther } from '@/components/page/member-details/BookWithOther';
import { getMemberListForQuery } from '@/app/actions/members.actions';
import qs from 'qs';
import { getAccessLevel } from '@/utils/auth.utils';
import clsx from 'clsx';
import { isDemodaySignUpSource, isMemberAvailableToConnect } from '@/utils/member.utils';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';
import { IMember } from '@/types/members.types';
import { useSearchParams, useRouter } from 'next/navigation';
import { AccountCreatedView } from '@/components/page/member-details/AccountCreatedView';

import MemberPageLoader from './loading';
import Head from 'next/head';
import { MembersQueryKeys } from '@/services/members/constants';
import { useGetMemberInvestorSettings } from '@/services/members/hooks/useGetMemberInvestorSettings';
import { ForumActivity } from '@/components/page/member-details/ForumActivity';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { useIsAdvisor } from '@/services/advisors/hooks/useIsAdvisor';
import { AdvisorOfficeHours } from '@/components/page/advisors/AdvisorOfficeHours';
import { AdvisorExperience } from '@/components/page/advisors/AdvisorExperience';
import { getMockAdvisors } from '@/services/advisors/mock-data';

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

const MemberDetails = ({ params }: { params: any }) => {
  const memberId = params?.id;
  const searchParams = useSearchParams();
  const router = useRouter();

  const userInfo = getParsedValue(Cookies.get('userInfo'));
  const isAdmin = isAdminUser(userInfo);
  const isOwner = userInfo && userInfo.uid === memberId;
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
    queryKey: [MembersQueryKeys.GET_MEMBER, memberId, isLoggedIn, userInfo.uid],
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
  const { data: isAdvisorMember } = useIsAdvisor(memberId);
  const { data: availableToConnectCount } = useQuery({
    queryKey: ['memberList'],
    queryFn: () => getMemberListForQuery(qs.stringify({ hasOfficeHours: true }), 1, 1, userInfo?.token),
    enabled: !!userInfo?.token,
    select: (data) => data?.total,
  });
  // Fallback to mock advisor member data if real member not found
  const mockAdvisor = !member ? getMockAdvisors().find((a) => a.memberId === memberId) : null;
  const resolvedMember = member || (mockAdvisor?.member as any);

  // For advisor prototype: enrich member data with mock LinkedIn-sourced content
  const enrichedMember = useMemo(() => {
    const baseMember = resolvedMember;
    if (!baseMember || !isAdvisorMember) return baseMember;
    return {
      ...baseMember,
      bio: baseMember.bio || '<p>Experienced operator and advisor with deep expertise in scaling teams and building products in the web3 and decentralized technology space. Previously led engineering and product teams at multiple startups from early stage through Series B. Passionate about helping founders navigate the challenges of building category-defining companies.</p>',
      linkedinHandle: baseMember.linkedinHandle || 'advisor-profile',
      location: baseMember.location?.country ? baseMember.location : {
        country: 'United States',
        city: 'San Francisco',
        continent: 'North America',
        metroArea: 'SF Bay Area',
        region: 'California',
      },
      experiences: (baseMember as any).experiences?.length ? (baseMember as any).experiences : [
        { title: 'VP of Engineering', company: 'Decentralized Systems Inc.', startDate: '2022-01', endDate: '2025-12', description: 'Led engineering team scaling from 8 to 45 engineers. Shipped core protocol infrastructure.' },
        { title: 'Head of Product', company: 'Web3 Ventures', startDate: '2019-06', endDate: '2021-12', description: 'Built and launched token economics platform. Drove product-led growth to 50K users.' },
        { title: 'Senior Engineer', company: 'Cloud Infrastructure Co.', startDate: '2016-03', endDate: '2019-05', description: 'Core contributor to distributed storage system. 3 patents filed.' },
      ],
    };
  }, [member, resolvedMember, isAdvisorMember]);

  const isAvailableToConnect = isMemberAvailableToConnect(enrichedMember);
  const accessLevel = getAccessLevel(userInfo, isLoggedIn);
  const isNewInvestor = accessLevel === 'base' && isOwner && isDemodaySignUpSource(resolvedMember?.signUpSource);

  // Scroll to top when member data is loaded or member ID changes
  useEffect(() => {
    if (resolvedMember && !isLoading) {
      document.body.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    }
  }, [resolvedMember, memberId, isLoading]);

  // Handle login click from AccountCreatedView
  const handleLoginClick = () => {
    // Stay on the same page and add #login hash
    router.push(`${window.location.pathname}${window.location.search}#login`);
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

  if (!resolvedMember) {
    return <Error title="This member doesn't exist or isn't approved yet" description="Member not found" />;
  }

  function renderPageContent() {
    if (!enrichedMember) {
      return null;
    }

    // Use enriched member (with mock LinkedIn data for advisors) for rendering
    const m = enrichedMember;

    switch (m.accessLevel) {
      case 'L5': {
        const showInvestorProfile = shouldShowInvestorProfileForThirdParty(
          m,
          isOwner,
          isAdmin,
          memberInvestorSettings?.isInvestor,
        );

        return (
          <>
            <ProfileDetails userInfo={userInfo} member={m} isLoggedIn={isLoggedIn} />
            {showInvestorProfile && (
              <InvestorProfileDetails
                userInfo={userInfo}
                member={m}
                isLoggedIn={isLoggedIn}
                isInvestor={memberInvestorSettings?.isInvestor}
                useInlineAddTeam
              />
            )}
            <ContactDetails userInfo={userInfo} member={m} isLoggedIn={isLoggedIn} />
            <ForumActivity member={m} userInfo={userInfo} isOwner={isOwner} />
            <TeamsDetails member={m} isLoggedIn={isLoggedIn} userInfo={userInfo} />
            <ExperienceDetails userInfo={userInfo} member={m} isLoggedIn={isLoggedIn} />
          </>
        );
      }
      default: {
        const showInvestorProfile = shouldShowInvestorProfileForThirdParty(
          m,
          isOwner,
          isAdmin,
          memberInvestorSettings?.isInvestor,
        );

        return (
          <>
            <OneClickVerification
              userInfo={userInfo}
              member={m}
              isLoggedIn={isLoggedIn}
              isNewInvestor={isNewInvestor}
            />
            <ProfileDetails userInfo={userInfo} member={m} isLoggedIn={isLoggedIn} />
            {isAdvisorMember ? (
              <>
                {isOwner && (
                  <InvestorProfileDetails
                    userInfo={userInfo}
                    member={m}
                    isLoggedIn={isLoggedIn}
                    isInvestor={null}
                    useInlineAddTeam
                  />
                )}
                {isOwner && <AdvisorOfficeHours />}
              </>
            ) : (
              <>
                {showInvestorProfile && (
                  <InvestorProfileDetails
                    userInfo={userInfo}
                    member={m}
                    isLoggedIn={isLoggedIn}
                    isInvestor={memberInvestorSettings?.isInvestor}
                    useInlineAddTeam
                  />
                )}
                <OfficeHoursDetails userInfo={userInfo} member={m} isLoggedIn={isLoggedIn} />
              </>
            )}
            <ContactDetails userInfo={userInfo} member={m} isLoggedIn={isLoggedIn} />
            {!isAdvisorMember && <ForumActivity member={m} userInfo={userInfo} isOwner={isOwner} />}
            <TeamsDetails member={m} isLoggedIn={isLoggedIn} userInfo={userInfo} />
            {!isNewInvestor && (
              isAdvisorMember ? (
                <AdvisorExperience advisor={{ id: 'self', memberId: m.id, member: m } as any} />
              ) : (
                <>
                  <ExperienceDetails userInfo={userInfo} member={m} isLoggedIn={isLoggedIn} />
                  <ContributionsDetails userInfo={userInfo} member={m} isLoggedIn={isLoggedIn} />
                </>
              )
            )}

            {m.eventGuests.length > 0 && (
              <div className={styles?.memberDetail__irlContribution}>
                <IrlMemberContribution member={m} userInfo={userInfo} />
              </div>
            )}
            {!isNewInvestor && <RepositoriesDetails userInfo={userInfo} member={m} isLoggedIn={isLoggedIn} />}
          </>
        );
      }
    }
  }

  return (
    <>
      <Head>
        <title>{`${resolvedMember?.name} | Protocol Labs Directory`}</title>
      </Head>
      <div className={styles?.memberDetail}>
        <div
          className={clsx(styles.container, {
            [styles.singleColumn]: isAvailableToConnect || !isLoggedIn || isOwner,
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
          {!isAvailableToConnect && isLoggedIn && accessLevel === 'advanced' && !isOwner && (
            <div className={styles.desktopOnly}>
              <div style={{ visibility: 'hidden' }}>
                <BackButton to={`/members`} />
              </div>
              <BookWithOther count={availableToConnectCount} member={resolvedMember} />
            </div>
          )}
        </div>

        {userInfo.uid === resolvedMember?.id && (
          <>
            <SubscribeToRecommendationsWidget userInfo={userInfo} />
            <UpcomingEventsWidget userInfo={userInfo} />
          </>
        )}
      </div>
    </>
  );
};

export default MemberDetails;
