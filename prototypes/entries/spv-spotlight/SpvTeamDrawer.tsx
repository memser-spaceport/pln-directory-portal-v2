'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common/Button';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
import { TagsList } from '@/components/common/profile/TagsList';
import { TeamFocusAreasView } from '@/components/page/team-details/TeamFocusAreas/components/TeamFocusAreasView';
import { useGetFocusAreasToDisplay } from '@/components/page/team-details/TeamFocusAreas/hooks/useGetFocusAreasToDisplay';
// Drawer chrome is the Demo Day team drawer's (TeamDetailsDrawer): overlay,
// 938px sliding panel, sticky header with Back, scrolling body, footer.
import dr from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamDetailsDrawer/TeamDetailsDrawer.module.scss';
// The body is the dev team page (/teams/[id]) section by section, through the
// mocked views the team-profile and demoday-tag-placements prototypes already
// keep for it. Order follows app/teams/[id]/page.tsx.
import shell from '@/app/teams/[id]/page.module.css';
import { TeamDetailsView } from '../team-profile/TeamDetailsView';
import { TeamContactView } from '../team-profile/TeamContactView';
import { TeamMembersView } from '../team-profile/TeamMembersView';
import { TeamProjectsView } from '../team-profile/TeamProjectsView';
import { NewsCardView } from '../team-profile/NewsCardView';
import { EventsContributionsView } from '../demoday-tag-placements/EventsContributionsView';
import { SPV_FOCUS_AREAS, type SpvTeam } from './teams';
import s from './SpvSpotlight.module.scss';

type Props = {
  team: SpvTeam | null;
  index: number;
  total: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  // What the footer offers. `materials`: approved + open, the team's own
  // DocSend. `apply`: hasn't applied yet. `none`: pending / rejected — the
  // hero already says why there is nothing to press.
  cta: 'materials' | 'apply' | 'none';
  onApply: () => void;
};

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d={dir === 'left' ? 'M12.5 5L7.5 10L12.5 15' : 'M7.5 5L12.5 10L7.5 15'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ExternalIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5 7 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SpvTeamDrawer = ({ team, index, total, onClose, onStep, cta, onApply }: Props) => {
  const focusAreas = useGetFocusAreasToDisplay(SPV_FOCUS_AREAS, team?.teamFocusAreas ?? []);

  useEffect(() => {
    if (!team) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [team, onClose]);

  return (
    <AnimatePresence>
      {team && (
        <motion.div
          className={dr.drawerOverlay}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.div
            className={dr.drawerContainer}
            role="dialog"
            aria-modal
            aria-label={team.name}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className={dr.drawerContent}>
              <div className={dr.drawerHeader}>
                <div className={`${dr.breadcrumbs} ${s.drawerHeaderRow}`}>
                  <button className={dr.backButton} onClick={onClose}>
                    <BackIcon />
                    <span>Back</span>
                  </button>
                  {/* Many teams: step through them without closing. Not in
                      the Demo Day drawer — added for the SPV list. */}
                  <div className={s.stepper}>
                    <span className={s.stepperCount}>
                      {index + 1} of {total}
                    </span>
                    <button
                      type="button"
                      className={dr.backButton}
                      onClick={() => onStep(-1)}
                      disabled={index === 0}
                      aria-label="Previous team"
                    >
                      <Chevron dir="left" />
                    </button>
                    <button
                      type="button"
                      className={dr.backButton}
                      onClick={() => onStep(1)}
                      disabled={index === total - 1}
                      aria-label="Next team"
                    >
                      <Chevron dir="right" />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`${dr.drawerBody} ${s.drawerBody}`}>
                <div className={`${shell.teamDetail__container} ${s.teamColumn}`}>
                  <div className={shell.teamDetail__Container__details}>
                    <TeamDetailsView team={team.team} />
                  </div>

                  <div className={shell.teamDetail__container__contact}>
                    <TeamContactView team={team.team} />
                  </div>

                  <DetailsSection>
                    <DetailsSectionHeader title="Membership Source" />
                    <DetailsSectionGreyContentContainer>
                      {team.team.membershipSources?.length ? (
                        <TagsList tags={team.team.membershipSources} tagsToShow={5} />
                      ) : (
                        <NoDataBlock>No membership source added.</NoDataBlock>
                      )}
                    </DetailsSectionGreyContentContainer>
                  </DetailsSection>

                  <DetailsSection>
                    <DetailsSectionHeader title="Community Affiliations" />
                    <DetailsSectionGreyContentContainer>
                      {team.team.communityAffiliations?.length ? (
                        <TagsList tags={team.team.communityAffiliations} tagsToShow={5} />
                      ) : (
                        <NoDataBlock>No community affiliations.</NoDataBlock>
                      )}
                    </DetailsSectionGreyContentContainer>
                  </DetailsSection>

                  {/* Dev hides the contributions block when a team has none. */}
                  {team.contributions.length > 0 && <EventsContributionsView groups={team.contributions} />}

                  <div className={shell.teamDetail__container__member}>
                    <TeamMembersView team={team.team} members={team.members} />
                  </div>

                  {/* Open roles are left out: hiring is not what an investor
                      opens this drawer for. */}

                  <DetailsSection>
                    <TeamFocusAreasView
                      team={team.team}
                      userInfo={null}
                      focusAreas={focusAreas}
                      toggleIsEditMode={() => {}}
                    />
                  </DetailsSection>

                  <TeamProjectsView team={team.team} projects={team.projects} />

                  {/* Dev shows news as a right-hand rail; a 938px drawer has one
                      column, so it becomes the last section. */}
                  {team.news.length > 0 && (
                    <DetailsSection>
                      <DetailsSectionHeader title={`News (${team.news.length})`} />
                      <div className={s.newsList}>
                        {team.news.map((item) => (
                          <NewsCardView key={item.uid} item={item} hideTeam flat />
                        ))}
                      </div>
                    </DetailsSection>
                  )}
                </div>
              </div>

              {cta !== 'none' && (
                <div className={`${dr.drawerFooter} ${s.drawerFooter}`}>
                  {cta === 'materials' ? (
                    <a href={team.docSendUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="m" style="fill" variant="primary">
                        View materials <ExternalIcon />
                      </Button>
                    </a>
                  ) : (
                    <>
                      <span className={s.footerNote}>Materials open once your application is approved.</span>
                      <Button size="m" style="fill" variant="primary" onClick={onApply}>
                        Apply to view materials
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
