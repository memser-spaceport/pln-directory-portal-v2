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
import { isEditorEmpty } from '@/utils/isEditorEmpty';

import Technologies from '../technologies';
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
  const technologies =
    team?.technologies?.map((item) => ({ name: item?.title, url: getTechnologyImage(item?.title) })) ?? [];
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

      {/* Technology */}
      <Technologies technologies={technologies} team={team} userInfo={userInfo} />
    </DetailsSection>
  );
};

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 8C13.5 8.13261 13.4473 8.25979 13.3536 8.35355C13.2598 8.44732 13.1326 8.5 13 8.5H8.5V13C8.5 13.1326 8.44732 13.2598 8.35355 13.3536C8.25979 13.4473 8.13261 13.5 8 13.5C7.86739 13.5 7.74021 13.4473 7.64645 13.3536C7.55268 13.2598 7.5 13.1326 7.5 13V8.5H3C2.86739 8.5 2.74021 8.44732 2.64645 8.35355C2.55268 8.25979 2.5 8.13261 2.5 8C2.5 7.86739 2.55268 7.74021 2.64645 7.64645C2.74021 7.55268 2.86739 7.5 3 7.5H7.5V3C7.5 2.86739 7.55268 2.74021 7.64645 2.64645C7.74021 2.55268 7.86739 2.5 8 2.5C8.13261 2.5 8.25979 2.55268 8.35355 2.64645C8.44732 2.74021 8.5 2.86739 8.5 3V7.5H13C13.1326 7.5 13.2598 7.55268 13.3536 7.64645C13.4473 7.74021 13.5 7.86739 13.5 8Z"
      fill="currentColor"
    />
  </svg>
);

const PlusIconCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 1.25C6.66498 1.25 5.35994 1.64588 4.2499 2.38758C3.13987 3.12928 2.27471 4.18349 1.76382 5.41689C1.25292 6.65029 1.11925 8.00749 1.3797 9.31686C1.64015 10.6262 2.28303 11.829 3.22703 12.773C4.17104 13.717 5.37377 14.3598 6.68314 14.6203C7.99252 14.8808 9.34971 14.7471 10.5831 14.2362C11.8165 13.7253 12.8707 12.8601 13.6124 11.7501C14.3541 10.6401 14.75 9.33502 14.75 8C14.748 6.2104 14.0362 4.49466 12.7708 3.22922C11.5053 1.96378 9.78961 1.25199 8 1.25ZM8 13.25C6.96165 13.25 5.94662 12.9421 5.08326 12.3652C4.2199 11.7883 3.547 10.9684 3.14964 10.0091C2.75228 9.04978 2.64831 7.99418 2.85088 6.97578C3.05345 5.95738 3.55347 5.02191 4.28769 4.28769C5.02192 3.55346 5.95738 3.05345 6.97578 2.85088C7.99418 2.6483 9.04978 2.75227 10.0091 3.14963C10.9684 3.54699 11.7883 4.2199 12.3652 5.08326C12.9421 5.94661 13.25 6.96165 13.25 8C13.2485 9.39193 12.6949 10.7264 11.7107 11.7107C10.7264 12.6949 9.39193 13.2485 8 13.25ZM11.25 8C11.25 8.19891 11.171 8.38968 11.0303 8.53033C10.8897 8.67098 10.6989 8.75 10.5 8.75H8.75V10.5C8.75 10.6989 8.67098 10.8897 8.53033 11.0303C8.38968 11.171 8.19892 11.25 8 11.25C7.80109 11.25 7.61032 11.171 7.46967 11.0303C7.32902 10.8897 7.25 10.6989 7.25 10.5V8.75H5.5C5.30109 8.75 5.11033 8.67098 4.96967 8.53033C4.82902 8.38968 4.75 8.19891 4.75 8C4.75 7.80109 4.82902 7.61032 4.96967 7.46967C5.11033 7.32902 5.30109 7.25 5.5 7.25H7.25V5.5C7.25 5.30109 7.32902 5.11032 7.46967 4.96967C7.61032 4.82902 7.80109 4.75 8 4.75C8.19892 4.75 8.38968 4.82902 8.53033 4.96967C8.67098 5.11032 8.75 5.30109 8.75 5.5V7.25H10.5C10.6989 7.25 10.8897 7.32902 11.0303 7.46967C11.171 7.61032 11.25 7.80109 11.25 8Z"
      fill="#455468"
    />
  </svg>
);
