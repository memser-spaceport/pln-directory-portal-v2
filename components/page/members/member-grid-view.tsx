// import { Tooltip } from '@/components/core/tooltip/tooltip';
'use client';

import { IMember } from '@/types/members.types';
import { parseMemberLocation } from '@/utils/member.utils';
import MemberSkillList from './member-skill-list';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './MemberCard/MemberCard.module.scss';

interface IMemberGridView {
  member: IMember;
  isUserLoggedIn: boolean | undefined;
}

const Tooltip = dynamic(() => import('@/components/core/tooltip/tooltip').then((mod) => mod.Tooltip));

const MemberGridView = (props: IMemberGridView) => {
  const member = props?.member;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const mainTeam = member?.mainTeam;
  const otherTeams = member.teams
    .filter((team) => team.id !== mainTeam?.id)
    .map((team) => team.name)
    .sort();
  const role = member.mainTeam?.role || 'Contributor';
  const location = parseMemberLocation(member?.location);
  const skills = member?.skills ?? [];
  const isTeamLead = member?.teamLead;
  const isOpenToWork = member?.openToWork;
  const isBorder = isTeamLead || isOpenToWork;
  const defaultAvatarImage = useDefaultAvatar(member?.name);
  const profileUrl = member?.profile ?? defaultAvatarImage;
  const isAvailableToConnect = member?.officeHours && (member.ohStatus === 'OK' || member?.ohStatus === 'NOT_FOUND' || member?.ohStatus === null);

  return (
    <>
      <div className="member-grid">
        <div className="member-grid__profile-container">
          <div className="member-grid__profile-container__outer-section">
            <div className={`${isBorder ? 'gradiant-border-rounded' : ''} member-grid__profile-container__outer-section__inner-circle`}>
              <Image
                alt="profile"
                loading="eager"
                height={72}
                width={72}
                layout="intrinsic"
                priority={true}
                className="member-grid__profile-container__outer-section__inner-circle__profile"
                src={profileUrl}
              />
              {isTeamLead && (
                <Tooltip
                  asChild
                  trigger={<img loading="lazy" className="member-grid__profile-container__outer-section__inner-circle__lead" height={20} width={20} src="/icons/badge/team-lead.svg" />}
                  content={'Team Lead'}
                />
              )}
              {isOpenToWork && (
                <Tooltip
                  asChild
                  trigger={<img loading="lazy" className="member-grid__profile-container__outer-section__inner-circle__opento-work" height={20} width={20} src="/icons/badge/open-to-work.svg" />}
                  content={'Open To Collaborate'}
                />
              )}
            </div>
          </div>
        </div>
        <div className="member-grid__details">
          {isAvailableToConnect && (
            <div className={s.availableToConnectBadge}>
              <CalendarIcon /> Available to connect
            </div>
          )}
          <div>
            <div className="member-grid__details__member-details">
              <div className="member-grid__details__member-details__name-container">
                <h3 className="member-grid__details__name">{member?.name}</h3>
              </div>
              <div className="member-grid__details__member-details__team-name-container">
                <p className="member-grid__details__member-details__team-name-container__team-name">{member?.teams?.length > 0 ? mainTeam?.name : '-'}</p>
                {member?.teams?.length > 2 && (
                  <Tooltip
                    asChild
                    trigger={
                      <button onClick={(e) => e.preventDefault()} className="member-grid__details__member-details__team-name-container__tems-count">
                        +{(member?.teams?.length - 1).toString()}
                      </button>
                    }
                    content={otherTeams?.map((team, index) => (
                      <div key={`${team} + ${index}`}>
                        {team}
                        {index === member?.teams?.slice(1, member?.teams?.length).length - 1 ? '' : ','}
                      </div>
                    ))}
                  />
                )}
              </div>
              <p className="member-grid__details__member-details__role">{role}</p>
            </div>
            {isUserLoggedIn && (
              <>
                <div className="member-grid__details__location">
                  {location ? (
                    <>
                      <img loading="lazy" src="/icons/location.svg" height={13} width={11} />
                      <p className="member-grid__details__location__name">{location}</p>
                    </>
                  ) : (
                    '-'
                  )}
                </div>
              </>
            )}
          </div>

          <div className="member-grid__profile-container__ftr">
            <div className="member-grid__profile-container__ftr__skills__mob">
              <MemberSkillList skills={skills} noOfSkillsToShow={1} />
            </div>
            <div className="member-grid__profile-container__ftr__skills__desc">
              <MemberSkillList skills={skills} noOfSkillsToShow={3} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>
        {`
          .member-grid {
            height: 166px;
            width: 167.5px;
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px #0f172a0a;
          }

          .member-grid:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .member-grid:active {
            border-radius: 12px;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            outline-color: #156ff7;
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .member-grid__profile-container {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px 12px 0 0;
            height: 33px;
            background: linear-gradient(180deg, #fff 0%, #e2e8f0 205.47%);
            position: relative;
          }

          .member-grid__profile-container__outer-section {
            position: absolute;
            z-index: 1;
            top: 13px;
          }

          .member-grid__profile-container__outer-section__inner-circle {
            height: 36px;
            width: 36px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px solid #e2e8f0;
            border: 1px solid linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
          }

          .member-grid__profile-container__outer-section__inner-circle__lead {
            position: absolute;
            border: 1px solid #e2e8f0;
            border-radius: 100%;
            right: 23px;
            top: 11px;
            display: none;
          }

          .member-grid__profile-container__outer-section__inner-circle__opento-work {
            position: absolute;
            z-index: 1;
            border: 1px solid #e2e8f0;
            border-radius: 100%;
            left: 17px;
            bottom: 61px;
            display: none;
          }

          .member-grid__details {
            padding: 18px 12px 12px 12px;
            background: #fff;
            height: 133px;
            display: flex;
            justify-content: space-between;
            flex-direction: column;
            border-radius: 0 0 12px 12px;
            border-top: 1px solid #e2e8f0;
            position: relative;
          }

          .member-grid__details__member-details__team-name-container__tems-count {
            font-size: 10px;
            font-weight: 500;
            line-height: 12px;
            padding: 2px;
            background: #f1f5f9;
            border-radius: 100%;
            display: flex;
            color: #475569;
            min-height: 16px;
            min-width: 16px;
            cursor: default;
            align-items: center;
            justify-content: center;
          }

          .member-grid__details__member-details {
            display: flex;
            align-items: center;
            flex-direction: column;
          }

          .member-grid__details__member-details__name-container {
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          }

          .member-grid__details__name {
            font-size: 12px;
            font-weight: 600;
            line-height: 22px;
            color: #000;
            max-width: 200px;
            text-align: center;
            max-width: 150px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .member-grid__details__member-details__team-name-container {
            display: flex;
            gap: 4px;
            align-items: center;
            justify-content: center;
          }

          .member-grid__details__member-details__team-name-container__team-name {
            font-size: 12px;
            font-weight: 500;
            color: #000;
            max-width: 200px;
            height: 20px;
            overflow: hidden;
            display: inline-block;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
            line-height: 18px;
            text-align: center;
          }

          .member-grid__details__member-details__role {
            font-size: 12px;
            font-weight: 400;
            line-height: 18px;
            color: #000;
            text-align: center;
            max-width: 135px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .member-grid__details__location {
            display: none;
          }

          .member-grid__details__location__name {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            letter-spacing: 0px;
            color: #475569;
            max-width: 200px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .member-grid__profile-container__ftr {
            padding: 0px;
          }

          .member-grid__profile-container__ftr__skills__mob {
            display: block;
          }

          .member-grid__profile-container__ftr__skills__desc {
            display: none;
          }

          @media (min-width: 1024px) {
            .member-grid {
              height: 289px;
              width: 289px;
            }

            .member-grid__profile-container {
              height: 94px;
            }

            .member-grid__details__name {
              font-size: 18px;
              line-height: 28px;
            }

            .member-grid__details__member-details__team-name-container__team-name {
              font-size: 14px;
              line-height: 20px;
            }

            .gradiant-border-rounded {
              border: double 1px transparent;
              border-radius: 50%;
              background-image: linear-gradient(rgb(248 250 252), rgb(248 250 252)), linear-gradient(to right, #427dff, #44d5bb);
              background-origin: border-box;
              background-clip: content-box, border-box;
            }

            .member-grid__profile-container__outer-section {
              background: url('/images/outer-circle.svg');
              height: 147px;
              width: 147px;
              margin: auto;
              display: flex;
              justify-content: center;
              position: relative;
              background-repeat: no-repeat;
              z-index: unset;
              top: unset;
            }

            .member-grid__profile-container__outer-section__inner-circle {
              height: 104px;
              width: 104px;
            }

            .member-grid__profile-container__outer-section {
            }

            .member-grid__details {
              height: 195px;
              padding: 16px;
            }

            .member-grid__profile-container__ftr {
              padding: 16px 0 0 0;
              border-top: 1px solid #e2e8f0;
            }

            .member-grid__details__location {
              padding-top: 8px;
              width: fit-content;
              margin: auto;
              align-items: center;
              display: flex;
              height: 20px;
              gap: 7px;
            }

            .member-grid__details__member-details__role {
              font-size: 14px;
              line-height: 20px;
              max-width: 200px;
            }

            .member-grid__profile-container__outer-section__inner-circle__lead {
              display: block;
            }

            .member-grid__profile-container__outer-section__inner-circle__opento-work {
              display: block;
            }

            .member-grid__details__member-details {
              gap: 4px;
            }

            .member-grid__profile-container__ftr__skills__desc {
              display: block;
            }

            .member-grid__profile-container__ftr__skills__mob {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
};

const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.75 1.5H8.625V1.125C8.625 1.02554 8.58549 0.930161 8.51517 0.859835C8.44484 0.789509 8.34946 0.75 8.25 0.75C8.15054 0.75 8.05516 0.789509 7.98483 0.859835C7.91451 0.930161 7.875 1.02554 7.875 1.125V1.5H4.125V1.125C4.125 1.02554 4.08549 0.930161 4.01516 0.859835C3.94484 0.789509 3.84946 0.75 3.75 0.75C3.65054 0.75 3.55516 0.789509 3.48484 0.859835C3.41451 0.930161 3.375 1.02554 3.375 1.125V1.5H2.25C2.05109 1.5 1.86032 1.57902 1.71967 1.71967C1.57902 1.86032 1.5 2.05109 1.5 2.25V9.75C1.5 9.94891 1.57902 10.1397 1.71967 10.2803C1.86032 10.421 2.05109 10.5 2.25 10.5H9.75C9.94891 10.5 10.1397 10.421 10.2803 10.2803C10.421 10.1397 10.5 9.94891 10.5 9.75V2.25C10.5 2.05109 10.421 1.86032 10.2803 1.71967C10.1397 1.57902 9.94891 1.5 9.75 1.5ZM3.375 2.25V2.625C3.375 2.72446 3.41451 2.81984 3.48484 2.89016C3.55516 2.96049 3.65054 3 3.75 3C3.84946 3 3.94484 2.96049 4.01516 2.89016C4.08549 2.81984 4.125 2.72446 4.125 2.625V2.25H7.875V2.625C7.875 2.72446 7.91451 2.81984 7.98483 2.89016C8.05516 2.96049 8.15054 3 8.25 3C8.34946 3 8.44484 2.96049 8.51517 2.89016C8.58549 2.81984 8.625 2.72446 8.625 2.625V2.25H9.75V3.75H2.25V2.25H3.375ZM9.75 9.75H2.25V4.5H9.75V9.75Z"
      fill="#1B4DFF"
    />
  </svg>
);

export default MemberGridView;
