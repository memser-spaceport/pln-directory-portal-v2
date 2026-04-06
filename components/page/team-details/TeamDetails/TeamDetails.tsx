'use client';

import Image from 'next/image';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { IUserInfo } from '@/types/shared.types';
import { ITag, ITeam } from '@/types/teams.types';

import { isTierUser } from '@/utils/user/isTierUser';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { deleteTeam } from '@/app/actions/teams.actions';
import { getTeamPriority, getPriorityLabel, getTechnologyImage } from '@/utils/team.utils';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

import { ExpandableDescription } from '@/components/common/ExpandableDescription';
import { Tag } from '@/components/ui/Tag';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { TagsList } from '@/components/common/profile/TagsList';
import { DetailsSection, HeaderActionBtn } from '@/components/common/profile/DetailsSection';
import { ConfirmDialog } from '@/components/core/ConfirmDialog/ConfirmDialog';
import { EditButton } from '@/components/common/profile/EditButton';
import { Divider } from '@/components/common/profile/Divider';

import { isTeamLeaderOrAdmin } from '../utils/isTeamLeaderOrAdmin';

import { PlusIconCircle } from './icons';
import { EditTeamDetailsForm } from './components/EditTeamDetailsForm';

import s from './TeamDetails.module.scss';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import clsx from 'clsx';

interface Props {
  team: ITeam;
  userInfo: IUserInfo | undefined;
}

