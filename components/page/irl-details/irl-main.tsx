'use client';

import { useIrlDetails } from '@/hooks/irl/use-irl-details';
import { useEffect, useRef, useState } from 'react';
import JoinEventStrip from './join-event-strip';
import { sortByDefault } from '@/utils/irl.utils';
import Toolbar from './toolbar';
import TableHeader from './table-header';
import GuestList from './guest-list';
import EmptyList from './empty-list';
import Modal from '@/components/core/modal';
import GoingDetail from './going-detail';

const IrlMain = (props: any) => {
  const eventDetails = props?.eventDetails;
  const onLogin = props?.onLogin;
  const userInfo = props?.userInfo;
  const teams = props?.teams;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const showTelegram = props?.showTelegram;
  // const telegram = eventDetails?.telegram;
  // const resources = eventDetails?.resources ?? [];
  const registeredGuest = eventDetails.guests.find((guest: any) => guest?.memberUid === userInfo?.uid);

  const [updatedEventDetails, setUpdatedEventDetails] = useState(eventDetails);
  const [isOpen, setIsOpen] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(registeredGuest);
  const [isUserGoing, setIsGoing] = useState(props?.isUserGoing);
  const [focusOHField, setFocusOHField] = useState(false);
  const { filteredList, sortConfig } = useIrlDetails(updatedEventDetails.guests, userInfo);
  const goingRef = useRef<HTMLDialogElement>(null);

  const onCloseGoingModal = () => {
    setIsOpen(false);
    if (goingRef.current) {
      goingRef.current.close();
    }
  };

  //update event details when form submit
  useEffect(() => {
    const handler = (e: any) => {
      const eventInfo = e.detail?.eventDetails;
      const goingGuest = eventInfo?.guests.find((guest: any) => guest.memberUid === userInfo.uid);
      const sortedGuests = sortByDefault(eventInfo?.guests);
      if (goingGuest) {
        setIsGoing(true);
        const currentUser = [...sortedGuests]?.find((v) => v.memberUid === userInfo?.uid);
        if (currentUser) {
          const filteredList = [...sortedGuests]?.filter((v) => v.memberUid !== userInfo?.uid);
          const formattedGuests = [currentUser, ...filteredList];
          eventInfo.guests = formattedGuests;
        }
      }

      setUpdatedUser(goingGuest);
      setUpdatedEventDetails(eventInfo);
    };
    document.addEventListener('updateGuests', handler);
    return () => {
      document.removeEventListener('updateGuests', handler);
    };
  }, [eventDetails]);

  //toggle attendees details modal
  useEffect(() => {
    const handler = (e: any) => {
      const isOpen = e.detail.isOpen;
      const isOHFocused = e.detail?.isOHFocused ?? false;
      if (goingRef.current && isOpen) {
        setIsOpen(true);
        goingRef.current.showModal();
      }
      setFocusOHField(isOHFocused);
    };
    document.addEventListener('openRsvpModal', handler);
    return () => {
      document.removeEventListener('openRsvpModal', handler);
    };
  }, []);

  useEffect(() => {
    setUpdatedEventDetails(eventDetails);
    setIsGoing(props?.isUserGoing);
    setUpdatedUser(registeredGuest);
  }, [eventDetails]);

  return (
    <>
      {updatedEventDetails?.guests.length === 0 && (
        <div className="irl__joinEvntstrp">
          <JoinEventStrip userInfo={userInfo} onLogin={onLogin} isUserGoing={isUserGoing} isUserLoggedIn={isUserLoggedIn} eventDetails={eventDetails} />
        </div>
      )}

      {updatedEventDetails?.guests.length > 0 && (
        <>
          <div className="irl__toolbar">
            <Toolbar eventDetails={updatedEventDetails} teams={teams} userInfo={userInfo} isUserGoing={isUserGoing} isUserLoggedIn={isUserLoggedIn} onLogin={onLogin} filteredList={filteredList} />
          </div>
          <div className={`irl__table  ${isUserLoggedIn ? 'table__login' : 'table__not-login'} `}>
            <TableHeader userInfo={userInfo} isUserLoggedIn={isUserLoggedIn} eventDetails={updatedEventDetails} filteredList={filteredList} sortConfig={sortConfig} />
            <div className={`irl__table__body  ${isUserLoggedIn ? 'w-fit' : 'w-full'}`}>
              {isUserLoggedIn && <GuestList userInfo={userInfo} items={filteredList} eventDetails={updatedEventDetails} showTelegram={showTelegram} />}
              {!isUserLoggedIn && <EmptyList onLogin={onLogin} items={filteredList} eventDetails={updatedEventDetails} />}
            </div>
          </div>
        </>
      )}
      <Modal modalRef={goingRef} onClose={onCloseGoingModal}>
        {isOpen ? (
          <GoingDetail
            teams={teams}
            isUserGoing={isUserGoing}
            registeredGuest={updatedUser}
            eventDetails={eventDetails}
            onClose={onCloseGoingModal}
            focusOHField={focusOHField}
            showTelegram={showTelegram}
          />
        ) : (
          <></>
        )}
      </Modal>

      <style jsx>
        {`
          .irl__joinEvntstrp {
            padding: 8px 0px;
          }

          .irl__toolbar {
            position: relative;
            z-index: 2;
            width: 100%;
            background-color: #f1f5f9;
            padding: 16px 20px 20px;
          }

          .irl__table {
            overflow-y: auto;
            overflow-x: scroll;
            margin-bottom: 8px;
            position: relative;
            width: calc(100% - 2px);
          }

          .irl__table__body {
            background-color: white;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            position: relative;
            margin-top: -4px;
          }

          .table__login {
            height: calc(100svh - 205px);
          }

          .table__not-login {
            height: calc(100svh - 236px);
          }

          .w-full {
            width: 100%;
          }

          .w-fit {
            width: fit-content;
          }

          @media (min-width: 1024px) {
            .irl__toolbar {
              padding: 18px 0px;
            }

            .irl__table {
              overflow-x: hidden;
            }

            .irl__table__body {
              border-radius: 8px;
              width: calc(100% - 2px);
            }

            .table__login {
              height: calc(100vh - 161px);
            }

            .table__not-login {
              height: calc(100vh - 210px);
            }
          }
        `}
      </style>
    </>
  );
};

export default IrlMain;