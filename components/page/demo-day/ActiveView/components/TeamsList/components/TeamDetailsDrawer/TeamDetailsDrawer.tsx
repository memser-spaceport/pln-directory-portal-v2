import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ProfileHeader } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileHeader';
import { ProfileContent } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileContent';
import { TeamProfile } from '@/services/demo-day/hooks/useGetTeamsList';
import s from './TeamDetailsDrawer.module.scss';
import { EditProfileDrawer } from '@/components/page/demo-day/FounderPendingView/components/EditProfileDrawer';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { createDemoDayEmailHandler, DemoDayEmailData } from '@/utils/demo-day-email.utils';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.5 5L7.5 10L12.5 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface TeamDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamProfile | null;
  scrollPosition: number;
  investorData?: {
    name: string;
    teamName: string;
    email: string;
  };
}

export const TeamDetailsDrawer: React.FC<TeamDetailsDrawerProps> = ({
  isOpen,
  onClose,
  team,
  scrollPosition,
  investorData,
}) => {
  const { data } = useGetFundraisingProfile();

  if (!team) return null;

  const displayTeam = team;

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (team?.team?.uid === data?.teamUid) {
    return <EditProfileDrawer isOpen={isOpen} onClose={onClose} scrollPosition={0} data={data} />;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={s.drawerOverlay}
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.div
              className={s.drawerContainer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className={s.drawerContent}>
                {/* Header */}
                <div className={s.drawerHeader}>
                  <div className={s.breadcrumbs}>
                    <button className={s.backButton} onClick={onClose}>
                      <BackIcon />
                      <span>Back</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className={s.drawerBody}>
                  <>
                    {/* Profile Header */}
                    <div className={s.profileSection}>
                      <ProfileHeader
                        image={displayTeam.team.logo?.url || '/images/demo-day/profile-placeholder.svg'}
                        name={displayTeam.team?.name || 'Team Name'}
                        description={displayTeam?.team?.shortDescription || '-'}
                        fundingStage={displayTeam?.team.fundingStage.title || '-'}
                        tags={displayTeam?.team.industryTags.map((tag) => tag.title) || []}
                      />
                    </div>

                    {/* Founders Section */}
                    {/*{teamDetails?.founders && teamDetails.founders.length > 0 && (*/}
                    {/*  <div className={s.foundersSection}>*/}
                    {/*    <h3 className={s.sectionTitle}>Founders</h3>*/}
                    {/*    {teamDetails.founders.map((founder) => (*/}
                    {/*      <div className={s.founderRow} key={founder.uid}>*/}
                    {/*        <div className={s.founderAvatar}>*/}
                    {/*          <Image*/}
                    {/*            src={founder.image?.url || '/images/demo-day/profile-placeholder.svg'}*/}
                    {/*            alt={founder.name}*/}
                    {/*            width={48}*/}
                    {/*            height={48}*/}
                    {/*          />*/}
                    {/*        </div>*/}
                    {/*        <div className={s.founderInfo}>*/}
                    {/*          <div className={s.founderNameRole}>*/}
                    {/*            <h4 className={s.founderName}>{founder.name}</h4>*/}
                    {/*            <p className={s.founderRole}>{founder.role}</p>*/}
                    {/*          </div>*/}
                    {/*          {founder.officeHours && <p className={s.founderStatus}>Available to connect</p>}*/}
                    {/*        </div>*/}
                    {/*        <div className={s.founderBadges}>*/}
                    {/*          {founder.skills.map((skill) => (*/}
                    {/*            <span className={s.founderBadge} key={skill.uid}>*/}
                    {/*              {skill.title}*/}
                    {/*            </span>*/}
                    {/*          ))}*/}
                    {/*        </div>*/}
                    {/*        <Link href={`/members/${founder.uid}`} target="_blank" className={s.founderArrow}>*/}
                    {/*          <svg*/}
                    {/*            width="16"*/}
                    {/*            height="16"*/}
                    {/*            viewBox="0 0 16 16"*/}
                    {/*            fill="none"*/}
                    {/*            xmlns="http://www.w3.org/2000/svg"*/}
                    {/*          >*/}
                    {/*            <path*/}
                    {/*              d="M11.354 8.35354L6.35403 13.3535C6.30757 13.4 6.25242 13.4368 6.19173 13.462C6.13103 13.4871 6.06598 13.5001 6.00028 13.5001C5.93458 13.5001 5.86953 13.4871 5.80883 13.462C5.74813 13.4368 5.69298 13.4 5.64653 13.3535C5.60007 13.3071 5.56322 13.2519 5.53808 13.1912C5.51294 13.1305 5.5 13.0655 5.5 12.9998C5.5 12.9341 5.51294 12.869 5.53808 12.8083C5.56322 12.7476 5.60007 12.6925 5.64653 12.646L10.2934 7.99979L5.64653 3.35354C5.55271 3.25972 5.5 3.13247 5.5 2.99979C5.5 2.86711 5.55271 2.73986 5.64653 2.64604C5.74035 2.55222 5.8676 2.49951 6.00028 2.49951C6.13296 2.49951 6.26021 2.55222 6.35403 2.64604L11.354 7.64604C11.4005 7.69248 11.4374 7.74762 11.4626 7.80832C11.4877 7.86902 11.5007 7.93408 11.5007 7.99979C11.5007 8.0655 11.4877 8.13056 11.4626 8.19126C11.4374 8.25196 11.4005 8.3071 11.354 8.35354Z"*/}
                    {/*              fill="#455468"*/}
                    {/*            />*/}
                    {/*          </svg>*/}
                    {/*        </Link>*/}
                    {/*      </div>*/}
                    {/*    ))}*/}
                    {/*  </div>*/}
                    {/*)}*/}

                    {/* Profile Content */}
                    <div className={s.contentSection}>
                      <ProfileContent
                        pitchDeckUrl={displayTeam?.onePagerUpload?.url}
                        videoUrl={displayTeam?.videoUpload?.url}
                      />
                    </div>
                  </>
                </div>

                {/* Footer Actions */}
                <div className={s.drawerFooter}>
                  <div className={s.actions}>
                    <button
                      className={s.secondaryButton}
                      onClick={emailData ? createDemoDayEmailHandler('like', emailData) : undefined}
                      disabled={!emailData}
                    >
                      <Image src="/images/demo-day/heart.png" alt="Like" width={16} height={16} />
                      Like Company
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
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
