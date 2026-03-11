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

import Technologies from '../technologies';
import { EditTeamDetailsForm } from './components/EditTeamDetailsForm';

import s from './TeamDetails.module.scss';
import { DeleteIcon } from '@storybook/icons';

interface Props {
  team: ITeam;
  userInfo: IUserInfo | undefined;
}

export const TeamDetails = (props: Props) => {
  const params = useParams();
  const team = props?.team;
  const logo = team?.logo ?? '/icons/team-default-profile.svg';
  const teamName = team?.name ?? '';
  const userInfo = props?.userInfo;

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
          <img loading="lazy" alt="team-profile" className={s.teamLogo} src={logo} />
          <div className={s.nameTagContainer}>
            <div className={s.nameAndActions}>
              <Tooltip asChild trigger={<h1 className={s.teamName}>{teamName}</h1>} content={teamName} />

              <div className={s.actions}>
                {hasTeamEditAccess && <EditButton onClick={onEditTeamClickHandler} />}

                {isAdmin && (
                  <HeaderActionBtn onClick={onDeleteTeamClickHandler} disabled={isDeleting} className={s.delete}>
                    <DeleteIcon src="/icons/trash.svg" alt="Delete" height={16} width={16} />
                    Delete
                  </HeaderActionBtn>
                  // <button className={s.delete} onClick={onDeleteTeamClickHandler} disabled={isDeleting}>
                  //
                  // </button>
                )}
              </div>
            </div>
            <div>
              <div className={s.tags}>
                <div className={s.fundingStage}>Stage: {team?.fundingStage?.title}</div>
                <Divider />
                {team?.isFund && (
                  <>
                    <Tag value="Investment Fund" className={s.iTag} />
                    <Divider />
                  </>
                )}
                <TagsList tags={tags || []} />
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
      {about && (
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
