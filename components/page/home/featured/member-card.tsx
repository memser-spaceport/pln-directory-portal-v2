'use client';

import { parseMemberLocation } from '@/utils/member.utils';
import dynamic from 'next/dynamic';
import MemberSkillList from './member-skill-list';

const Tooltip = dynamic(() => import('@/components/core/tooltip/tooltip').then((mod) => mod.Tooltip), { ssr: false });

const MemberCard = (props: any) => {
  const member = props?.member;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const profileUrl = member?.profile ?? '/icons/default_profile.svg';
  const mainTeam = member?.mainTeam;
  const otherTeams = member?.teams
    ?.filter((team: any) => team.id !== mainTeam?.id)
    ?.map((team: any) => team.name)
    ?.sort();
  const role = member.mainTeam?.role || 'Contributor';
  const location = parseMemberLocation(member?.location);
  const skills = member?.skills ?? [];
  const isTeamLead = member?.teamLead;
  const isOpenToWork = member?.openToWork;
  const isBorder = isTeamLead || isOpenToWork;
  const isNew = member?.isNew;

  return (
    <>
      <div className="member-grid">
        <div className="member-grid__profile-container">
          <div className="member-grid__profile-container__outer-section">
            <div className={`${isBorder ? 'gradiant-border-rounded' : ''} member-grid__profile-container__outer-section__inner-circle`}>
              <img className="member-grid__profile-container__outer-section__inner-circle__profile" src={profileUrl} />
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
          {isNew && <div className="projectCard__header__badge">New</div>}
        </div>
        <div className="member-grid__details">
          <div>
            <div className="member-grid__details__member-details">
              <div className="member-grid__details__member-details__name-container">
                <h3 className="member-grid__details__name">{member?.name}</h3>
              </div>
              <div className="member-grid__details__member-details__team-name-container">
                <p className="member-grid__details__member-details__team-name-container__team-name">{member?.teams?.length > 0 ? mainTeam?.name : '-'}</p>
                {member?.teams?.length > 2 && (
                  <Tooltip
                    side="bottom"
                    align="end"
                    asChild
                    trigger={
                      <button onClick={(e) => e.preventDefault()} className="member-grid__details__member-details__team-name-container__tems-count">
                        +{(member?.teams?.length - 1).toString()}
                      </button>
                    }
                    content={otherTeams?.map((team: any, index: number) => (
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
            <div className="member-grid__profile-container__ftr__skills__desc">
              <MemberSkillList skills={skills} noOfSkillsToShow={3} />
            </div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .member-grid {
            height: 290px;
            width: 100%;
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
            height: 94px;
            background: linear-gradient(180deg, #fff 0%, #e2e8f0 205.47%);
            position: relative;
          }

          .projectCard__header__badge {
            color: #fff;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
            line-height: 28px;
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
            width: 42px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0px 12px 0px 12px;
            position: absolute;
            right: 0;
            top: 0;
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
          }

          .member-grid__profile-container__outer-section__inner-circle {
            height: 104px;
            width: 104px;
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
            display: block;
          }

          .member-grid__profile-container__outer-section__inner-circle__opento-work {
            position: absolute;
            z-index: 1;
            border: 1px solid #e2e8f0;
            border-radius: 100%;
            left: 17px;
            bottom: 61px;
            display: block;
          }

          .member-grid__details {
            padding: 16px;
            background: #fff;
            height: 195px;
            display: flex;
            justify-content: space-between;
            flex-direction: column;
            border-radius: 0 0 12px 12px;
            border-top: 1px solid #e2e8f0;
            position: relative;
          }

          .member-grid__profile-container__outer-section__inner-circle__profile {
            object-fit: cover;
            object-position: center;
            border: 1px solid #e2e8f0;
            border-radius: 50%;
            height: 72px;
            width: 72px;
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
            gap: 4px;
          }

          .member-grid__details__member-details__name-container {
            height: 28px;
          }

          .member-grid__details__name {
            font-size: 18px;
            font-weight: 600;
            line-height: 28px;
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
            font-size: 14px;
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
            line-height: 20px;
            text-align: center;
          }

          .member-grid__details__member-details__role {
            font-weight: 400;
            color: #000;
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            font-size: 14px;
            line-height: 20px;
            max-width: 200px;
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
            padding: 16px 0 0 0;
            border-top: 1px solid #e2e8f0;
          }

          .gradiant-border-rounded {
            border: double 1px transparent;
            border-radius: 50%;
            background-image: linear-gradient(rgb(248 250 252), rgb(248 250 252)), linear-gradient(to right, #427dff, #44d5bb);
            background-origin: border-box;
            background-clip: content-box, border-box;
          }
        `}
      </style>
    </>
  );
};

export default MemberCard;