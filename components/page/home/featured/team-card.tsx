'use client';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import AskBox from '@/components/ui/ask-box';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { PAGE_ROUTES } from '@/utils/constants';
import { useEffect, useState } from 'react';

const TeamCard = (props: any) => {
  const team = props?.team;
  const name = team?.name;
  const userInfo = props?.userInfo;
  const logo = team?.logo || '/icons/team-default-profile.svg';
  const description = team?.shortDescription;
  const isNew = team?.isNew;
  const info = [
    {
      text: 'This is url',
      link: 'a',
    },
  ];

  const analytics = useHomeAnalytics();

  const onTeamClicked = (team: any) => {
    analytics.onTeamCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsTeamInfo(team));
  };


  const onAskLinkClicked = () => {

  }

  return (
    <>
      <div className="teamCard">
        <a target="_blank" className="teamCard__cnt" href={`${PAGE_ROUTES.TEAMS}/${props?.id}`} onClick={() => onTeamClicked(team)}>
          <div className="teamCard__header">
            <img className="teamCard__header__img" src={logo} width={72} height={72} alt="team image" />
            {isNew && <div className="teamCard__header__badge">New</div>}
          </div>
          <div className="teamCard__content">
            <h3 className="teamCard__content__ttl">{name}</h3>
            <p className="teamCard__content__desc">{description}</p>
          </div>
          {info[0]?.text?.trim() !== '' && info[0]?.link?.trim() == '' && <AskBox info={info[0]} callback={onAskLinkClicked} />}
        </a>
        {info[0]?.link?.trim() !== '' && <AskBox info={info[0]} callback={onAskLinkClicked} />}
      </div>
      <style jsx>{`
        .teamCard {
          width: 100%;
          height: 290px;
          border-radius: 12px;
          box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
          background-color: white;
          display: flex;
          flex-direction: column;
        }

        .teamCard__cnt {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .teamCard:hover {
          box-shadow: 0px 0px 0px 2px #156ff740;
        }

        .teamCard:active {
          border-radius: 12px;
          outline-style: solid;
          outline-width: 1px;
          outline-offset: 0;
          outline-color: #156ff7;
          box-shadow: 0px 0px 0px 2px #156ff740;
        }

        .teamCard__header {
          background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 205.47%);
          min-height: 64px;
          border-bottom: 1px solid #e2e8f0;
          position: relative;
          border-radius: 12px 12px 0px 0px;
          display: flex;
          justify-content: end;
        }

        .teamCard__header__img {
          border-radius: 4px;
          position: absolute;
          transform: translateX(50%);
          right: 50%;
          top: 20px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
        }

        .teamCard__content {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .teamCard__content__ttl {
          font-size: 18px;
          font-weight: 600;
          line-height: 28px;
          text-align: center;
          color: #0f172a;
          margin-top: 38px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          padding: 0px 17px;
        }

        .teamCard__content__desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          text-align: center;
          color: #475569;
          padding: 0px 17px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: ${info ? '3' : '6'};
          -webkit-box-orient: vertical;
        }

        .teamCard__header__badge {
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
        }
      }
      `}</style>
    </>
  );
};

export default TeamCard;
