'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { useIrlDetails } from '@/hooks/irl/use-irl-details';
import { sortByDefault } from '@/utils/irl.utils';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import Toolbar from './toolbar';
import TableHeader from './attendee-table-header';
import GuestList from './guest-list';
import EmptyList from './empty-list';
import FloatingBar from './floating-bar';
import Modal from '@/components/core/modal';
import DeleteGuestsPopup from './delete-guests-popup';

const AttendeeList = (props: any) => {
  const userInfo = props.userInfo;
  const isLoggedIn = props.isLoggedIn;
  const eventDetails = props.eventDetails;
  const showTelegram = props.showTelegram;
  const location = props.location;

  const [updatedEventDetails, setUpdatedEventDetails] = useState(eventDetails);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [showFloaingBar, setShowFloatingBar] = useState(false);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const [isUserGoing, setIsGoing] = useState<boolean>(props?.isUserGoing as boolean);
  const router = useRouter();

  const { filteredList, sortConfig, filterConfig } = useIrlDetails(updatedEventDetails?.guests, userInfo);
  const registeredGuest = useMemo(() => {
    return updatedEventDetails.guests.find((guest: any) => guest?.memberUid === userInfo?.uid);
  }, [updatedEventDetails.guests, userInfo.uid]);
  const [updatedUser, setUpdatedUser] = useState(registeredGuest);

  const onCloseFloatingBar = useCallback(() => {
    setSelectedGuests([]);
    setShowFloatingBar(false);
  }, []);

  const onCloseDeleteModal = (e: any) => {
    deleteRef.current?.close();
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
  }, [eventDetails, registeredGuest]);

  //update event details when form submit
  useEffect(() => {
    const handler = (e: any) => {
      const eventInfo = e.detail?.eventDetails;
      const goingGuest = eventInfo?.guests.find((guest: any) => guest.memberUid === userInfo.uid);
      const sortedGuests = sortByDefault(eventInfo?.guests);
      eventInfo.guests = sortedGuests;
      if (goingGuest) {
        setIsGoing(true);
        const currentUser = [...sortedGuests]?.find((v) => v.memberUid === userInfo?.uid);
        if (currentUser) {
          const filteredList = [...sortedGuests]?.filter((v) => v.memberUid !== userInfo?.uid);
          eventInfo.guests = [currentUser, ...filteredList];
        }
      } else {
        setIsGoing(false);
      }
      setUpdatedUser(goingGuest);
      setUpdatedEventDetails(eventInfo);
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
      const { isOpen } = e.detail;
      if (deleteRef.current && isOpen) {
        deleteRef.current.showModal();
      }
    };
    document.addEventListener(EVENTS.OPEN_REMOVE_GUESTS_POPUP, handler);
    return () => {
      document.removeEventListener(EVENTS.OPEN_REMOVE_GUESTS_POPUP, handler);
    };
  }, []);

  useEffect(() => {
    setUpdatedEventDetails(eventDetails);
  }, [eventDetails]);

  useEffect(() => {
    setUpdatedUser(registeredGuest);
  }, [registeredGuest]);

  return (
    <>
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
          />
        </div>
        <div className="attendeeList__table">
          <div className={`irl__table  ${isLoggedIn ? 'table__login' : 'table__not-login'} `}>
            <TableHeader userInfo={userInfo} isLoggedIn={isLoggedIn} eventDetails={updatedEventDetails} sortConfig={sortConfig} filterConfig={filterConfig} />
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
        </div>
      </div>
      {/* FLOATING BAR */}
      {showFloaingBar && (
        <div className="irl__floating-bar">
          <FloatingBar userInfo={userInfo} eventDetails={updatedEventDetails} selectedGuests={selectedGuests} onClose={onCloseFloatingBar} />
        </div>
      )}

      <Modal modalRef={deleteRef} onClose={onCloseDeleteModal}>
        <DeleteGuestsPopup
          location={location}
          userInfo={userInfo}
          onClose={onCloseDeleteModal}
          eventDetails={updatedEventDetails}
          selectedGuests={selectedGuests}
          setSelectedGuests={setSelectedGuests}
        />
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
