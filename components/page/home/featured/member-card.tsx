'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { sanitize } from 'isomorphic-dompurify';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { EVENTS } from '@/utils/constants';

const MemberCard = (props: any) => {
  const member = props?.member;
  const profileUrl = member?.profile || '/icons/default_profile.svg';

  const mainTeam = member?.mainTeam;
  const otherTeams = member?.teams
    ?.filter((team: any) => team.id !== mainTeam?.id)
    ?.map((team: any) => team.name)
    ?.sort();
  const role = member.mainTeam?.role || 'Contributor';
  const isTeamLead = member?.teamLead;
  const isOpenToWork = member?.openToWork;
  const isBorder = isTeamLead || isOpenToWork;
  const isNew = member?.isNew;
  const bio = member?.bio;

  const sanitizedBio = sanitize(bio);
  const bioContent = sanitizedBio?.replace(/<[^>]+>/g, '');
  const shortBio = bioContent?.slice(0, 80);

  const analytics = useHomeAnalytics();

  const onSeeMoreClickHandler = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const userInfo = Cookies.get('userInfo') as IUserInfo;
    analytics.onMemberBioSeeMoreClicked({ ...getAnalyticsMemberInfo(member), bio }, getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_MEMBER_BIO_POPUP, {
        detail: {
          member,
        },
      })
    );
  };

  return (
    <>
      <div className="member">
        <div className="member__profile__cn">
          <div className="member__profile__cn__outer-section">
            <div data-testid='profile-outline' className={`${isBorder ? 'gradiant-border-rounded' : ''} member__profile__cn__outer-section__inner-circle`}>
              <img className="member__profile__cn__outer-section__inner-circle__profile" src={profileUrl} alt='member image' />
              {isTeamLead && (
                <Tooltip
                  asChild
                  trigger={<img loading="lazy" className="member__profile__cn__outer-section__inner-circle__lead" height={20} width={20} src="/icons/badge/team-lead.svg" alt='team lead' />}
                  content={'Team Lead'}
                />
              )}
              {isOpenToWork && (
                <Tooltip
                  asChild
                  trigger={<img loading="lazy" alt='open to collaborate' className="member__profile__cn__outer-section__inner-circle__opento-work" height={20} width={20} src="/icons/badge/open-to-work.svg" />}
                  content={'Open To Collaborate'}
                />
              )}
            </div>
          </div>
          {isNew && <div data-testid='new badge' className="projectCard__header__badge">New</div>}
        </div>
        <div className="member__details">
          <div className="member__details__primary">
            <div className="member__details__primary__name-container">
              <h3 className="member__details__name">{member?.name}</h3>
            </div>
            <div className="member__details__primary__team-name-container">
              <div className="member__details__primary__team-name__wrpr">
                {/* <p className="member__details__primary__team-name-container__team-name">{member?.teams?.length > 0 ? mainTeam?.name : '-'}</p> */}
                {mainTeam?.name ? <Tooltip asChild trigger={<p className="member__details__primary__team-name-container__team-name">{mainTeam?.name}</p>} content={mainTeam?.name} /> : '-'}
                {member?.teams?.length > 2 && (
                  <Tooltip
                    side="bottom"
                    align="center"
                    asChild
                    trigger={
                      <button onClick={(e) => e.preventDefault()} className="member__details__primary__team-name-container__tems-count">
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
              <div className="seperator"></div>
              <Tooltip asChild trigger={<p className="member__details__primary__role">{role}</p>} content={role} />
            </div>
          </div>
          <div className="member__details__bio">
            {bio ? (
              <>
                <span className="member__details__bio__txt" dangerouslySetInnerHTML={{ __html: shortBio }}></span>
                {bioContent?.length > shortBio?.length && (
                  <span>
                    ...
                    <button className="member__details__bio__txt__see-more" onClick={onSeeMoreClickHandler}>
                      see more
                    </button>
                  </span>
                )}
              </>
            ) : (
              <div className="member__details__bio__txt--nobio">🛠️ building their bio...</div>
            )}
          </div>
        </div>
      </div>

      <style jsx>
        {`
          .member {
            height: 290px;
            width: 100%;
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px #0f172a0a;
          }

          .member:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .member:active {
            border-radius: 12px;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            outline-color: #156ff7;
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .member__profile__cn {
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

          .member__profile__cn__outer-section {
            background: url('/images/outer-circle.svg');
            height: 147px;
            width: 147px;
            margin: auto;
            display: flex;
            justify-content: center;
            position: relative;
            background-repeat: no-repeat;
          }

          .member__profile__cn__outer-section__inner-circle {
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

          .member__profile__cn__outer-section__inner-circle__lead {
            position: absolute;
            border: 1px solid #e2e8f0;
            border-radius: 100%;
            right: 23px;
            top: 11px;
            display: block;
          }

          .member__profile__cn__outer-section__inner-circle__opento-work {
            position: absolute;
            z-index: 1;
            border: 1px solid #e2e8f0;
            border-radius: 100%;
            left: 17px;
            bottom: 61px;
            display: block;
          }

          .member__details {
            padding: 16px;
            background: #fff;
            height: 195px;
            display: flex;
            flex-direction: column;
            border-radius: 0 0 12px 12px;
            border-top: 1px solid #e2e8f0;
            position: relative;
            gap: 16px;
          }

          .member__profile__cn__outer-section__inner-circle__profile {
            object-fit: cover;
            object-position: center;
            border: 1px solid #e2e8f0;
            border-radius: 50%;
            height: 72px;
            width: 72px;
          }

          .member__details__primary__team-name-container__tems-count {
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

          .member__details__primary {
            display: flex;
            align-items: center;
            flex-direction: column;
            gap: 8px;
          }

          .member__details__primary__name-container {
            height: 28px;
          }

          .member__details__primary__team-name__wrpr {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .member__details__name {
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

          .member__details__primary__team-name-container {
            display: flex;
            gap: 8px;
            align-items: center;
            justify-content: center;
          }

          .member__details__primary__team-name-container__team-name {
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

          .member__details__primary__role {
            font-weight: 400;
            color: #000;
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            font-size: 14px;
            line-height: 20px;
            max-width: 100px;
          }

          .member__details__location {
            padding-top: 8px;
            width: fit-content;
            margin: auto;
            align-items: center;
            display: flex;
            height: 20px;
            gap: 7px;
          }

          .member__details__location__name {
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

          .member__details__bio {
            padding: 10px 12px;
            background: #f8fafc;
            border-radius: 6px;
            flex: 1;
          }

          .member__details__bio__txt {
            font-size: 14px;
            font-weight: 400;
            line-height: 22px;
            color: #0f172a;
            max-height: 66px;
            // overflow: hidden;
            word-break: break-word;
            // white-space: normal;
            // display: -webkit-box;
            // -webkit-line-clamp: 2;
            // -webkit-box-orient: vertical;
            // text-overflow: ellipsis;
          }

          .member__details__bio__txt__see-more {
            font-size: 14px;
            font-weight: 500;
            line-height: 22px;
            text-align: center;
            color: #156ff7;
            background: transparent;
          }

          .member__details__bio__txt--nobio {
            font-size: 14px;
            font-weight: 400;
            line-height: 22px;
            color: #64748b;
            align-items: center;
            display: flex;
            height: 100%;
            justify-content: center;
          }

          .seperator {
            height: 16px;
            width: 1px;
            background: #cbd5e1;
            border-radius: 2px;
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
