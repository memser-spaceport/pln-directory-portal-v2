import React from 'react';
import s from './ProfileHeader.module.scss';

interface Founder {
  uid: string;
  name: string;
  role: string;
  image: { url: string } | null;
}

interface ProfileHeaderProps {
  image?: string;
  name: string;
  description: string;
  fundingStage?: string;
  tags: string[];
  founders?: Founder[];
}

export const ProfileHeader = ({ image, name, description, fundingStage, tags, founders }: ProfileHeaderProps) => {
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

        {/* Founders Info */}
        {founders && founders.length > 0 && (
          <div className={s.foundersInfo}>
            {founders.map((founder, index) => (
              <React.Fragment key={founder.uid}>
                {index > 0 && <div className={s.founderDivider} />}
                <div className={s.founderItem}>
                  <div
                    className={s.founderAvatar}
                    style={{
                      backgroundImage: founder.image?.url
                        ? `url('${founder.image.url}')`
                        : 'linear-gradient(135deg, #d0cff2 0%, #d7dfe9 100%)',
                    }}
                  />
                  <div className={s.founderText}>
                    <div className={s.founderName}>{founder.name}</div>
                    <div className={s.founderRole}>{founder.role || 'Co-Founder'}</div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