export const TeamDetails = (props: Props) => {
  const params = useParams();
  const team = props?.team;

  const teamName = team?.name ?? '';
  const userInfo = props?.userInfo;
  const defaultAvatarImage = useDefaultAvatar(team?.name ?? '');
  const logo = team?.logo ?? defaultAvatarImage ?? '/icons/team-default-profile.svg';

  const isAdmin = isAdminUser(userInfo);

  const isTierViewer = isTierUser(userInfo) || isAdmin;
  const tags = useMemo(() => {
    const priority = getTeamPriority(team);
    if (isTierViewer && priority !== undefined) {
      return [
        {
          title: getPriorityLabel(priority),
          icon: <Image src="/icons/stack.svg" alt="stack" width={16} height={14} />,
        } as ITag,
        ...(team?.industryTags ?? []),
      ];
    }
    return team?.industryTags;
  }, [team, isTierViewer]);
  const teamId = params?.id;
  const about = team?.longDescription ?? '';
  const hasAbout = !!about && about.trim() !== '<p><br></p>';
  const hasTeamEditAccess = isTeamLeaderOrAdmin(userInfo, team?.id);

  const [editView, setEditView] = useState(false);
  const [isTechnologyPopup, setIsTechnologyPopup] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const analytics = useTeamAnalytics();

  const router = useRouter();
  useMobileNavVisibility(editView);

  const onTagCountClickHandler = () => {
    setIsTechnologyPopup(!isTechnologyPopup);
  };

  const onEditTeamClickHandler = () => {
    if (isAdmin) {
      analytics.onEditTeamByAdmin(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    } else {
      analytics.onEditTeamByLead(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    }
    setEditView(true);
  };

  const onDeleteTeamClickHandler = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const authToken = Cookies.get('authToken');
      if (!authToken) {
        alert('Authentication token not found');
        setIsDeleting(false);
        return;
      }

      const result = await deleteTeam(team?.id, JSON.parse(authToken));

      if (result?.isError) {
        alert(`Failed to delete team: ${result.errorMessage}`);
        setIsDeleting(false);
        return;
      }

      // Success - redirect to teams page
      setIsDeleteModalOpen(false);
      triggerLoader(true);
      router.push('/teams');
      router.refresh();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('An error occurred while deleting the team');
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  useEffect(() => {
    if (!editView) {
      triggerLoader(false);
    }
  }, [editView, router]);

  if (editView) {
    return (
      <DetailsSection editView>
        <EditTeamDetailsForm team={team} userInfo={userInfo} onClose={() => setEditView(false)} />
      </DetailsSection>
    );
  }

  return (
    <DetailsSection>
      {/* Name and about section */}
      <div className={s.profile}>
        <div className={s.logoTagsContainer}>
          <Image
            alt="profile"
            loading="eager"
            height={72}
            width={72}
            layout="intrinsic"
            priority={true}
            className={s.teamLogo}
            src={logo ?? defaultAvatarImage}
          />
          <div className={s.nameTagContainer}>
            <div className={s.nameAndActions}>
              <Tooltip asChild trigger={<h1 className={s.teamName}>{teamName}</h1>} content={teamName} />

              <div className={s.actions}>
                {hasTeamEditAccess && <EditButton onClick={onEditTeamClickHandler} />}

                {isAdmin && (
                  <HeaderActionBtn onClick={onDeleteTeamClickHandler} disabled={isDeleting} className={s.delete}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M11.8125 2.625H9.84375V1.96875C9.84375 1.56264 9.68242 1.17316 9.39526 0.885993C9.10809 0.598828 8.71861 0.4375 8.3125 0.4375H5.6875C5.28139 0.4375 4.89191 0.598828 4.60474 0.885993C4.31758 1.17316 4.15625 1.56264 4.15625 1.96875V2.625H2.1875C2.01345 2.625 1.84653 2.69414 1.72346 2.81721C1.60039 2.94028 1.53125 3.1072 1.53125 3.28125C1.53125 3.4553 1.60039 3.62222 1.72346 3.74529C1.84653 3.86836 2.01345 3.9375 2.1875 3.9375H2.40625V11.375C2.40625 11.6651 2.52148 11.9433 2.7266 12.1484C2.93172 12.3535 3.20992 12.4688 3.5 12.4688H10.5C10.7901 12.4688 11.0683 12.3535 11.2734 12.1484C11.4785 11.9433 11.5938 11.6651 11.5938 11.375V3.9375H11.8125C11.9865 3.9375 12.1535 3.86836 12.2765 3.74529C12.3996 3.62222 12.4688 3.4553 12.4688 3.28125C12.4688 3.1072 12.3996 2.94028 12.2765 2.81721C12.1535 2.69414 11.9865 2.625 11.8125 2.625ZM5.46875 1.96875C5.46875 1.91073 5.4918 1.85509 5.53282 1.81407C5.57384 1.77305 5.62948 1.75 5.6875 1.75H8.3125C8.37052 1.75 8.42616 1.77305 8.46718 1.81407C8.5082 1.85509 8.53125 1.91073 8.53125 1.96875V2.625H5.46875V1.96875ZM10.2812 11.1562H3.71875V3.9375H10.2812V11.1562ZM6.34375 5.6875V9.1875C6.34375 9.36155 6.27461 9.52847 6.15154 9.65154C6.02847 9.77461 5.86155 9.84375 5.6875 9.84375C5.51345 9.84375 5.34653 9.77461 5.22346 9.65154C5.10039 9.52847 5.03125 9.36155 5.03125 9.1875V5.6875C5.03125 5.51345 5.10039 5.34653 5.22346 5.22346C5.34653 5.10039 5.51345 5.03125 5.6875 5.03125C5.86155 5.03125 6.02847 5.10039 6.15154 5.22346C6.27461 5.34653 6.34375 5.51345 6.34375 5.6875ZM8.96875 5.6875V9.1875C8.96875 9.36155 8.89961 9.52847 8.77654 9.65154C8.65347 9.77461 8.48655 9.84375 8.3125 9.84375C8.13845 9.84375 7.97153 9.77461 7.84846 9.65154C7.72539 9.52847 7.65625 9.36155 7.65625 9.1875V5.6875C7.65625 5.51345 7.72539 5.34653 7.84846 5.22346C7.97153 5.10039 8.13845 5.03125 8.3125 5.03125C8.48655 5.03125 8.65347 5.10039 8.77654 5.22346C8.89961 5.34653 8.96875 5.51345 8.96875 5.6875Z"
                        fill="currentColor"
                      />
                    </svg>
                    Delete
                  </HeaderActionBtn>
                )}
              </div>
            </div>
            <div className={s.tagsContainer}>
              {hasTeamEditAccess && !team?.fundingStage?.title && (
                <div className={s.tags}>
                  <button type="button" className={clsx(s.addPill, s.addPill1)} onClick={onEditTeamClickHandler}>
                    <PlusIconCircle />
                    <span>Add Company Stage</span>
                  </button>
                </div>
              )}
              <div className={s.tags2}>
                {team?.fundingStage?.title && (
                  <>
                    <div className={s.fundingStage}>Stage: {team.fundingStage.title}</div>
                    <Divider />
                  </>
                )}
                {team?.isFund && (
                  <>
                    <Tag value="Investment Fund" className={s.iTag} />
                    <Divider />
                  </>
                )}
                {!!tags?.length && <TagsList tags={tags || []} />}{' '}
              </div>
              <div className={s.tags3}>
                {!team?.industryTags?.length && hasTeamEditAccess && (
                  <>
                    <button type="button" className={s.addPill} onClick={onEditTeamClickHandler}>
                      <PlusIconCircle />
                      <span>Add Industry Tags</span>
                    </button>
                  </>
                )}
                {!hasAbout && hasTeamEditAccess && (
                  <>
                    {!team?.industryTags?.length && hasTeamEditAccess && <Divider />}
                    <button type="button" className={s.addPill} onClick={onEditTeamClickHandler}>
                      <PlusIconCircle />
                      <span>Add About Section</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Confirm Delete"
        desc={`Are you sure you want to delete the team ${teamName}?`}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmTitle="Delete"
        disabled={isDeleting}
      />

      {/* About */}
      {hasAbout && (
        <div className={s.aboutContainer}>
          <div className={s.aboutTitle}>About</div>
          <ExpandableDescription>
            <div className={s.aboutContent} dangerouslySetInnerHTML={{ __html: about }} />
          </ExpandableDescription>
        </div>
      )}
    </DetailsSection>
  );
};
