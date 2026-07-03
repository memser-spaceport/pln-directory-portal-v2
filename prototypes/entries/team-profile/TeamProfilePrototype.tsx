'use client';

import { useEffect, useRef, useState } from 'react';

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
import { useIsMobile } from '@/hooks/useIsMobile';

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
import { NewsFullPageView } from './NewsFullPageView';
import { TeamFollowBlock } from './TeamFollowBlock';
import { TeamAdminActions } from './TeamAdminActions';
import { FollowPill } from '../follow-shared/FollowPill';
import { FollowToast } from '../follow-shared/FollowToast';
import local from './TeamProfile.module.scss';
import {
  MOCK_TEAM,
  MOCK_MEMBERS,
  MOCK_FOCUS_AREAS,
  MOCK_TEAM_FOCUS_AREAS,
  MOCK_PROJECTS,
  MOCK_NEWS,
  MOCK_FOLLOWERS,
  TEAM_FOLLOWER_COUNT,
} from './mocks';

const team = MOCK_TEAM as unknown as ITeam;

const NEWS_PREVIEW_COUNT = 3;

export default function TeamProfilePrototype() {
  // Several reused leaf components are base-ui / client-only (Tooltip, Tag
  // popovers). Gate render on mount so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsQuery, setNewsQuery] = useState('');
  const [following, setFollowing] = useState(false);
  const [followToast, setFollowToast] = useState(false);
  const followToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Demo-only: public vs team view. Both put the follow cluster in the header
  // card's top-right corner: public gets the Follow pill, team gets the
  // follower avatar stack + count (opens the full-list modal).
  const [view, setView] = useState<'public' | 'team'>('team');
  useEffect(() => setMounted(true), []);
  useEffect(() => () => {
    if (followToastTimer.current) clearTimeout(followToastTimer.current);
  }, []);

  const handleFollowToggle = () => {
    setFollowing((prev) => {
      const willFollow = !prev;
      if (willFollow) {
        setFollowToast(true);
        if (followToastTimer.current) clearTimeout(followToastTimer.current);
        followToastTimer.current = setTimeout(() => setFollowToast(false), 4000);
      }
      return willFollow;
    });
  };

  const displayNews = [...MOCK_NEWS].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );

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

  const followCount = TEAM_FOLLOWER_COUNT;

  return (
    <div className={local.page}>
      <div className={local.demoBar}>
        <span className={local.demoLabel}>View</span>
        <div className={local.demoSwitch}>
          <button
            type="button"
            className={`${local.demoBtn} ${view === 'team' ? local.demoBtnActive : ''}`}
            onClick={() => setView('team')}
          >
            Team
          </button>
          <button
            type="button"
            className={`${local.demoBtn} ${view === 'public' ? local.demoBtnActive : ''}`}
            onClick={() => setView('public')}
          >
            Public
          </button>
        </div>

      </div>

      <div className={local.layout}>
        <div className={`${shell.teamDetail} ${local.mainCol}`}>
        <BackButton to="/prototypes/teams" />
        <div className={shell.teamDetail__container}>
        {/* Details — the follow block sits before the About section. */}
        <div className={shell.teamDetail__Container__details}>
          <TeamDetailsView
            team={team}
            headerAction={
              view === 'public' ? (
                <div className={`${local.followHeader} ${local.followClusterMobile}`}>
                  <FollowPill following={following} onToggle={handleFollowToggle} name={team.name ?? 'this team'} />
                  {/* Reserve the caption's height once following so nothing below jumps. */}
                  <p className={`${local.followCaption} ${following ? local.followCaptionHidden : ''}`}>
                    Get updates &amp; announcements
                  </p>
                </div>
              ) : (
                <div className={local.teamHeaderCluster}>
                  {/* Admin actions row (Edit + Delete): pinned top-right, level with the
                      team name, on every viewport — on mobile this escapes the
                      full-width wrap below via absolute positioning so it doesn't
                      end up stranded under the logo/tags. TeamFollowBlock (the
                      follower stack) keeps wrapping below on mobile as before. */}
                  <div className={local.adminActionsCorner}>
                    <TeamAdminActions teamName={team.name ?? 'this team'} />
                  </div>
                  <TeamFollowBlock count={followCount} followers={MOCK_FOLLOWERS} />
                </div>
              )
            }
          />
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
        {/* Reserve the Back button's height so the news panel lines up with the
            team card top (the main column has a Back button above it). */}
        <div className={local.railBackSpacer} aria-hidden="true">
          <BackButton to="/prototypes/teams" />
        </div>
        <div className={local.newsPanel}>
          <DetailsSectionHeader title={`${team.name} News (${displayNews.length})`} />
          <div className={local.newsList}>
            {previewNews.map((item) => (
              <NewsCardView key={item.uid} item={item} flat hideTeam />
            ))}
          </div>
          {hasMore && (
            <button type="button" className={local.viewAll} onClick={() => setNewsModalOpen(true)}>
              View all news ({displayNews.length})
            </button>
          )}
        </div>
      </aside>

      {/* Full feed. On mobile it opens as a full-screen page (Notifications-style);
          on desktop it stays a modal with its own scroll. */}
      {newsModalOpen && isMobile ? (
        <NewsFullPageView
          title={`${team.name} News`}
          count={displayNews.length}
          items={filteredNews}
          query={newsQuery}
          onQueryChange={setNewsQuery}
          onClose={closeNewsModal}
        />
      ) : (
      <Modal isOpen={newsModalOpen && !isMobile} onClose={closeNewsModal} className={local.newsModal}>
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
                <NewsCardView key={item.uid} item={item} hideTeam />
              ))}
            </div>
          ) : (
            <div className={local.modalEmpty}>No news matches “{newsQuery}”.</div>
          )}
        </div>
        </Modal>
      )}
      </div>

      {followToast && (
        <FollowToast>
          You&apos;re following <strong>{team.name}</strong> — you&apos;ll get its updates in your feed.
        </FollowToast>
      )}
    </div>
  );
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

