'use client';

import Modal from '@/components/core/modal';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { IMember } from '@/types/members.types';
import { EVENTS } from '@/utils/constants';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { OhBadge } from '@/components/core/OhBadge/OhBadge';
import { isMemberAvailableToConnect } from '@/utils/member.utils';

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
            <div className="cm__hdr__ttl">
              People following gatherings at {location} ({followersList.length})
            </div>
          </div>
          <div className="cm__body__search__cnt">
            <div className="cm__body__search">
              <div className="cm__body__search__icon">
                <SearchIcon />
              </div>
              <input value={searchTerm} type="search" className="cm__body__search__input" placeholder="Search" onChange={onInputchangeHandler} />
            </div>
          </div>
          <div className="cm__body__search__divider" />
          <div className="cm__body__followers">
            {filteredFollowers?.map((follower: any, index: number) => {
              const { member } = follower;
              const defaultAvatar = getDefaultAvatar(follower.name);
              const mainTeam = follower.teams?.find((team: any) => team.mainTeam) || follower.teams[0];
              const isAvailableToConnect = isMemberAvailableToConnect(member);

              return (
                <div key={'follower' + follower?.uid} className={`follower__wrpr ${index !== filteredFollowers.length - 1 ? 'borderb' : ''}`}>
                  <a href={`${process.env.APPLICATION_BASE_URL}/members/${follower.memberUid}`} target="_blank" onClick={() => onFollowerClickHandler(follower)}>
                    <div className="follower">
                      <div className="follower__info">
                        <div className="follower__info__imgWrpr">
                          <Image alt="profile" width={40} height={40} layout="intrinsic" loading="eager" priority={true} className="follower__info__img" src={follower.logo || defaultAvatar} />
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
                          {mainTeam ? (
                            <div className="follower__info__nameandrole__role">
                              {mainTeam.role} &#8226; {mainTeam.name}
                            </div>
                          ) : (
                            <span className="follower__info__nameandrole__role">Contributor</span>
                          )}
                          {isAvailableToConnect && <OhBadge variant="secondary" />}
                        </div>
                      </div>
                      <div className="follower__nav">
                        <CaretIcon />
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
          //max-width: 368px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          max-height: 95dvh;
          min-height: 80dvh;
          overflow: auto;
          border-radius: 12px;
          background: #fff;

          width: clamp(300px, 90vw, 600px);
        }

        .cm__hdr {
          padding: 24px 24px 0 24px;
        }

        .cm__hdr__ttl {
          font-size: 18px;
          font-weight: 600;
          line-height: 22px;
          letter-spacing: 0px;
          color: #0f172a;
          background-color: #ffffff;
          max-width: 90%;
          text-wrap: balance;
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
          color: #455468;
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: 18px; /* 150% */
          letter-spacing: -0.2px;
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
          //display: block;
          width: 100%;
          height: 100%;
          //border-radius: 8px;
          //border: 1px solid #cbd5e1;

          display: flex;
          //padding: 10px 12px;
          align-items: center;
          gap: 6px;
          align-self: stretch;

          border-radius: 10px;
          border: 1px solid rgba(27, 56, 96, 0.12);
          background: #fff;

          box-shadow:
            0 -2px 8px 0 rgba(14, 15, 17, 0.02) inset,
            0 1px 2px 0 rgba(14, 15, 17, 0.08);
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
          padding: 10px 12px 10px 36px; // 10px 15px 10px 36px;
          background-color: #ffffff;
          border-width: 0px;
          border-radius: 8px;
          font-size: 14px;
          color: #475569;
        }

        .cm__body__search__input::placeholder {
          overflow: hidden;
          color: #afbaca;
          text-overflow: ellipsis;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 20px; /* 142.857% */
          letter-spacing: -0.2px;
        }

        .cm__body__search__input:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }

        .follower__wrpr {
          cursor: pointer;
          padding: 10px 10px 10px 0;
          //border-radius: 4px;
          border-bottom: 1px solid rgba(27, 56, 96, 0.12);
        }

        .cm__body__search__cnt {
          padding: 0 24px 0 24px;
        }

        .cm__body__search__divider {
          height: 1px;
          width: 100%;
          background-color: rgba(27, 56, 96, 0.12);
        }

        .follower__wrpr:hover {
          //background-color: #f1f5f9;
        }

        .follower {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .follower__info {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .follower__info__imgWrpr {
          position: relative;
        }

        .follower__info__name {
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: #455468;
          font-size: 16px;
          font-style: normal;
          font-weight: 500;
          line-height: 24px; /* 150% */
          letter-spacing: -0.3px;
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

        @media (min-width: 960px) {
          //.cm {
          //  max-width: 600px;
          //  width: 100%;
          //}

          .follower__info__name {
            //width: 350px;
          }
        }
      `}</style>
    </>
  );
};

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_6121_8588)">
      <path
        d="M2.82486 16.8369L6.53502 13.1251C5.4226 11.6755 4.90323 9.85701 5.08229 8.03853C5.26134 6.22005 6.12541 4.53777 7.4992 3.33294C8.873 2.12811 10.6536 1.49096 12.4799 1.55073C14.3062 1.6105 16.0414 2.36272 17.3335 3.65479C18.6256 4.94687 19.3778 6.68205 19.4376 8.50834C19.4973 10.3346 18.8602 12.1153 17.6553 13.4891C16.4505 14.8629 14.7682 15.7269 12.9498 15.906C11.1313 16.085 9.31278 15.5657 7.86314 14.4533L4.14986 18.1673C4.06266 18.2545 3.95913 18.3237 3.84519 18.3709C3.73125 18.4181 3.60913 18.4424 3.4858 18.4424C3.36247 18.4424 3.24035 18.4181 3.12641 18.3709C3.01247 18.3237 2.90895 18.2545 2.82174 18.1673C2.73453 18.0801 2.66536 17.9766 2.61816 17.8626C2.57096 17.7487 2.54667 17.6266 2.54667 17.5033C2.54667 17.3799 2.57096 17.2578 2.61816 17.1439C2.66536 17.0299 2.73453 16.9264 2.82174 16.8392L2.82486 16.8369ZM17.5506 8.75014C17.5506 7.69942 17.2391 6.67231 16.6553 5.79867C16.0716 4.92503 15.2419 4.24412 14.2711 3.84203C13.3004 3.43994 12.2323 3.33473 11.2017 3.53972C10.1712 3.7447 9.22461 4.25067 8.48164 4.99363C7.73867 5.7366 7.23271 6.6832 7.02772 7.71372C6.82274 8.74424 6.92794 9.81241 7.33003 10.7831C7.73213 11.7539 8.41304 12.5836 9.28668 13.1673C10.1603 13.7511 11.1874 14.0626 12.2381 14.0626C13.6467 14.0612 14.9971 13.501 15.993 12.505C16.989 11.5091 17.5492 10.1587 17.5506 8.75014Z"
        fill="#2D3643"
      />
    </g>
    <defs>
      <filter id="filter0_d_6121_8588" x="-1" y="-1" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6121_8588" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6121_8588" result="shape" />
      </filter>
    </defs>
  </svg>
);

const CaretIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.354 8.35403L6.35403 13.354C6.30757 13.4005 6.25242 13.4373 6.19173 13.4625C6.13103 13.4876 6.06598 13.5006 6.00028 13.5006C5.93458 13.5006 5.86953 13.4876 5.80883 13.4625C5.74813 13.4373 5.69298 13.4005 5.64653 13.354C5.60007 13.3076 5.56322 13.2524 5.53808 13.1917C5.51294 13.131 5.5 13.066 5.5 13.0003C5.5 12.9346 5.51294 12.8695 5.53808 12.8088C5.56322 12.7481 5.60007 12.693 5.64653 12.6465L10.2934 8.00028L5.64653 3.35403C5.55271 3.26021 5.5 3.13296 5.5 3.00028C5.5 2.8676 5.55271 2.74035 5.64653 2.64653C5.74035 2.55271 5.8676 2.5 6.00028 2.5C6.13296 2.5 6.26021 2.55271 6.35403 2.64653L11.354 7.64653C11.4005 7.69296 11.4374 7.74811 11.4626 7.80881C11.4877 7.86951 11.5007 7.93457 11.5007 8.00028C11.5007 8.06599 11.4877 8.13105 11.4626 8.19175C11.4374 8.25245 11.4005 8.30759 11.354 8.35403Z"
      fill="#455468"
    />
  </svg>
);

export default AllFollowers;
