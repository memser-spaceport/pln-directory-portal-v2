'use client';

import Modal from '@/components/core/modal';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { IMember } from '@/types/members.types';
import { EVENTS } from '@/utils/constants';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface IAllFollowers {
  onClose: () => void;
  followersList: any[];
  onFollowerClickHandler: any;
  location: string;
}

const AllFollowers = (props: IAllFollowers) => {
  const onClose = props?.onClose;
  const followersList = props?.followersList ?? [];
  const location = props?.location;
  const onFollowerClickHandler = props?.onFollowerClickHandler;

  const [searchTerm, setSearchTerm] = useState('');
  const allFollowersRef = useRef<HTMLDialogElement>(null);
  const [filteredFollowers, setFilteredFollowers] = useState([...followersList]);

  useEffect(() => {
    document.addEventListener(EVENTS.IRL_ALL_FOLLOWERS_OPEN_AND_CLOSE, (e: any) => {
      if (e?.detail?.status) {
        allFollowersRef?.current?.showModal();
        return;
      }
      allFollowersRef?.current?.close();
      return;
    });
  }, []);

  useEffect(() => {
    setFilteredFollowers([...followersList]);
  }, [followersList]);

  const onInputchangeHandler = (event: any) => {
    const searchTerm = event?.target.value.toLowerCase();
    setSearchTerm(event.target.value);
    const filteredMembers = followersList?.filter((member: IMember) => member?.name?.toLowerCase()?.includes(searchTerm));
    setFilteredFollowers(filteredMembers);
  };

  const onModalCloseClickHandler = () => {
    setSearchTerm('');
    setFilteredFollowers(followersList);
    onClose();
  };

  return (
    <>
      <Modal modalRef={allFollowersRef} onClose={onModalCloseClickHandler}>
        <div className="cm">
          <div className="cm__hdr">
            <div className="cm__hdr__ttl">People following gatherings at {location}</div>
            <div className="cm__hdr__count">{followersList.length} following</div>
          </div>
          <div className="cm__body__search__cnt">
            <div className="cm__body__search">
              <div className="cm__body__search__icon">
                <Image loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
              </div>
              <input value={searchTerm} type="search" className="cm__body__search__input" placeholder="Search" onChange={onInputchangeHandler} />
            </div>
          </div>
          <div className="cm__body__followers">
            {filteredFollowers?.map((follower: any, index: number) => {
              return (
                <div key={'follower' + follower?.uid} className={`follower__wrpr ${index !== filteredFollowers.length - 1 ? 'borderb' : ''}`}>
                  <a href={`${process.env.APPLICATION_BASE_URL}/members/${follower.memberUid}`} target="_blank" onClick={() => onFollowerClickHandler(follower)}>
                    <div className="follower">
                      <div className="follower__info">
                        <div className="follower__info__imgWrpr">
                          <Image
                            alt="profile"
                            width={40}
                            height={40}
                            layout="intrinsic"
                            loading="eager"
                            priority={true}
                            className="follower__info__img"
                            src={follower.logo || '/icons/default_profile.svg'}
                          />
                          {follower?.teamLead && (
                            <>
                              <Tooltip
                                asChild
                                trigger={<img src="/icons/badge/team-lead.svg" className="follower__info__teamlead" alt="team lead image" width={16} height={16} />}
                                content="Team Lead"
                              />
                            </>
                          )}
                        </div>
                        <div className="follower__info__nameandrole">
                          <div className="follower__info__name">{follower?.name}</div>
                          {follower?.roles?.length > 0 ? (
                            <div className="follower__info__nameandrole__role">
                              <span className="follower__info__nameandrole__role__name">{follower?.roles[0]}</span>
                              {follower?.roles?.length > 1 && (
                                <Tooltip
                                  asChild
                                  content={
                                    <>
                                      {follower?.roles.slice(1, follower.roles.length).map((con: any, index: any) => (
                                        <div key={`key-${index}`}>{con}</div>
                                      ))}
                                    </>
                                  }
                                  trigger={<span className="follower__info__nameandrole__role__count">+{follower.roles.length - 1}</span>}
                                />
                              )}
                            </div>
                          ): <span className="follower__info__nameandrole__role__name">{"Contributor"}</span>}
                        </div>
                      </div>
                      <div className="follower__nav">
                        <img src="/icons/right-arrow-gray.svg" alt="icon" />
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
            {filteredFollowers.length === 0 && <div className="cm__body__followers__notFound">No Followers found.</div>}
          </div>
        </div>
      </Modal>
      <style jsx>{`
        .cm {
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
          padding: 24px 24px 0 24px;
        }

        .cm__hdr__ttl {
          font-size: 20px;
          font-weight: 600;
          line-height: 22px;
          letter-spacing: 0px;
          color: #0f172a;
          background-color: #ffffff;
        }

        .cm__body__followers {
          flex: 1;
          padding: 0px 24px 0 24px;
          overflow: auto;
        }

        .cm__hdr__count {
          font-size: 14px;
          font-weight: 400;
          line-height: 28px;
        }

        .cm__body__followers {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          overflow: auto;
        }

        .follower__info__nameandrole {
          display: flex;
          gap: 4px;
          flex-direction: column;
        }

        .follower__info__nameandrole__role {
          display: flex;
          gap: 5px;
        }

        .follower__info__nameandrole__role__name {
          font-size: 14px;
          font-weight: 400;
          lineh-height: 20px;
          color: #64748b;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .follower__info__nameandrole__role__count {
          background: #f1f5f9;
          border-radius: 24px;
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          padding: 2px 8px;
          display: flex;
          color: #64748b;
          align-items: center;
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

        .follower__wrpr {
          cursor: pointer;
          padding: 10px 10px 10px 0;
          border-radius: 4px;
        }

        .cm__body__search__cnt {
          padding: 0 24px 0 24px;
        }

        .follower__wrpr:hover {
          background-color: #f1f5f9;
        }

        .follower {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .follower__info {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .follower__info__imgWrpr {
          position: relative;
        }

        .follower__info__name {
          font-size: 16px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #0f172a;
          width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .follower__info__teamlead {
          position: absolute;
          left: 25px;
          bottom: 33px;
        }

        .follower__nav {
          dislay: flex;
        }

        .cm__body__followers__notFound {
          color: #0f172a;
          text-align: center;
          font-size: 14px;
        }

        @media (min-width: 1024px) {
          .cm {
            width: 512px;
          }

          .follower__info__name {
            width: 350px;
          }
        }
      `}</style>
    </>
  );
};

export default AllFollowers;