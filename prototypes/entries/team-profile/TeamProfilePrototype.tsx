'use client';

import { useEffect, useState } from 'react';

import type { ITeam } from '@/types/teams.types';

import { BackButton } from '@/components/ui/BackButton';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
import { TagsList } from '@/components/common/profile/TagsList';
import { Modal } from '@/components/common/Modal';
import { SearchInput } from '@/components/common/filters/SearchInput';

// Import-safe production view + hook (no store / service / analytics).
import { TeamFocusAreasView } from '@/components/page/team-details/TeamFocusAreas/components/TeamFocusAreasView';
import { useGetFocusAreasToDisplay } from '@/components/page/team-details/TeamFocusAreas/hooks/useGetFocusAreasToDisplay';

// Reuse the production team-detail page shell styling.
import shell from '@/app/teams/[id]/page.module.css';

import { TeamDetailsView } from './TeamDetailsView';
import { TeamInvestorView } from './TeamInvestorView';
import { TeamContactView } from './TeamContactView';
import { TeamMembersView } from './TeamMembersView';
import { TeamProjectsView } from './TeamProjectsView';
import { NewsCardView } from './NewsCardView';
import local from './TeamProfile.module.scss';
import {
  MOCK_TEAM,
  MOCK_MEMBERS,
  MOCK_FOCUS_AREAS,
  MOCK_TEAM_FOCUS_AREAS,
  MOCK_PROJECTS,
  MOCK_NEWS,
} from './mocks';

const team = MOCK_TEAM as unknown as ITeam;

const NEWS_PREVIEW_COUNT = 3;

export default function TeamProfilePrototype() {
  // Several reused leaf components are base-ui / client-only (Tooltip, Tag
  // popovers). Gate render on mount so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsQuery, setNewsQuery] = useState('');
  // Demo-only: toggle how many news items exist, to preview edge cases.
  const [newsScenario, setNewsScenario] = useState<'all' | 'single'>('all');
  useEffect(() => setMounted(true), []);

  const sortedNews = [...MOCK_NEWS].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
  const displayNews = newsScenario === 'single' ? sortedNews.slice(0, 1) : sortedNews;

  // Rail previews a few; "View all" opens the full feed in a modal.
  const previewNews = displayNews.slice(0, NEWS_PREVIEW_COUNT);
  const hasMore = displayNews.length > NEWS_PREVIEW_COUNT;

  const q = newsQuery.trim().toLowerCase();
  const filteredNews = q
    ? displayNews.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.eventType.toLowerCase().includes(q) ||
          (item.sourceDomain ?? '').toLowerCase().includes(q),
      )
    : displayNews;

  const closeNewsModal = () => {
    setNewsModalOpen(false);
    setNewsQuery('');
  };

  const focusAreas = useGetFocusAreasToDisplay(MOCK_FOCUS_AREAS, MOCK_TEAM_FOCUS_AREAS);

  if (!mounted) {
    return <div className={shell.teamDetail} />;
  }

  return (
    <div className={local.page}>
      <div className={local.demoBar}>
        <span className={local.demoLabel}>Demo — news count</span>
        <div className={local.demoSwitch}>
          <button
            type="button"
            className={`${local.demoBtn} ${newsScenario === 'all' ? local.demoBtnActive : ''}`}
            onClick={() => setNewsScenario('all')}
          >
            Many ({sortedNews.length})
          </button>
          <button
            type="button"
            className={`${local.demoBtn} ${newsScenario === 'single' ? local.demoBtnActive : ''}`}
            onClick={() => setNewsScenario('single')}
          >
            Single (1)
          </button>
        </div>
      </div>

      <div className={local.layout}>
        <div className={`${shell.teamDetail} ${local.mainCol}`}>
        <BackButton to="/prototypes/teams" />
        <div className={shell.teamDetail__container}>
        {/* Details */}
        <div className={shell.teamDetail__Container__details}>
          <TeamDetailsView team={team} />
        </div>

        {/* Fund details (team.isFund) */}
        {team?.isFund && <TeamInvestorView team={team} />}

        {/* Contact */}
        <div className={shell.teamDetail__container__contact}>
          <TeamContactView team={team} />
        </div>

        {/* Membership source + community affiliations — import-safe production view. */}
        <DetailsSection>
          <DetailsSectionHeader title="Membership Source" />
          <DetailsSectionGreyContentContainer>
            {team?.membershipSources?.length ? (
              <TagsList tags={team.membershipSources} tagsToShow={5} />
            ) : (
              <NoDataBlock>No membership source added.</NoDataBlock>
            )}
          </DetailsSectionGreyContentContainer>
        </DetailsSection>

        <DetailsSection>
          <DetailsSectionHeader title="Community Affiliations" />
          <DetailsSectionGreyContentContainer>
            {team?.communityAffiliations?.length ? (
              <TagsList tags={team.communityAffiliations} tagsToShow={5} />
            ) : (
              <NoDataBlock>No community affiliations.</NoDataBlock>
            )}
          </DetailsSectionGreyContentContainer>
        </DetailsSection>

        {/* Members */}
        <div className={shell.teamDetail__container__member}>
          <TeamMembersView team={team} members={MOCK_MEMBERS} />
        </div>

        {/* Focus areas — import-safe production view. */}
        <DetailsSection>
          <TeamFocusAreasView team={team} userInfo={null} focusAreas={focusAreas} toggleIsEditMode={() => {}} />
        </DetailsSection>

          {/* Projects */}
          <TeamProjectsView team={team} projects={MOCK_PROJECTS} />
        </div>
      </div>

      {/* News rail — team-related news (mocked), reusing the homepage NewsCard. */}
      <aside className={local.rail}>
        {/* Spacer — nudges the news panel up so its cards line up with the
            first team section. */}
        <div className={local.railSpacer} aria-hidden="true" />
        <div className={local.newsPanel}>
          <DetailsSectionHeader title={`${team.name} News (${displayNews.length})`} />
          <div className={local.newsList}>
            {previewNews.map((item) => (
              <NewsCardView key={item.uid} item={item} flat />
            ))}
          </div>
          {hasMore && (
            <button type="button" className={local.viewAll} onClick={() => setNewsModalOpen(true)}>
              View all news ({displayNews.length})
            </button>
          )}
        </div>
      </aside>

      {/* Full feed — modal with its own scroll, same news cards as the rail. */}
      <Modal isOpen={newsModalOpen} onClose={closeNewsModal} className={local.newsModal}>
        <div className={local.modalHeader}>
          <span className={local.modalTitle}>{team.name} News ({displayNews.length})</span>
          <button type="button" className={local.modalClose} onClick={closeNewsModal} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className={local.modalSearchWrap}>
          <SearchInput
            value={newsQuery}
            onChange={setNewsQuery}
            placeholder="Search news by keyword or type"
          />
        </div>
        <div className={local.modalBody}>
          {filteredNews.length > 0 ? (
            <div className={local.modalGrid}>
              {filteredNews.map((item) => (
                <NewsCardView key={item.uid} item={item} />
              ))}
            </div>
          ) : (
            <div className={local.modalEmpty}>No news matches “{newsQuery}”.</div>
          )}
        </div>
        </Modal>
      </div>
    </div>
  );
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

