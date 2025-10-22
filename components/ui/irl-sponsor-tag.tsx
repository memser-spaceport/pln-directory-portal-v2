import React, { SyntheticEvent } from 'react';
import { Tooltip as Popover } from '../page/irl/attendee-list/attendee-popover';

interface IrlSponsorTag {
  sponsorEvents: any[];
  onSponsorEventClick: (event: any) => void;
}

const IrlSponsorTag = ({ sponsorEvents, onSponsorEventClick }: IrlSponsorTag) => {
  return (
    <div className="gtr__guestName__li__info__sponsor">
      <Popover
        asChild
        align="start"
        content={
          <div className="gtr__guestName__li__info__sponsor__list">
            {sponsorEvents?.map((event: { link: string; name: string }, index: number) => {
              const isLinkAvailable = !!event?.link;
              const displayName = event?.name || `Link${index + 1}`;
              const Element = isLinkAvailable ? 'a' : 'span';
              const elementProps = isLinkAvailable
                ? {
                    href: event.link,
                    target: '_blank',
                    onClick: () => onSponsorEventClick(event),
                  }
                : {
                    onClick: (e: SyntheticEvent) => e.preventDefault(),
                  };

              return (
                <Element
                  key={index}
                  {...elementProps}
                  className={`gtr__guestName__li__info__sponsor__list__item ${sponsorEvents?.length !== index + 1 ? 'border-bottom' : ''}`}
                >
                  {displayName}
                  {isLinkAvailable && <img src="/icons/arrow-blue.svg" alt="arrow" width={9} height={9} />}
                </Element>
              );
            })}
          </div>
        }
        trigger={
          <button
            onClick={(e: SyntheticEvent) => {
              e.preventDefault();
            }}
            className="gtr__guestName__li__info__sponsor__btn"
          >
            Sponsor <img src="/icons/down-arrow-white.svg" alt="arrow" />
          </button>
        }
      />
      <style jsx>{`
        .gtr__guestName__li__info__sponsor__list {
          width: 168px;
          border: 1px solid #cbd5e1;
          background-color: #fff;
          display: flex;
          flex-direction: column;
          padding: 0px 10px;
          border-radius: 4px;
          max-height: 200px;
          overflow: auto;
        }

        .gtr__guestName__li__info__sponsor__list__item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 400;
          line-height: 18px;
          text-align: left;
          color: #000000;
          justify-content: space-between;
          padding: 12px 0px;
        }

        .border-bottom {
          border-bottom: 0.5px solid #cbd5e1;
        }

        .gtr__guestName__li__info__sponsor__btn {
          background: linear-gradient(97.17deg, #7ecbff 6.23%, #928eff 99.44%);
          border: 1px solid #ffffff66;
          height: 20px;
          padding: 0px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 600;
          line-height: 20px;
          color: #ffffff;
          border-radius: 4px;
        }

        .gtr__team__sponsor__btn {
          background: linear-gradient(97.17deg, #7ecbff 6.23%, #928eff 99.44%);
          border: 1px solid #ffffff66;
          height: 20px;
          padding: 0px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 600;
          line-height: 20px;
          color: #ffffff;
          border-radius: 4px;
          margin-top: 5px;
          cursor: default;
        }
      `}</style>
    </div>
  );
};

export default IrlSponsorTag;
