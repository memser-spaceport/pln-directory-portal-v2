import React from 'react';
import Image from 'next/image';
import { ProfileHeader } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileHeader';
import { ProfileContent } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileContent';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import { createDemoDayEmailHandler, DemoDayEmailData } from '@/utils/demo-day-email.utils';
import s from './TeamProfileCard.module.scss';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';

interface TeamProfileCardProps {
  team: TeamProfile;
  onClick?: (team: TeamProfile) => void;
  investorData?: {
    name: string;
    teamName: string;
    email: string;
  };
  onLikeCompany?: (team: TeamProfile) => void;
  onConnectCompany?: (team: TeamProfile) => void;
  onInvestCompany?: (team: TeamProfile) => void;
}

export const TeamProfileCard: React.FC<TeamProfileCardProps> = ({
  team,
  onClick,
  investorData,
  onLikeCompany,
  onConnectCompany,
  onInvestCompany,
}) => {
  // Analytics hooks
  const { onActiveViewTeamCardClicked } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  const handleCardClick = () => {
    // Report team card click analytics
    if (userInfo?.email) {
      // PostHog analytics
      onActiveViewTeamCardClicked({
        teamName: team.team?.name,
        teamUid: team.uid,
        fundingStage: team.team?.fundingStage?.title,
        industryTags: team.team?.industryTags?.map((tag) => tag.title),
      });

      // Custom analytics event
      const teamCardEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TEAM_CARD_CLICKED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: team.team?.name,
          teamUid: team.uid,
          teamShortDescription: team.team?.shortDescription,
          fundingStage: team.team?.fundingStage?.title,
          fundingStageUid: team.team?.fundingStage?.uid,
          industryTags: team.team?.industryTags?.map((tag) => tag.title),
          industryTagUids: team.team?.industryTags?.map((tag) => tag.uid),
          foundersCount: team.founders?.length || 0,
          hasLogo: !!team.team?.logo?.url,
        },
      };

      reportAnalytics.mutate(teamCardEvent);
    }

    onClick?.(team);
  };

  // Create email data for demo day actions
  const createEmailData = (): DemoDayEmailData | null => {
    const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

    const founders = team.founders;

    if (!founders || !userInfo) return null;

    const founderEmails = founders.map((founder) => founder.email);
    const founderNames = founders.map((founder) => founder.name);

    return {
      founderEmails,
      founderNames,
      demotingTeamName: team.team?.name || 'Team Name',
      investorName: userInfo.name ?? '',
      investorTeamName: userInfo.mainTeamName ?? '',
    };
  };

  const emailData = createEmailData();

  return (
    <div className={s.profileCard} onClick={handleCardClick}>
      <ProfileHeader
        image={team.team.logo?.url || '/images/demo-day/profile-placeholder.svg'}
        name={team.team?.name || 'Team Name'}
        description={team?.team?.shortDescription || '-'}
        fundingStage={team?.team.fundingStage.title || '-'}
        tags={team?.team.industryTags.map((tag) => tag.title) || []}
      />
      <ProfileContent pitchDeckUrl={team?.onePagerUpload?.url} videoUrl={team?.videoUpload?.url} />
      <div className={s.profileDivider} />
      <div className={s.actions}>
        <button
          className={s.secondaryButton}
          onClick={emailData ? createDemoDayEmailHandler('like', emailData) : undefined}
          disabled={!emailData}
        >
          <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} /> Like the Company
        </button>
        <button
          className={s.secondaryButton}
          onClick={emailData ? createDemoDayEmailHandler('connect', emailData) : undefined}
          disabled={!emailData}
        >
          🤝 Connect with Company
        </button>
        <button
          className={s.primaryButton}
          onClick={emailData ? createDemoDayEmailHandler('invest', emailData) : undefined}
          disabled={!emailData}
        >
          💰 Invest in Company
        </button>
      </div>
    </div>
  );
};
