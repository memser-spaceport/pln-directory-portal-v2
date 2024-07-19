'use client';

import { useRef, useState } from 'react';
import ResourcesPopup from './resources-popup';
import Modal from '@/components/core/modal';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { TOAST_MESSAGES } from '@/utils/constants';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsEventInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';
import { IResource } from '@/types/irl.types';

interface IResourcesProps {
  eventDetails: any;
  userInfo: IUserInfo;
  isUserLoggedIn: boolean;
}

interface IResourceLink {
  resource: IResource;
  onClick: (resource: IResource) => void;
}

const Resources = (props: IResourcesProps) => {
  const eventDetails = props?.eventDetails;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const userInfo = props?.userInfo;
  const resources = eventDetails?.resources ?? [];

  const [isOpen, setIsOpen] = useState(false);
  const analytics = useIrlAnalytics();
  const router = useRouter();
  const resourcesRef = useRef<HTMLDialogElement>(null);
  const resourcesNeedToShow = isUserLoggedIn ? 5 : resources?.length < 5 ? resources?.length : 5;

  const onCloseModal = () => {
    if (resourcesRef.current) {
      resourcesRef.current.close();
    }
  };

  const onResourceClick = (resource: IResource) => {
    analytics.resourceClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), ...resource });
  };

  const onPopupResourceClick = (resource: IResource) => {
    analytics.resourcePopupResourceClicked(getAnalyticsUserInfo(userInfo), {
      ...getAnalyticsEventInfo(eventDetails),
      ...resource,
    });
  };

  const onLoginClick = () => {
    analytics.resourcesLoginClicked({ ...getAnalyticsEventInfo(eventDetails) });
    if (Cookies.get('refreshToken')) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      window.location.reload();
    } else {
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  };

  const onOpenModal = () => {
    if (resourcesRef.current) {
      resourcesRef.current.showModal();
    }
    analytics.resourcesSeeMoreClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails) });
    setIsOpen((prev) => !prev);
  };

  const ResourceLink = (props: IResourceLink) => {
    const resource = props?.resource;
    const onClick = props?.onClick;
    return (
      <>
        <a href={resource?.link} target="_blank" className="resourceLink" onClick={() => onClick(resource)} rel="noreferrer">
          <img src={resource?.icon || '/icons/link-blue.svg'} alt="link" loading="lazy" width={14} height={14} />
          <span className="resourceLink__text">{resource?.name}</span>
          <img src="/icons/arrow-blue.svg" alt="arrow" width={9} height={9} />
        </a>
        <style jsx>{`
          .resourceLink {
            display: inline-flex;
            align-items: center;
            gap: 7px;
          }

          .resourceLink__text {
            font-size: 13px;
            font-weight: 500;
            line-height: 20px;
            color: #156ff7;
          }
        `}</style>
      </>
    );
  };

  return (
    <>
      <div className={`resources ${resources?.length === 0 ? 'hasMore' : ''}`}>
        <h6 className="resources__ttl">Resources</h6>
        {resources?.length > 0 && (
          <div className="resources__list">
            {resources?.slice(0, resourcesNeedToShow)?.map((item: IResource, index: number) => (
              <div className="resources__list__item" key={`resource-${index}`}>
                <ResourceLink resource={item} onClick={onResourceClick} />
              </div>
            ))}
            {resources?.length > resourcesNeedToShow && (
              <button className="resources__list__moreBtn" onClick={onOpenModal}>
                {`+${resources?.length - resourcesNeedToShow} more`}
              </button>
            )}
          </div>
        )}
        {resources?.length === 0 && (
          <div className="resources__pvt">
            <img className="resources__pvt__icon" src="/icons/lock-grey.svg" alt="lock" />
            <span className="resources__pvt__txt ">
              Resources are set to private. Please{' '}
              <span onClick={onLoginClick} className="resources__pvt__txt__link">
                login
              </span>
              {` `}
              to access
            </span>
          </div>
        )}
      </div>
      <Modal modalRef={resourcesRef} onClose={onCloseModal}>
        <ResourcesPopup
          isOpen={isOpen}
          onClose={onCloseModal}
          resourceLink={ResourceLink}
          allResources={resources}
          resourcesToShow={resources}
          onResourceClick={onPopupResourceClick}
          eventDetails={eventDetails}
        />
      </Modal>

      <style jsx>{`
        .resources {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hasMore {
          justify-content: space-between;
        }

        .resources__ttl {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
        }

        .resources__list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          row-gap: 12px;
          column-gap: 14px;
        }

        .resources__list__item {
          diplay: flex;
          height: 20px;
        }

        .resources__list__moreBtn {
          display: flex;
          height: 24px;
          align-items: center;
          border-radius: 29px;
          border: 1px solid #cbd5e1;
          padding: 0px 6px;
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          color: #156ff7;
          background: #fff;
        }

        .resources__pvt {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .resources__pvt__icon {
          padding: 2px 0px 0px 0px;
        }

        .resources__pvt__txt {
          font-size: 13px;
          line-height: 20px;
          color: #64748b;
        }

        .resources__pvt__txt__link {
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          color: #156ff7;
        }

        @media (min-width: 1024px) {
          .hasMore {
            flex-direction: row;
          }

          .resources__pvt {
            align-items: center;
          }

          .resources__pvt__icon {
            padding: unset;
          }
        }
      `}</style>
    </>
  );
};

export default Resources;
