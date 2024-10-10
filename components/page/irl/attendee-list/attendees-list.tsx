'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

import { useIrlDetails } from '@/hooks/irl/use-irl-details';
import { sortByDefault } from '@/utils/irl.utils';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import Toolbar from './toolbar';
import GuestList from './guest-list';
import EmptyList from './empty-list';
import FloatingBar from './floating-bar';
import Modal from '@/components/core/modal';
import DeleteAttendeesPopup from './delete-attendees-popup';
import { getParsedValue } from '@/utils/common.utils';
import { getGuestsByLocation } from '@/services/irl.service';
import AttendeeForm from '../add-edit-attendee/attendee-form';
import NoAttendees from './no-attendees';
import AttendeeTableHeader from './attendee-table-header';
import { IUserInfo } from '@/types/shared.types';
import { IAnalyticsGuestLocation, IGuest, IGuestDetails } from '@/types/irl.types';

interface IAttendeeList {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  eventDetails: IGuestDetails;
  showTelegram: boolean;
  location: IAnalyticsGuestLocation;
  isUserGoing: boolean;
  searchParams: any;
}

const AttendeeList = (props: IAttendeeList) => {
  const userInfo = props.userInfo;
  const isLoggedIn = props.isLoggedIn;
  const eventDetails = props.eventDetails;
  const showTelegram = props.showTelegram;
  const location = props.location;
  const searchParams = props?.searchParams;


  const defaultTopics = process.env.IRL_DEFAULT_TOPICS?.split(',') ?? [];

  const [updatedEventDetails, setUpdatedEventDetails] = useState(eventDetails);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [showFloaingBar, setShowFloatingBar] = useState(false);
  const [isUserGoing, setIsGoing] = useState<boolean>(props?.isUserGoing as boolean);
  const [iamGoingPopupProps, setIamGoingPopupProps]: any = useState({ isOpen: false, formdata: null, mode: '' });
  const deleteRef = useRef<HTMLDialogElement>(null);
  // const searchParams = useSearchParams();
  const router = useRouter();

  const { filteredList, sortConfig, filterConfig } = useIrlDetails(updatedEventDetails?.guests, userInfo);
  const registeredGuest = useMemo(() => {
    return updatedEventDetails.guests.find((guest: any) => guest?.memberUid === userInfo?.uid);
  }, [updatedEventDetails.guests, userInfo.uid]) as IGuest;
  const [updatedUser, setUpdatedUser] = useState<IGuest>(registeredGuest);
  const [deleteModalOpen, setDeleteModalOpen] = useState({ isOpen: false, type: '' });

  const onCloseFloatingBar = useCallback(() => {
    setSelectedGuests([]);
    setShowFloatingBar(false);
  }, []);

  const onCloseDeleteModal = () => {
    deleteRef.current?.close();
    setDeleteModalOpen((prev) => ({ ...prev, isOpen: false }));
  };

  const onLogin = useCallback(async () => {
    const toast = (await import('react-toastify')).toast;
    if (Cookies.get('refreshToken')) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      window.location.reload();
    } else {
      router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
    }
  }, [router]);

  // Sync registeredGuest and eventDetails changes
  useEffect(() => {
    setUpdatedEventDetails(eventDetails);
    setUpdatedUser(registeredGuest);
    setIsGoing(props?.isUserGoing);
  }, [eventDetails, registeredGuest, props?.isUserGoing]);

  //update event details when form submit
  useEffect(() => {
    const handler = async (e: any) => {
      const authToken = getParsedValue(Cookies.get('authToken'));
      const slugURL = searchParams.event || '';
      const eventType = searchParams.type === 'past' ? '' : 'upcoming';
      const eventInfo: any = await getGuestsByLocation(location?.uid, eventType, authToken, slugURL, userInfo);
      setIsGoing(eventInfo.isUserGoing);
      setUpdatedUser(eventInfo.currentGuest);
      setUpdatedEventDetails(eventInfo);
      router.refresh();
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    };
    document.addEventListener('updateGuests', handler);
    return () => {
      document.removeEventListener('updateGuests', handler);
    };
  }, [eventDetails]);

  useEffect(() => {
    const handler = (e: any) => {
      setShowFloatingBar(e.detail.isOpen);
    };
    document.addEventListener(EVENTS.OPEN_FLOATING_BAR, handler);
    return () => {
      document.removeEventListener(EVENTS.OPEN_FLOATING_BAR, handler);
    };
  }, []);

  //toggle remove guests modal
  useEffect(() => {
    const handler = (e: any) => {
      const { isOpen, type } = e.detail;
      if (deleteRef.current && isOpen) {
        setDeleteModalOpen((prev) => ({ ...prev, isOpen: true, type }));
        deleteRef.current.showModal();
      }
    };
    document.addEventListener(EVENTS.OPEN_REMOVE_GUESTS_POPUP, handler);
    return () => {
      document.removeEventListener(EVENTS.OPEN_REMOVE_GUESTS_POPUP, handler);
    };
  }, []);

  //close floating bar on route change
  useEffect(() => {
    setShowFloatingBar(false);
    setSelectedGuests([]);
  }, [searchParams, router]);

  useEffect(() => {
    document.addEventListener(EVENTS.OPEN_IAM_GOING_POPUP, (e: any) => {
      setIamGoingPopupProps(e.detail);
    });

    return () => {
      document.removeEventListener(EVENTS.OPEN_IAM_GOING_POPUP, (e: any) => {
        setIamGoingPopupProps(e.detail);
      });
    };
  }, []);

  const onIamGoingPopupClose = () => {
    setIamGoingPopupProps({ isOpen: false, formdata: null, mode: '' });
  };

  return (
    <>
      {iamGoingPopupProps?.isOpen && (
        <AttendeeForm
          onClose={onIamGoingPopupClose}
          formData={iamGoingPopupProps?.formdata}
          selectedLocation={location}
          userInfo={userInfo}
          allGatherings={eventDetails?.events}
          defaultTags={defaultTopics}
          mode={iamGoingPopupProps?.mode}
          allGuests={eventDetails?.guests}
          scrollTo={iamGoingPopupProps?.scrollTo}
        />
      )}
      <div className="attendeeList">
        <div className="attendeeList__toolbar">
          <Toolbar
            isUserGoing={isUserGoing}
            location={location}
            onLogin={onLogin}
            filteredListLength={filteredList?.length}
            eventDetails={updatedEventDetails}
            userInfo={userInfo}
            isLoggedIn={isLoggedIn}
            updatedUser={updatedUser}
          />
        </div>
        <div className="attendeeList__table">
          {eventDetails?.guests?.length > 0 && (
            <div className={`irl__table  ${isLoggedIn ? 'table__login' : 'table__not-login'} `}>
              <AttendeeTableHeader isLoggedIn={isLoggedIn} eventDetails={updatedEventDetails} sortConfig={sortConfig} filterConfig={filterConfig} />
              <div className={`irl__table__body  ${isLoggedIn ? '' : 'w-full'}`}>
                {isLoggedIn && (
                  <GuestList
                    userInfo={userInfo}
                    items={filteredList}
                    eventDetails={updatedEventDetails}
                    showTelegram={showTelegram}
                    selectedGuests={selectedGuests}
                    setSelectedGuests={setSelectedGuests}
                    location={location}
                  />
                )}
                {!isLoggedIn && <EmptyList onLogin={onLogin} items={filteredList} eventDetails={updatedEventDetails} location={location} />}
              </div>
            </div>
          )}
          {eventDetails?.guests?.length === 0 && <NoAttendees userInfo={userInfo} isLoggedIn location={location} onLogin={onLogin} />}
        </div>
      </div>
      {/* FLOATING BAR */}
      {showFloaingBar && (
        <div className="irl__floating-bar">
          <FloatingBar location={location} eventDetails={updatedEventDetails} selectedGuests={selectedGuests} onClose={onCloseFloatingBar} />
        </div>
      )}

      <Modal modalRef={deleteRef} onClose={onCloseDeleteModal}>
        {deleteModalOpen?.isOpen && (
          <DeleteAttendeesPopup
            userInfo={userInfo}
            location={location}
            onClose={onCloseDeleteModal}
            eventDetails={updatedEventDetails}
            selectedGuests={selectedGuests}
            type={deleteModalOpen?.type}
            setSelectedGuests={setSelectedGuests}
          />
        )}
      </Modal>

      <style jsx>{`
        .attendeeList {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .attendeeList__table {
          display: flex;
          max-width: 900px;
          overflow: auto;
        }

        .irl__floating-bar {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
        }

        .irl__joinEvntstrp {
          padding: 8px 0px;
        }

        .irl__toolbar {
          position: relative;
          z-index: 3;
          width: 100%;
          background-color: #f1f5f9;
          padding: 16px 20px 20px;
        }

        .irl__table {
          // overflow-y: auto;
          // margin-bottom: 8px;
          position: relative;
          // width: calc(100% - 2px);
          display: flex;
          width: 900px;
          flex-direction: column;
        }

        .irl__table__body {
          background-color: white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border-radius: 0px 0px 8px 8px;
          position: relative;
          // margin-top: -4px;
          max-height: calc(100% - 54px);
          overflow-y: auto;
        }

        .table__login {
          height: calc(100svh - 280px);
        }

        .table__not-login {
          height: calc(100svh - 210px);
        }

        .w-full {
          width: 100%;
        }

        .w-fit {
          width: fit-content;
        }

        .irl__floating-bar {
          position: fixed;
          bottom: 40px;
          z-index: 3;
        }

        @media (min-width: 1024px) {
          .attendeeList {
            gap: 18px;
          }

          .irl__toolbar {
            padding: 18px 0px;
          }

          .irl__table {
            // overflow-x: hidden;
          }

          .irl__table__body {
            // border-radius: 8px;
            // width: calc(100% - 2px);
            overflow-x: hidden;
          }

          .table__login {
            height: calc(100vh - 170px);
          }

          .table__not-login {
            height: calc(100vh - 170px);
          }
        }
      `}</style>
    </>
  );
};

export default AttendeeList;
