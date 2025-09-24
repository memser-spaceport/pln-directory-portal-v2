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

interface TeamProfileCardProps {
  team: TeamProfile;
  onClick?: (team: TeamProfile) => void;
  investorData?: {
    name: string;
    teamName: string;
    email: string;
  };
}

export const TeamProfileCard: React.FC<TeamProfileCardProps> = ({ team, onClick, investorData }) => {
  const handleCardClick = () => {
    onClick?.(team);
  };

  // Create email data for demo day actions
  const createEmailData = (): DemoDayEmailData | null => {
    const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

    const founder = team.founders?.[0];

    if (!founder || !userInfo) return null;

    const founderEmail = founder.email;
    const founderName = founder.name;

    return {
      founderEmail,
      founderName,
      demotingTeamName: team.team?.name || 'Team Name',
      investorName: userInfo.name ?? '',
      investorTeamName: '',
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
