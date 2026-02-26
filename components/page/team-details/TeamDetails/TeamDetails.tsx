'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { IUserInfo } from '@/types/shared.types';
import { ITag, ITeam } from '@/types/teams.types';
import { ADMIN_ROLE } from '@/utils/constants';
import { getTeamPriority, getTechnologyImage, getPriorityLabel } from '@/utils/team.utils';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState } from 'react';
import About from '../about';
import Technologies from '../technologies';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { deleteTeam } from '@/app/actions/teams.actions';
import Cookies from 'js-cookie';
import { ConfirmDialog } from '@/components/core/ConfirmDialog/ConfirmDialog';

import s from './TeamDetails.module.scss';

interface ITeamDetails {
  team: ITeam;
  userInfo: IUserInfo | undefined;
}

const TeamDetails = (props: ITeamDetails) => {
  const params = useParams();
  const team = props?.team;
  const logo = team?.logo ?? '/icons/team-default-profile.svg';
  const teamName = team?.name ?? '';
  const userInfo = props?.userInfo;
  const isTierViewer = userInfo?.isTierViewer || userInfo?.roles?.includes(ADMIN_ROLE);
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
  }, [team?.industryTags, isTierViewer, team?.priority, team?.tier]);
  const teamId = params?.id;
  const about = team?.longDescription ?? '';
  const technologies =
    team?.technologies?.map((item) => ({ name: item?.title, url: getTechnologyImage(item?.title) })) ?? [];
  const hasTeamEditAccess = getHasTeamEditAccess();
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);

  const [isTechnologyPopup, setIsTechnologyPopup] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const analytics = useTeamAnalytics();

  const router = useRouter();

  const onTagCountClickHandler = () => {
    setIsTechnologyPopup(!isTechnologyPopup);
  };

  function getHasTeamEditAccess() {
    try {
      if (userInfo?.roles?.includes(ADMIN_ROLE) || userInfo?.leadingTeams?.includes(team?.id)) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  const onEditTeamClickHandler = () => {
    if (userInfo?.roles?.includes(ADMIN_ROLE)) {
      analytics.onEditTeamByAdmin(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    } else {
      analytics.onEditTeamByLead(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    }
    triggerLoader(true);
    router.push(`/settings/teams?id=${team?.id}`);
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
    triggerLoader(false);
  }, [router]);

  return (
    <>
      <div className={s.root}>
        {/* Name and about section */}
        <div className={s.profile}>
          <div className={s.logoTagsContainer}>
            <img
              loading="lazy"
              alt="team-profile"
              className={s.teamLogo}
              src={logo}
            />
            <div className={s.nameTagContainer}>
              <Tooltip
                asChild
                trigger={
                  <h1 className={s.teamName}>
                    {teamName}
                  </h1>
                }
                content={teamName}
              />
              <div>
                {/* Tags Mobile */}
                <div className={s.tagsMobile}>
                  {team?.isFund && <div className={s.investorTag}>Investment Fund</div>}
                  {tags?.map((tag: ITag, index: number) => (
                    <Fragment key={`${tag} + ${index}`}>
                      {index < 3 && (
                        <div>
                          {
                            <Tooltip
                              asChild
                              trigger={
                                <div>
                                  <Tag
                                    value={tag?.title}
                                    variant="primary"
                                    tagsLength={tags?.length}
                                    color={tag?.color}
                                  />{' '}
                                </div>
                              }
                              content={tag?.title}
                            />
                          }
                        </div>
                      )}
                    </Fragment>
                  ))}
                  {!!tags?.length && tags?.length > 3 && (
                    <Tooltip
                      asChild
                      trigger={
                        <div>
                          <Tag
                            callback={onTagCountClickHandler}
                            variant="primary"
                            value={'+' + (tags?.length - 3).toString()}
                          />{' '}
                        </div>
                      }
                      content={
                        <div>
                          {tags?.slice(3, tags?.length).map((tag, index) => (
                            <div key={`${tag} + ${tag} + ${index}`}>
                              {tag?.title} {index !== tags?.slice(3, tags?.length - 1)?.length ? ',' : ''}
                            </div>
                          ))}
                        </div>
                      }
                    />
                  )}
                </div>
                {/* Tags web */}
                <div className={s.tagsWeb}>
                  {team?.isFund && <div className={s.investorTag}>Investment Fund</div>}
                  {tags?.map((tag: ITag, index: number) => (
                    <Fragment key={`${tag} + ${index}`}>
                      {index < 5 && (
                        <div>
                          <Tooltip
                            asChild
                            trigger={
                              <div>
                                <Tag value={tag?.title} color={tag?.color} icon={tag?.icon} />{' '}
                              </div>
                            }
                            content={tag?.title}
                          />
                        </div>
                      )}
                    </Fragment>
                  ))}
                  {!!tags?.length && tags?.length > 5 && (
                    <Tooltip
                      asChild
                      trigger={
                        <div>
                          <Tag
                            callback={onTagCountClickHandler}
                            variant="primary"
                            value={'+' + (tags?.length - 5).toString()}
                          />
                        </div>
                      }
                      content={
                        <div>
                          {tags?.slice(5, tags?.length).map((tag, index) => (
                            <div key={`${tag} + ${tag} + ${index}`}>
                              {tag?.title} {index !== tags?.slice(3, tags?.length - 1)?.length ? ',' : ''}
                            </div>
                          ))}
                        </div>
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={s.actions}>
            {hasTeamEditAccess && (
              <button className={s.edit} onClick={onEditTeamClickHandler}>
                <Image src="/icons/edit.svg" alt="Edit" height={16} width={16} />
                Edit Team
              </button>
            )}

            {isAdmin && (
              <button
                className={s.delete}
                onClick={onDeleteTeamClickHandler}
                disabled={isDeleting}
              >
                <Image src="/icons/trash.svg" alt="Delete" height={16} width={16} />
                Delete Team
              </button>
            )}
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
        <About team={team} userInfo={userInfo} about={about} hasTeamEditAccess={hasTeamEditAccess} />

        {/* Technology */}
        <Technologies technologies={technologies} team={team} userInfo={userInfo} />
      </div>
    </>
  );
};

export default TeamDetails;
