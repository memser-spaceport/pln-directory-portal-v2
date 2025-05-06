import React, { SyntheticEvent } from 'react';
import { Tooltip as Popover } from '../page/irl/attendee-list/attendee-popover';

/**
 * Props for the IrlHostTag component.
 * @interface IrlHostTag
 * @property {any[]} hostEvents - List of host events to display.
 * @property {(event: any) => void} onHostEventClick - Callback when a host event is clicked.
 */
interface IrlHostTag {
  hostEvents: any[];
  onHostEventClick: (event: any) => void;
}

/**
 * IrlHostTag displays a button that opens a popover with a list of host events.
 * Each event is rendered as a link (if available) or a span (if not), and clicking a link calls the callback.
 *
 * @component
 * @param {IrlHostTag} props - The props for IrlHostTag
 * @returns {JSX.Element}
 */
const IrlHostTag = ({ hostEvents, onHostEventClick }: IrlHostTag) => {
  return (
    <div className="gtr__guestName__li__info__host">
      {/* Popover with host events list */}
      <Popover
        asChild
        align="start"
        content={
          <div className="gtr__guestName__li__info__host__list">
            {/* Render each host event */}
            {hostEvents?.map((event: { link: string; name: string }, index: number) => {
              const isLinkAvailable = !!event?.link;
              const displayName = event?.name || `Link${index + 1}`;
              const Element = isLinkAvailable ? 'a' : 'span';
              const elementProps = isLinkAvailable
                ? {
                    href: event.link,
                    target: '_blank',
                    onClick: () => onHostEventClick(event),
                  }
                : {
                    onClick: (e: SyntheticEvent) => e.preventDefault(),
                  };

              return (
                <Element key={index} {...elementProps} className={`gtr__guestName__li__info__host__list__item ${hostEvents?.length !== index + 1 ? 'border-bottom' : ''}`}>
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
            className="gtr__guestName__li__info__host__btn"
          >
            Host <img src="/icons/down-arrow-white.svg" alt="arrow" />
          </button>
        }
      />
      {/* Inline styles for the component */}
      <style jsx>{`
        .gtr__guestName__li__info__host__list {
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

        .gtr__guestName__li__info__host__list__item {
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

        .gtr__guestName__li__info__host__btn {
          background: linear-gradient(97.17deg, #9e7eff 6.23%, #e58eff 99.44%);
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

        .gtr__team__host__btn {
          background: linear-gradient(97.17deg, #9e7eff 6.23%, #e58eff 99.44%);
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

export default IrlHostTag;
