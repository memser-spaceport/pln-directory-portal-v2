'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { ITag, ITeam } from '@/types/teams.types';
import { Fragment } from 'react';

interface IFunding {
  team: ITeam;
}
const Funding = (props: IFunding) => {
  const team = props?.team;
  const fundingStage = team?.fundingStage?.title;
  const accelerataorPrograms = team?.membershipSources ?? [];

  return (
    <>
      <div className="funding">
        <h2 className="funding__title">Funding Stage</h2>

        <div className="funding__seriescontainer">
          <div className="funding__seriescontainer__title-container">
            <img loading="lazy" alt="funding stage" src="/icons/funding-stage.svg" height={12} width={12} />
            <h3 className="funding__seriesconainer__title-container__series">{fundingStage}</h3>
          </div>

          <div className="funding__seriescontainer__membership-source-container">
            <h3 className="funding__seriescontainer__membership-source-container__title">Membership Sources:</h3>
            {accelerataorPrograms?.map((program: ITag, index: number) => (
              <Fragment key={`${program} + ${index}`}>
                <Tooltip
                  asChild
                  trigger={
                    <div>
                      <Tag value={program?.title} />{' '}
                    </div>
                  }
                  content={program?.title}
                />
              </Fragment>
            ))}
            {accelerataorPrograms?.length === 0 && <p className="funding__seriescontainer__membership-source-container_notavai">Not available</p>}
          </div>
        </div>
      </div>

      <style jsx>
        {`
            .funding {
              display: flex;
              flex-direction: column;
              gap: 8px;
              border-radius: 8px;
              box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
              background-color: #fff;
              padding: 16px;
            }

            .funding__title {
              color:  #64748B;
              font-size: 14px;
              font-weight: 500;
              line-height: 20px;
            }

            .funding__seriescontainer {
              display: flex;
              gap: 8px;
              border-radius: 8px;
              border: 1px solid #E2E8F0;
            }

            .funding__seriescontainer__title-container {
              width: 30%;
              display: flex;
              gap: 8px;
              align-items:center;
              justify-content: center;
              padding: 22px 0;
              border-right: 1px solid  #E2E8F0;
            }

            .funding__seriesconainer__title-container__series {
              color: #0F172A;
              font-size: 15px;
              font-weight: 500;
              line-height: 24px;
            }

            .funding__seriescontainer__membership-source-container {
              padding: 24px 12px;
              width: 70%;
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              gap: 8px;
            }

            .funding__seriescontainer__membership-source-container__title {
              color: #64748B;
              font-size: 14px;
              font-weight: 500;
              line-height: 20px;
            }

            .funding__seriescontainer__membership-source-container_notavai {
            font-size: 12px;
            font-weight: 500;
            color: #475569;
            }

            @media (min-width: 1024px) {
                .funding {
                    padding: 20px;
                }

              .funding__seriescontainer__title-container {
                  width: 20%;
                }

                .funding__seriescontainer__membership-source-container {
                  width: 80%;
                }
            }
            .`}
      </style>
    </>
  );
};

export default Funding;
