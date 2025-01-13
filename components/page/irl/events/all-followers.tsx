'use client';

import Modal from '@/components/core/modal';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { IMember } from '@/types/members.types';
import { EVENTS } from '@/utils/constants';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useRef, useState } from 'react';

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
    setFilteredFollowers([...followersList])
  }, [followersList])



  const onInputchangeHandler = (event: any) => {
    const searchTerm = event?.target.value.toLowerCase();
    setSearchTerm(event.target.value);
    const filteredMembers = followersList?.filter((member: IMember) => member?.name?.toLowerCase()?.includes(searchTerm));
    setFilteredFollowers(filteredMembers);

  };

  const onModalCloseClickHandler = () => {
    setSearchTerm("");
    setFilteredFollowers(followersList);
    onClose();
  }


  return (
    <>
      <Modal modalRef={allFollowersRef} onClose={onModalCloseClickHandler}>
        <div className="cm">
          <div className="cm__hdr">
            <div className='cm__hdr__ttl'>People following {location}</div>
            <div className='cm__hdr__count'>{followersList.length} following</div>

          </div>
          <div>
            <div className="cm__body__search">
              <div className="cm__body__search__icon">
                <Image loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
              </div>
              <input value={searchTerm} type="search" className="cm__body__search__input" placeholder="Search" onChange={onInputchangeHandler} />
            </div>
          </div>
          <div className="cm__body__followers">
            {filteredFollowers?.map((contributor: any, index: number) => {
              return (
                <div key={'contributor' + contributor?.uid}
                  className={`contributor__wrpr ${index !== filteredFollowers.length - 1 ? "borderb" : ""}`}
                >
                  <a href={`${process.env.APPLICATION_BASE_URL}/members/${contributor.memberUid}`}
                    target='_blank'
                    onClick={() => onFollowerClickHandler(contributor)}
                  >
                    <div className="contributor">
                      <div className="contributor__info">
                        <div className="contributor__info__imgWrpr">
                          <Image alt="profile" width={40} height={40} layout='intrinsic' loading='eager' priority={true} className="contributor__info__img" src={contributor.logo || '/icons/default_profile.svg'} />
                          {contributor?.teamLead &&
                            <>
                              <Tooltip asChild trigger={<img src="/icons/badge/team-lead.svg" className="contributor__info__teamlead" alt="team lead image" width={16} height={16} />}
                                content="Team Lead" />
                            </>}
                        </div>
                        <div className="contributor__info__nameandrole">
                          <div className="contributor__info__name">{contributor?.name}</div>
                          {contributor?.roles?.length > 0 && (
                            <div className='contributor__info__nameandrole__role'>
                              <span className='contributor__info__nameandrole__role__name' >{contributor?.roles[0]}</span>
                              {contributor?.roles?.length > 1 && (
                                <Tooltip asChild content={
                                  <>
                                    {contributor?.roles.slice(1, contributor.roles.length).map((con: any, index: any) => (
                                      <div key={`key-${index}`}>{con}</div>
                                    ))}
                                  </>

                                }
                                  trigger={<span className='contributor__info__nameandrole__role__count'>+{contributor.roles.length - 1}</span>}
                                />
                              )}
                            </div>

                          )}

                        </div>
                      </div>
                      <div className="contributor__nav">
                        <img src="/icons/right-arrow-gray.svg" alt="icon" />
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
            {filteredFollowers.length === 0 && <div className="cm__body__contributors__notFound">No Followers found.</div>}
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

        .cm__hdr__ttl {
          font-size: 16px;
          font-weight: 600;
          line-height: 22px;
          letter-spacing: 0px;
          color: #0f172a;
          background-color: #ffffff;
        }

        .cm__hdr__count {
        font-size: 14px;
        font-weight: 400;
        line-height: 28px;

        }

        .cm__body__contributors {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          overflow: auto;
        }

        .contributor__info__nameandrole {
        display: flex;
        gap: 4px;
        flex-direction: column;}

        .contributor__info__nameandrole__role {
        display: flex;
        gap: 5px;
        }

        .contributor__info__nameandrole__role__name {
        font-size: 14px;
        font-weight: 400;
        lineh-height: 20px;
        color: #64748B;
                  max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .contributor__info__nameandrole__role__count {
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

        .contributor__wrpr {
          cursor: pointer;
          padding: 10px 10px 10px 0;
          border-radius: 4px;
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

        @media (min-width: 1024px) {
          .cm {
            width: 512px;
          }

          .contributor__info__name {
          width: 350px}
        }
      `}</style>
    </>
  );
};

export default AllFollowers;
