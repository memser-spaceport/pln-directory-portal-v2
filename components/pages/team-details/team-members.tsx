'use client';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';
import { PAGE_ROUTES } from '@/utils/constants';
import { Fragment, useState } from 'react';
import TeamDetailsMembersCard from './team-member-card';
import AllMembers from './all-members';
import Modal from '@/components/core/modal';

interface ITeamMembers {
  members: IMember[] | undefined;
  teamId: string;
  team: ITeam | undefined;
  userInfo: IUserInfo | undefined;
}

const TeamMembers = (props: ITeamMembers) => {
  const members = props?.members ?? [];
  const teamId = props?.teamId;
  const team = props?.team;
  const userInfo = props?.userInfo;

  const [isMemberModal, setIsMemberModal] = useState(false);
  //   const analytics = useTeamDetailAnalytics();

  const onClose = () => {
    setIsMemberModal(!isMemberModal);
  };

  const onSeeAllClickHandler = () => {
    if (!isMemberModal) {
      //   analytics.onSeeAllMemberClicked(getAnalyticsUserInfo(userInfo), getAnalyticsTeamInfo(team))
    }
    setIsMemberModal(!isMemberModal);
  };

  return (
    <>
      <div className="team-members">
        <div className="team-members__header">
          <h2 className="team-members__header__title">Members({members?.length ? members?.length : 0})</h2>
          {members?.length > 3 && (
            <button className="team-members__header__seeall-btn" onClick={onSeeAllClickHandler}>
              See all
            </button>
          )}
        </div>

        {/* Projects mob */}
        {/* <div className="team-members__members__mob">
          {members?.map((member: IMember, index: number) => {
            const team = member?.teams?.find((team: ITeam) => team.id === teamId);
            return (
              <Fragment key={`${member} + ${index}`}>
                {index < 3 && (
                  <div className={`${(index < 2 && members?.length > 2) ? "team-members__members__member__border-set" : ""}`}>
                    <TeamDetailsMembersCard url={`${PAGE_ROUTES.MEMBERS}/${member?.id}`} member={member} team={team}/>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div> */}

        {/* Projects web */}

        <div className="team-members__members__web">
          {members?.slice(0, 3)?.map((member: IMember, index: number) => {
            const team = member?.teams?.find((team: ITeam) => team.id === teamId);
            return (
              <Fragment key={`${member} + ${index}`}>
                <div className={`${index < members.length - 1 ? 'team-members__members__member__border-set' : ''}`}>
                  <TeamDetailsMembersCard url={`${PAGE_ROUTES.MEMBERS}/${member?.id}`} member={member} team={team} />
                </div>
              </Fragment>
            );
          })}
        </div>
        {!members?.length && <p className="team-members__empty">No members added yet</p>}
      </div>

      {isMemberModal && (
        <div className="all-member-container">
          <Modal onClose={onClose}>
            <AllMembers members={members} teamId={teamId} />
          </Modal>
        </div>
      )}

      <style jsx>
        {`
          .team-members {
            padding: 16px;
            border-radius: 8px;
            background: #fff;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .team-members__header {
            display: flex;
            justify-content: space-between;
          }

          .team-members__header__title {
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .team-members__header__seeall-btn {
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            border: none;
            background-color: #fff;
          }

          .team-members__members__mob {
            border-radius: 8px;
            background: #fff;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .team-members__empty {
            color: #0f172a;
            font-size: 12px;
            font-weight: 400;
            line-height: 20px;
            color: #000;
            letter-spacing: 0.12px;
            border-radius: 12px;
            background: #fff;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .team-members__members__member__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          .team-members__members__member__border-unset {
            border-bottom: unset;
          }

          @media (min-width: 1024px) {
            .team-members {
              padding: 20px;
            }

            .team-members__members__mob {
              display: none;
            }

            .team-members__members__web {
              display: unset;
              overflow: auto;
              border-radius: 8px;
              max-height: 300px;
              background: #fff;
              box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
            }
          }
          .member-modal {
            padding: 24px;
          }
        `}
      </style>
    </>
  );
};

export default TeamMembers;