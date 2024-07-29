'use client';

import { useIrlDetails } from '@/hooks/irl/use-irl-details';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JoinEventStrip from './join-event-strip';
import { sortByDefault } from '@/utils/irl.utils';
import Toolbar from './toolbar';
import TableHeader from './table-header';
import GuestList from './guest-list';
import EmptyList from './empty-list';
import Modal from '@/components/core/modal';
import GoingDetail from './going-detail';
import Cookies from 'js-cookie';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import { useRouter } from 'next/navigation';
import { IGuest, IIrlTeam } from '@/types/irl.types';
import DeleteGuestsPopup from './delete-guests-popup';
import FloatingBar from './floating-bar';

interface IIrlMain {
  isUserLoggedIn: boolean;
  showTelegram: boolean | undefined;
  teams: IIrlTeam[];
  userInfo: IUserInfo;
  isUserGoing: boolean | undefined;
  eventDetails: any;
}

const IrlMain = (props: IIrlMain) => {
  const eventDetails = props?.eventDetails;
  const userInfo = props?.userInfo;
  const teams = props?.teams;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const showTelegram = props?.showTelegram as boolean;

  const [updatedEventDetails, setUpdatedEventDetails] = useState(eventDetails);
  const registeredGuest = useMemo(() => {
    return updatedEventDetails.guests.find((guest: IGuest) => guest?.memberUid === userInfo?.uid);
  }, [updatedEventDetails.guests, userInfo.uid]);
  const [isOpen, setIsOpen] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(registeredGuest);
  const [isUserGoing, setIsGoing] = useState<boolean>(props?.isUserGoing as boolean);
  const [focusOHField, setFocusOHField] = useState(false);
  const { filteredList, sortConfig } = useIrlDetails(updatedEventDetails.guests, userInfo);
  const goingRef = useRef<HTMLDialogElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const [isAllowedToManageGuests, setIsAllowedToManageGuests] = useState(false);
  const router = useRouter();
  const [showFloaingBar, setShowFloatingBar] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [formType, setFormType] = useState('');

  const onCloseGoingModal = useCallback(() => {
    setIsOpen(false);
    setUpdatedUser(registeredGuest);
    goingRef.current?.close();
  }, []);

  const onCloseDeleteModal = useCallback(() => {
    deleteRef.current?.close();
  }, []);

  const onLogin = useCallback(async () => {
    const toast = (await import('react-toastify')).toast;
    if (Cookies.get('refreshToken')) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      window.location.reload();
    } else {
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  }, [router]);

  const onCloseFloatingBar = useCallback(() => {
    setSelectedGuests([]);
    setShowFloatingBar(false);
  }, []);

  //update event details when form submit
  useEffect(() => {
    const handler = (e: any) => {
      const eventInfo = e.detail?.eventDetails;
      const goingGuest = eventInfo?.guests.find((guest: IGuest) => guest.memberUid === userInfo.uid);
      const sortedGuests = sortByDefault(eventInfo?.guests);
      eventInfo.guests = sortedGuests;
      if (goingGuest) {
        setIsGoing(true);
        const currentUser = [...sortedGuests]?.find((v) => v.memberUid === userInfo?.uid);
        if (currentUser) {
          const filteredList = [...sortedGuests]?.filter((v) => v.memberUid !== userInfo?.uid);
          eventInfo.guests = [currentUser, ...filteredList];
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
      const { isOpen, isOHFocused = false, isAllowedToManageGuests = false, selectedGuest, type} = e.detail;
      setIsAllowedToManageGuests(isAllowedToManageGuests);
      if (goingRef.current && isOpen) {
        setIsOpen(true);
        goingRef.current.showModal();
      }
      setFormType(type);
      if (type === 'admin-edit') {
        const member = filteredList?.find((item: any) => item.uid === selectedGuest);
        setUpdatedUser(member);
      }

      if (type === 'self-edit') {
        const member = filteredList?.find((item: any) => item.memberUid === selectedGuest);
        setUpdatedUser(member);
      }

      setFocusOHField(isOHFocused);
    };
    document.addEventListener('openRsvpModal', handler);
    return () => {
      document.removeEventListener('openRsvpModal', handler);
    };
  }, [filteredList]);

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
    const handler = (e: any) => {
      setShowFloatingBar(e.detail.isOpen);
    };
    document.addEventListener('openFloatingBar', handler);
    return () => {
      document.removeEventListener('openFloatingBar', handler);
    };
  }, []);

  useEffect(() => {
    setUpdatedEventDetails(eventDetails);
    setIsGoing(props?.isUserGoing as boolean);
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
            <Toolbar eventDetails={updatedEventDetails} userInfo={userInfo} isUserGoing={isUserGoing} isUserLoggedIn={isUserLoggedIn} onLogin={onLogin} filteredList={filteredList} />
          </div>
          <div className={`irl__table  ${isUserLoggedIn ? 'table__login' : 'table__not-login'} `}>
            <TableHeader userInfo={userInfo} isUserLoggedIn={isUserLoggedIn} eventDetails={updatedEventDetails} sortConfig={sortConfig} />
            <div className={`irl__table__body  ${isUserLoggedIn ? 'w-fit' : 'w-full'}`}>
              {isUserLoggedIn && (
                <GuestList
                  userInfo={userInfo}
                  items={filteredList}
                  eventDetails={updatedEventDetails}
                  showTelegram={showTelegram}
                  selectedGuests={selectedGuests}
                  setSelectedGuests={setSelectedGuests}
                />
              )}
              {!isUserLoggedIn && <EmptyList onLogin={onLogin} items={filteredList} eventDetails={updatedEventDetails} />}
            </div>
          </div>
        </>
      )}

      {/* FLOATING BAR */}
      {showFloaingBar && (
        <div className="irl__floating-bar">
          <FloatingBar userInfo={userInfo} eventDetails={updatedEventDetails} selectedGuests={selectedGuests} onClose={onCloseFloatingBar} />
        </div>
      )}

      <Modal modalRef={goingRef} onClose={onCloseGoingModal}>
        {isOpen && (
          <GoingDetail
            loggedInUserteams={teams}
            isUserGoing={isUserGoing}
            registeredGuest={updatedUser}
            eventDetails={updatedEventDetails}
            onClose={onCloseGoingModal}
            focusOHField={focusOHField}
            showTelegram={showTelegram}
            isAllowedToManageGuests={isAllowedToManageGuests}
            formType={formType}
          />
        )}
      </Modal>

      <Modal modalRef={deleteRef} onClose={onCloseDeleteModal}>
        <DeleteGuestsPopup userInfo={userInfo} onClose={onCloseDeleteModal} eventDetails={updatedEventDetails} selectedGuests={selectedGuests} setSelectedGuests={setSelectedGuests} />
      </Modal>

      <style jsx>
        {`
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

          .irl__floating-bar {
            position: fixed;
            bottom: 40px;
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
