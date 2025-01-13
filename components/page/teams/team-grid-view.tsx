'use client';

import { ITeam } from '@/types/teams.types';
import TeamsTagsList from './teams-tags-list';
import Image from 'next/image';
import Link from 'next/link';
import { PAGE_ROUTES } from '@/utils/constants';
import AskBox from '@/components/ui/ask-box';
import { Fragment } from 'react';

interface ITeamGridView {
  team: ITeam;
  viewType: string;
  callback: any;
}
const TeamGridView = (props: ITeamGridView) => {
  const team = props?.team;
  const profile = team?.logo || '/icons/team-default-profile.svg';
  const teamName = team?.name;
  const description = team?.shortDescription;
  const tags = team?.industryTags ?? [];
  const callback = props?.callback;
  const asks = [
    {
      text: 'This is url',
      link: '',
      description: 'abc',
    },
  ];

  const onAskLinkClicked = () => {};

  return (
    <>
      <div className="team-grid">
        <Link
          onClick={(e) => callback(e, callback)}
          className="team-grid__link"
          style={{ flex: '1', display: 'flex', flexDirection: 'column' }}
          prefetch={false}
          href={`${PAGE_ROUTES.TEAMS}/${team?.id}`}
        >
          <div className="team-grid__profile-container">
            <Image alt="profile" height={72} width={72} layout="intrinsic" loading="eager" priority={true} className="team-grid__profile-container__profile" src={profile} />
          </div>
          <div className="team-grid__details-container">
            <div className="team-grid__details-container__team-detail">
              <h2 className="team-grid__details-container__team-detail__team-name">{teamName}</h2>
              <p className="team-grid__details-container__team-detail__team-desc">{description}</p>
            </div>

            <div className="team-grid__tags">
              <div className="team-grid__tags__desc">
                <TeamsTagsList tags={tags} noOfTagsToShow={3} />
              </div>
              <div className="team-grid__tags__mob">
                <TeamsTagsList tags={tags} noOfTagsToShow={1} />
              </div>
            </div>
          </div>
          {asks?.map((ask: any, index: number) => {
            return <Fragment key={`${ask.text} + ${index}`}>{asks[0]?.text?.trim() !== '' && asks[0]?.link?.trim() == '' && <AskBox info={asks[0]} callback={onAskLinkClicked} />}</Fragment>;
          })}
        </Link>
        {asks?.map((ask: any, index: number) => {
          return <Fragment key={`${ask.text} + ${index}`}>{asks[0]?.link?.trim() !== '' && <AskBox info={asks[0]} callback={onAskLinkClicked} />}</Fragment>;
        })}
      </div>
      <style jsx>
        {`
          .team-grid {
            width: 167.5px;
            height: 168px;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .team-grid:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-grid:active {
            border-radius: 12px;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            outline-color: #156ff7;
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-grid__profile-container {
            position: relative;
            height: 33px;
            border-radius: 12px 12px 0px 0px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(180deg, #fff 0%, #e2e8f0 205.47%);
          }

          .team-grid__details-container {
            padding: 0 12px 12px 12px;
            margin-top: 16px;
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: space-between;
            gap: 6px;
            text-align: center;
          }

          .team-grid__details-container__team-detail {
            display: flex;
            flex-direction: column;
          }

          .team-grid__details-container__team-detail__team-name {
            color: #0f172a;
            font-size: 12px;
            font-weight: 600;
            line-height: 22px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
          }

          .team-grid__details-container__team-detail__team-desc {
            color: #475569;
            font-size: 12px;
            font-weight: 400;
            line-height: 18px;
            display: -webkit-box;
            -webkit-line-clamp: ${asks.length ? '1' : '3'};
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .team-grid__details-container__tagscontainer {
            display: flex;
            gap: 8px;
            height: 26px;
          }

          .team-grid__tags__mob {
            display: block;
          }
          .team-grid__tags__desc {
            display: none;
          }

          @media (min-width: 1024px) {
            .team-grid__details-container__tagscontainer {
              margin-left: 0;
            }

            .team-grid {
              width: 289px;
              height: 285px;
            }

            .team-grid__details-container__team-detail__team-name {
              font-size: 18px;
              line-height: 28px;
            }

            .team-grid__profile-container {
              height: 64px;
            }

            .team-grid__details-container {
              padding: 0 20px 20px 20px;
              margin-top: 38px;
              gap: 10px;
            }

            .team-grid__details-container__team-detail {
              gap: 10px;
            }

            .team-grid__details-container__team-detail__team-desc {
              font-size: 14px;
              line-height: 20px;
              margin-bottom: 10px;
            }

            .team-grid__tags {
              border-top: 1px solid #e2e8f0;
              padding: 20px 0 0 0;
            }

            .team-grid__tags__mob {
              display: none;
            }
            .team-grid__tags__desc {
              display: block;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamGridView;
