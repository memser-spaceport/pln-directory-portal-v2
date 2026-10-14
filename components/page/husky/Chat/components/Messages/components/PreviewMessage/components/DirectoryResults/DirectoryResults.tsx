'use client';

import clsx from 'clsx';
import { useRef, useState } from 'react';

import type { IDirectoryAction } from './types/directoryAction';

import { ActionCard } from './components/ActionCard';

import s from './DirectoryResults.module.scss';

const VISIBLE_ON_DESKTOP = 6;
const VISIBLE_ON_MOBILE = 3;

interface Props {
  actions: IDirectoryAction[];
}

export const DirectoryResults = (props: Props) => {
  const { actions } = props;

  const directoryResultsPopupRef = useRef<HTMLDialogElement>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleOpenDirectoryResultsPopup = () => {
    directoryResultsPopupRef.current?.showModal();
    setIsPopupOpen(true);
  };

  const handleCloseDirectoryResultsPopup = () => {
    directoryResultsPopupRef.current?.close();
    setIsPopupOpen(false);
  };

  return (
    <>
      <div className={clsx(s.root, s.desktop)}>
        <div className={s.header}>
          <div>
            <h3 className={s.title}>
              <img width={16} height={16} src="/icons/chip.svg" alt="Directory icon" />
              <span>Results from the directory</span>
            </h3>
            {actions.length > VISIBLE_ON_DESKTOP && (
              <p className={s.count}>{`${actions.slice(0, VISIBLE_ON_DESKTOP).length} of ${actions.length} results`}</p>
            )}
          </div>

          {actions.length > VISIBLE_ON_DESKTOP && (
            <button
              onClick={handleOpenDirectoryResultsPopup}
              className={clsx(s.button, s.showAll)}
              tabIndex={0}
              aria-label="Show all directory results"
            >
              Show all ({actions.length})
            </button>
          )}
        </div>
        <div className={s.list}>
          {actions.slice(0, VISIBLE_ON_DESKTOP).map((action, index) => (
            <ActionCard action={action} key={index} />
          ))}
        </div>
      </div>

      <div className={clsx(s.root, s.mobile)}>
        <div className={s.header}>
          <div>
            <h3 className={s.title}>
              <img width={16} height={16} src="/icons/chip.svg" alt="Directory icon" />
              <span>Results from the directory</span>
            </h3>
            {actions.length > VISIBLE_ON_MOBILE && (
              <p className={s.count}>{`${actions.slice(0, VISIBLE_ON_MOBILE).length} of ${actions.length} results`}</p>
            )}
          </div>
        </div>
        <div className={s.list}>
          {actions.slice(0, VISIBLE_ON_MOBILE).map((action, index) => (
            <ActionCard action={action} key={index} />
          ))}
          {actions.length > VISIBLE_ON_MOBILE && (
            <button
              onClick={handleOpenDirectoryResultsPopup}
              className={clsx(s.button, s.showAll, s.showAllMobile)}
              tabIndex={0}
              aria-label="Show all directory results"
            >
              Show all ({actions.length})
            </button>
          )}
        </div>
      </div>

      <dialog onClose={handleCloseDirectoryResultsPopup} ref={directoryResultsPopupRef} className={s.popup}>
        {isPopupOpen && (
          <div className={s.popupWrapper}>
            <div className={s.popupHeader}>
              <h3 className={s.popupTitle}>
                <span className={s.popupCount}>{`${actions.length}`}</span>
                <span role="heading" className={s.popupTitleText}>
                  Results from the directory
                </span>
              </h3>
              <button
                onClick={handleCloseDirectoryResultsPopup}
                className={s.button}
                tabIndex={0}
                aria-label="Close directory results popup"
              >
                <img src="/icons/close-blue.svg" alt="close" />
              </button>
            </div>
            <div className={s.popupList}>
              {actions.map((action, index) => (
                <ActionCard action={action} key={index} />
              ))}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
};
