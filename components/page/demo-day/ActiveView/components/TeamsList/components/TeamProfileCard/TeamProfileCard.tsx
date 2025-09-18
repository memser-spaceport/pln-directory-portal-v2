import React from 'react';
import Image from 'next/image';
import { ProfileHeader } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileHeader';
import { ProfileContent } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileContent';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import s from './TeamProfileCard.module.scss';

interface TeamProfileCardProps {
  team: TeamProfile;
  onClick?: (team: TeamProfile) => void;
}

export const TeamProfileCard: React.FC<TeamProfileCardProps> = ({ team, onClick }) => {
  const handleCardClick = () => {
    onClick?.(team);
  };

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
        <button className={s.secondaryButton}>
          <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} /> Like Company
        </button>
        <button className={s.secondaryButton}>🤝 Connect with Company</button>
        <button className={s.primaryButton}>💰 Invest in Company</button>
      </div>
    </div>
  );
};
