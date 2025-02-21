'use client';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { useRef, useState, useMemo } from 'react';

interface ActionItem {
  name: string;
  type: string;
  source: string;
}

interface RelatedResultsProps {
  actions: ActionItem[];
}

function DirectoryResults({ actions }: RelatedResultsProps) {
  const { trackHuskyActionCardClicked } = useHuskyAnalytics();
  const directoryResultsPopupRef = useRef<HTMLDialogElement>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const memoizedActions = useMemo(() => actions, [actions]);

  const handleActionCardClick = (action: ActionItem) => {
    trackHuskyActionCardClicked(action);
  };

  const noOfItemsToShowDesktop = 6;
  const noOfItemsToShowMobile = 3;

  const handleOpenDirectoryResultsPopup = () => {
    directoryResultsPopupRef.current?.showModal();
    setIsPopupOpen(true);
  };

  const handleCloseDirectoryResultsPopup = () => {
    directoryResultsPopupRef.current?.close();
    setIsPopupOpen(false);
  };

  // Reusable ActionCard component to avoid duplication
  const ActionCard = ({ action, index }: { action: ActionItem; index: number }) => (
    <>
      <a target="_blank" href={action.source} onClick={() => handleActionCardClick(action)} className="action-card" key={index} tabIndex={0} aria-label={`${action.name} - ${action.type}`}>
        <div className="action-card__wrapper">
          <div className="action-card__icon-wrapper">
            {(action.type?.toLowerCase() === 'member' || action.type?.toLowerCase() === 'member-event-participation')  && <img className="action-card__icon" src="/icons/husky/husky-member.svg" alt="Member icon" />}
            {action.type?.toLowerCase() === 'team' && <img className="action-card__icon" src="/icons/husky/husky-team.svg" alt="Team icon" />}
            {action.type?.toLowerCase() === 'project' && <img className="action-card__icon" src="/icons/husky/husky-project.svg" alt="Project icon" />}
            {(action.type?.toLowerCase() === 'event' || action.type?.toLowerCase() === 'irl-event') && <img className="action-card__icon" src="/icons/husky/husky-event.svg" alt="Event icon" />}
          </div>
          <div className="action-card__content">
            <p title={action.name} className="action-card__name">
              <span title={action.name}>{action.name}</span>
            </p>
            <p className="action-card__type">{action.type ? (action.type === 'irl-event' ? 'Event' : action.type === 'member-event-participation' ? 'Member' : action.type) : ''}</p>
          </div>
        </div>
      </a>
      <style jsx>{`
        .action-card {
          position: relative;
          padding: 20px;
          height: fit-content;
        }

        .action-card__content {
          width: 100%;
        }

        .action-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 12px;
          border: 1px solid transparent;
          background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
        }

        .action-card__wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .action-card__icon-wrapper {
          width: 40px;
          height: 40px;
        }

        .action-card__icon {
          width: 40px;
          height: 40px;
          margin-bottom: 1px;
          border-radius: 50%;
        }

        .action-card__name {
          font-size: 18px;
          line-height: 28px;
          font-weight: 600;
          display: flex;
          gap: 6px;
          color: #0f172a;
          text-transform: capitalize;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          width: 90%;
          display: block;
        }

        .action-card__type {
          font-size: 14px;
          text-transform: capitalize;
          width: fit-content;
          color: #0f172a;
          font-weight: 500;
          line-height: 20px;
        }
      `}</style>
    </>
  );

  return (
    <>
      <div className="directory-results directory-results--desktop">
        <div className="directory-results__header">
          <div className="directory-results__header__title-wrapper">
            <h3 className="directory-results__title">
              <img width={16} height={16} src="/icons/chip.svg" alt="Directory icon" />
              <span>Results from the directory</span>
            </h3>
            {memoizedActions.length > noOfItemsToShowDesktop && (
              <p className="directory-results__header__title-wrapper__count">{`${memoizedActions.slice(0, noOfItemsToShowDesktop).length} of ${memoizedActions.length} results`}</p>
            )}
          </div>

          {memoizedActions.length > noOfItemsToShowDesktop && (
            <button onClick={handleOpenDirectoryResultsPopup} className="directory-results__header__show-all" tabIndex={0} aria-label="Show all directory results">
              Show all ({memoizedActions.length})
            </button>
          )}
        </div>
        <div className="directory-results__cn">
          {memoizedActions.slice(0, noOfItemsToShowDesktop).map((action, index) => (
            <ActionCard action={action} index={index} key={index} />
          ))}
        </div>
      </div>

      <div className="directory-results directory-results--mobile">
        <div className="directory-results__header">
          <div className="directory-results__header__title-wrapper">
            <h3 className="directory-results__title">
              <img width={16} height={16} src="/icons/chip.svg" alt="Directory icon" />
              <span>Results from the directory</span>
            </h3>
            {memoizedActions.length > noOfItemsToShowMobile && (
              <p className="directory-results__header__title-wrapper__count">{`${memoizedActions.slice(0, noOfItemsToShowMobile).length} of ${memoizedActions.length} results`}</p>
            )}
          </div>
        </div>
        <div className="directory-results__cn">
          {memoizedActions.slice(0, noOfItemsToShowMobile).map((action, index) => (
            <ActionCard action={action} index={index} key={index} />
          ))}
          {memoizedActions.length > noOfItemsToShowMobile && (
            <button
              onClick={handleOpenDirectoryResultsPopup}
              className="directory-results__header__show-all directory-results__header__show-all--mobile"
              tabIndex={0}
              aria-label="Show all directory results"
            >
              Show all ({memoizedActions.length})
            </button>
          )}
        </div>
      </div>

      <dialog onClose={handleCloseDirectoryResultsPopup} ref={directoryResultsPopupRef} className="directoryResults-popup">
        {isPopupOpen && <div className="directoryResults-popup__wrpr">
          <div className="directoryResults-popup__header">
            <h3 className="directoryResults-popup__header__title">
              <span className="directoryResults-popup__header__title__count">{`${memoizedActions.length}`}</span>
              <h3 className="directoryResults-popup__header__title__text">Results from the directory</h3>
            </h3>
            <button onClick={handleCloseDirectoryResultsPopup} className="directoryResults-popup__header__close" tabIndex={0} aria-label="Close directory results popup">
              <img src="/icons/close-blue.svg" alt="close" />
            </button>
          </div>
          <div className="directory-results__cn--popup">
            {memoizedActions.map((action, index) => (
              <ActionCard action={action} index={index} key={index} />
            ))}
          </div>
        </div>}
      </dialog>
      <style jsx>
        {`
          .directory-results {
            width: 100%;
            border: 1px solid #e2e8f0;
            background-color: #f5fafb;
            border-radius: 8px;
            padding: 12px 10px;
          }

          .directory-results--desktop {
            display: none;
          }

          .directory-results--mobile {
            display: block;
          }

          .directory-results__header__title-wrapper__count {
            font-weight: 400;
            font-size: 12px;
            line-height: 14px;
            color: #0f172a;
            margin-left: 21px;
          }

          .directory-results__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .center {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          .directory-results__title {
            font-size: 14px;
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
            font-weight: 600;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex;
            gap: 4px;
            align-items: center;
            line-height: 20px;
            white-space: nowrap;
          }

          .directory-results__cn {
            width: 100%;
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(1, minmax(0, 1fr));
            margin-top: 10px;
          }

          .directory-results__cn--desktop {
            display: none;
          }

          .directory-results__cn--mobile {
            display: grid;
          }

          .directory-results__cn--popup {
            width: 100%;
            display: grid;
            gap: 10px;
            padding: 20px;
            overflow-y: auto;
            overflow-x: hidden;
            flex: 1;
            grid-auto-rows: fit-content(100%);
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }

          .directory-results__header__show-all {
            font-weight: 500;
            font-size: 14px;
            line-height: 14px;
            color: #156ff7;
            background: none;
            cursor: pointer;
          }

          .directory-results__header__show-all--desktop {
            display: none;
          }

          .directory-results__header__show-all--mobile {
            display: block;
            width: fit-content;
            margin-top: 6px;
          }

          button {
            background: transparent;
            cursor: pointer;
          }

          .directoryResults-popup__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0px 15px;
            border-bottom: 1px solid rgba(203, 213, 225, 1);
            min-height: 48px;
          }

          .directoryResults-popup__header__title {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .directoryResults-popup__header__title__text {
            font-size: 14px;
            font-weight: 500;
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
            font-weight: 600;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .directoryResults-popup__header__title__count {
            color: #ffffff;
            font-size: 12px;
            line-height: 14px;
            background-color: rgba(21, 111, 247, 1);
            font-weight: 600;
            padding: 4px 5px;
            border-radius: 4px;
          }

          .directoryResults-popup {
            background: white;
            border-radius: 8px;
            border: none;
            max-height: 1000px;
            margin: auto;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }

          .directoryResults-popup__wrpr {
            display: flex;
            flex-direction: column;
            flex: 1;
            width: 100%;
            max-height: 80vh;
          }

          @media (min-width: 475px) {
            .directory-results__cn {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .directory-results__cn--popup {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (min-width: 1024px) {
            .directory-results--desktop {
              display: block;
            }

            .directory-results--mobile {
              display: none;
            }

            .directory-results__cn {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .directory-results__cn--popup {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            .directoryResults-popup__wrpr {
              width: 939px;
            }

            .directory-results__cn--mobile {
              display: none;
            }

            .directory-results__cn--desktop {
              display: grid;
            }

            .directory-results__header__show-all--desktop {
              display: block;
            }

            .directory-results__header__show-all--mobile {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
}

export default DirectoryResults;
