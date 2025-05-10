'use client';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import Modal from '@/components/core/modal';
import { IMember } from '@/types/members.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

interface IHostSpeakersList {
  onClose: () => void;
  contributorsList: any[];
  onContributorClickHandler: any;
}

const HostSpeakersList = (props: IHostSpeakersList) => {
  const onClose = props?.onClose;
  const contributorsList = props?.contributorsList ?? [];
  const onContributorClickHandler = props?.onContributorClickHandler
  const analytics = useEventsAnalytics();
  const [searchTerm, setSearchTerm] = useState('');
  const contributorsListRef = useRef<HTMLDialogElement>(null);
  const [filteredContriList, setFilteredContriList] = useState(contributorsList);

  useEffect(() => {
    document.addEventListener(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, (e: any) => {
      if (e.detail) {
        contributorsListRef?.current?.showModal();
        return;
      }
      contributorsListRef?.current?.close();
      return;
    });
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
      member?.member?.name?.toLowerCase()?.includes(searchTermLower)
    );
    setFilteredContriList(filteredMembers);
  };

  const onModalCloseClickHandler = () => {
    setSearchTerm("");
    setFilteredContriList(contributorsList);
    onClose();
  }

  return (
    <>
      <Modal modalRef={contributorsListRef} onClose={onModalCloseClickHandler}>
        <div className="cm">
          <div className="cm__hdr">Contributors ({contributorsList.length})</div>
          <div>
            <div className="cm__body__search">
              <div className="cm__body__search__icon">
                <Image loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
              </div>
              <input 
                value={searchTerm} 
                className="cm__body__search__input" 
                placeholder="Search" 
                onChange={onInputchangeHandler} 
              />
              {searchTerm && (
                <div 
                  className="cm__body__search__clear-icon" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilteredContriList(contributorsList);
                  }}
                >
                  <Image 
                    src="/icons/close.svg" 
                    alt="Clear search" 
                    width={14} 
                    height={14} 
                  />
                </div>
              )}
            </div>
          </div>
          <div className="cm__body__contributors">
            {filteredContriList?.map((contributor: any) => {
              const defaultAvatar = getDefaultAvatar(contributor?.member?.name);

              return (
                <div
                  className="contributor__wrpr"
                  key={(contributor?.uid)}
                  onClick={() => onContributorClickHandler(contributor)}
                >
                  <div className="contributor">
                    <div className="contributor__info">
                      <div className="contributor__info__imgWrpr">
                        <Image alt="profile" width={40} height={40} loading='eager' priority={true}  className="contributor__info__img" src={contributor?.member?.image?.url || defaultAvatar}  />
                      </div>
                      <div className="contributor__info__name">{contributor?.member?.name}</div>
                    </div>
                    <div className="contributor__nav">
                      <img src="/icons/right-arrow-gray.svg" alt="icon" />
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredContriList.length === 0 && <div className="cm__body__contributors__notFound">No Contributors found.</div>}
          </div>
        </div>
      </Modal>
      <style jsx>{`
        .cm {
          padding: 24px;
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          height: 60vh;
          overflow: auto;
          border-radius: 12px;
          background: #fff;
        }

        .cm__hdr {
          font-size: 16px;
          font-weight: 600;
          line-height: 22px;
          letter-spacing: 0px;
          color: #0f172a;
          background-color: #ffffff;
        }

        .cm__body__contributors {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          overflow: auto;
        }

        .cm__body__search {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
        }

        .cm__body__search__icon {
          position: absolute;
          top: 0px;
          bottom: 0px;
          left: 0px;
          padding-left: 8px;
          display: flex;
          align-items: center;
        }

        .cm__body__search__input {
          display: flex;
          width: 100%;
          padding: 10px 15px 10px 36px;
          background-color: #ffffff;
          border-width: 0px;
          border-radius: 8px;
          font-size: 14px;
          color: #475569;
        }

        .cm__body__search__input:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }

        .contributor__wrpr {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
        }

        .contributor__wrpr:hover {
          background-color: #f1f5f9;
        }

        .contributor {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .contributor__info {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .contributor__info__imgWrpr {
          position: relative;
        }

        .contributor__info__name {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          letter-spacing: 0px;
          color: #0f172a;
        }
        .contributor__info__teamlead {
          position: absolute;
          left: 25px;
          bottom: 33px;
        }

        .contributor__nav {
          dislay: flex;
        }

        .cm__body__contributors__notFound {
          color: #0f172a;
          text-align: center;
          font-size: 14px;
        }

        .cm__body__search__clear-icon {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
        }

        @media (min-width: 1024px) {
          .cm {
            width: 512px;
          }
        }
      `}</style>
    </>
  );
};

export default HostSpeakersList;
