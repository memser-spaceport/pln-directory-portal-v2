import React from 'react';
import s from './ProfileHeader.module.scss';

interface ProfileHeaderProps {
  image?: string;
  name: string;
  description: string;
  fundingStage?: string;
  tags: string[];
}

export const ProfileHeader = ({ image, name, description, fundingStage, tags }: ProfileHeaderProps) => {
  // Helper function to format funding stage
  const formatFundingStage = (stage: string) => {
    const stageMap: Record<string, string> = {
      'pre-seed': 'Pre-Seed',
      'seed': 'Seed',
      'series-a': 'Series A',
      'series-b': 'Series B',
      'series-c': 'Series C',
      'growth': 'Growth',
      'ipo': 'IPO',
    };
    return stageMap[stage] || stage;
  };

  // Helper function to render tags with overflow handling
  const renderTags = (tags: string[]) => {
    const maxVisibleTags = 4;
    const visibleTags = tags.slice(0, maxVisibleTags);
    const remainingCount = tags.length - maxVisibleTags;

    return (
      <>
        {visibleTags.map((tag, index) => (
          <div key={index} className={s.tag}>
            {tag}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className={s.tag}>+{remainingCount}</div>
        )}
      </>
    );
  };

  return (
    <div className={s.profileHeader}>
      <div
        className={s.profileImage}
        style={{
          backgroundImage: image ? `url(${image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!image && <div className={s.profileImagePlaceholder} />}
      </div>
      <div className={s.memberDetails}>
        <div className={s.memberInfo}>
          <div className={s.memberNameContainer}>
            <h2 className={s.memberName}>{name}</h2>
          </div>
          <p className={s.memberDescription}>{description}</p>
        </div>
        <div className={s.tagList}>
          <div className={s.stageTag}>
            Stage: {fundingStage ? formatFundingStage(fundingStage) : 'Not specified'}
          </div>
          {tags && tags.length > 0 && (
            <>
              <div className={s.tagDivider} />
              {renderTags(tags)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
