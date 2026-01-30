'use client';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import { Modal } from '@/components/common/Modal/Modal';
import { EVENTS } from '@/utils/constants';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import s from './HostSpeakersList.module.scss';
import { CloseIcon } from '@/components/core/UpdatesPanel/IrlGatheringModal/icons';

interface IHostSpeakersList {
  onClose: () => void;
  contributorsList: any[];
  onContributorClickHandler: any;
}

const HostSpeakersList = (props: IHostSpeakersList) => {
  const onClose = props?.onClose;
  const contributorsList = props?.contributorsList ?? [];
  const onContributorClickHandler = props?.onContributorClickHandler;
  const analytics = useEventsAnalytics();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredContriList, setFilteredContriList] = useState(contributorsList);

  useEffect(() => {
    const handleOpenClose = (e: any) => {
      setIsOpen(e.detail);
    };
    document.addEventListener(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, handleOpenClose);
    return () => {
      document.removeEventListener(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, handleOpenClose);
    };
  }, []);

  const onInputchangeHandler = (event: any) => {
    const searchValue = event?.target.value;
    setSearchTerm(searchValue);

    if (!searchValue.trim()) {
      setFilteredContriList(contributorsList);
      return;
    }

    const searchTermLower = searchValue.toLowerCase();
    const filteredMembers = contributorsList?.filter((member: any) =>
      member?.member?.name?.toLowerCase()?.includes(searchTermLower),
    );
    setFilteredContriList(filteredMembers);
  };

  const onModalCloseClickHandler = () => {
    setSearchTerm('');
    setFilteredContriList(contributorsList);
    setIsOpen(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onModalCloseClickHandler} className={s.modal}>
      <div className={s.container}>
        <div className={s.header}>
          Contributors ({contributorsList.length}){' '}
          <button className={s.closeButton} onClick={onClose} aria-label="Close" type="button">
            <CloseIcon />
          </button>
        </div>

        <div>
          <div className={s.searchWrapper}>
            <div className={s.searchIcon}>
              <Image loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
            </div>
            <input value={searchTerm} className={s.searchInput} placeholder="Search" onChange={onInputchangeHandler} />
            {searchTerm && (
              <div
                className={s.clearIcon}
                onClick={() => {
                  setSearchTerm('');
                  setFilteredContriList(contributorsList);
                }}
              >
                <Image src="/icons/close.svg" alt="Clear search" width={14} height={14} />
              </div>
            )}
          </div>
        </div>
        <div className={s.contributorsList}>
          {filteredContriList?.map((contributor: any) => {
            const defaultAvatar = getDefaultAvatar(contributor?.member?.name);

            return (
              <div
                className={s.contributorWrapper}
                key={contributor?.uid}
                onClick={() => onContributorClickHandler(contributor)}
              >
                <div className={s.contributor}>
                  <div className={s.contributorInfo}>
                    <div className={s.contributorImageWrapper}>
                      <Image
                        alt="profile"
                        width={40}
                        height={40}
                        loading="eager"
                        priority={true}
                        className={s.contributorImage}
                        src={contributor?.member?.image?.url || defaultAvatar}
                      />
                    </div>
                    <div className={s.contributorName}>{contributor?.member?.name}</div>
                  </div>
                  <div className={s.contributorNav}>
                    <img src="/icons/right-arrow-gray.svg" alt="icon" />
                  </div>
                </div>
              </div>
            );
          })}
          {filteredContriList.length === 0 && <div className={s.notFound}>No Contributors found.</div>}
        </div>
      </div>
    </Modal>
  );
};

export default HostSpeakersList;
