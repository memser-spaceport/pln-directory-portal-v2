'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { useIrlDetails } from '@/hooks/irl/use-irl-details';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import Toolbar from './toolbar';
import GuestList from './guest-list';
import EmptyList from './empty-list';
import FloatingBar from './floating-bar';
import Modal from '@/components/core/modal';
import DeleteAttendeesPopup from './delete-attendees-popup';
import { getParsedValue, triggerLoader } from '@/utils/common.utils';
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

  const [updatedEventDetails, setUpdatedEventDetails] = useState({ ...eventDetails });
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [showFloaingBar, setShowFloatingBar] = useState(false);
  const [iamGoingPopupProps, setIamGoingPopupProps]: any = useState({ isOpen: false, formdata: null, mode: '' });
  const deleteRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const { filteredList, sortConfig, filterConfig } = useIrlDetails(updatedEventDetails?.guests, userInfo);
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

  const getEventDetails = async () => {
    const authToken = getParsedValue(Cookies.get('authToken'));
    const slugURL = searchParams.event || '';
    const eventType = searchParams.type === 'past' ? '' : 'upcoming';
    const eventInfo: any = await getGuestsByLocation(location?.uid, eventType, authToken, slugURL, userInfo);
    setUpdatedEventDetails(eventInfo);
    triggerLoader(false);
    router.refresh();
  };

  const onIamGoingPopupClose = () => {
    setIamGoingPopupProps({ isOpen: false, formdata: null, mode: '' });
  };

  // Sync registeredGuest and eventDetails changes
  useEffect(() => {
    setUpdatedEventDetails(eventDetails);
  }, [eventDetails]);

  useEffect(() => {
    const floatingBarhandler = (e: any) => {
      setShowFloatingBar(e.detail.isOpen);
    };

    const deleteGuestsHandler = (e: any) => {
      const { isOpen, type } = e.detail;
      if (deleteRef.current && isOpen) {
        setDeleteModalOpen((prev) => ({ ...prev, isOpen: true, type }));
        deleteRef.current.showModal();
      }
    };

    const iamGoingHandler = (e: any) => {
      setIamGoingPopupProps(e.detail);
    };

    document.addEventListener(EVENTS.OPEN_FLOATING_BAR, floatingBarhandler);
    document.addEventListener(EVENTS.OPEN_REMOVE_GUESTS_POPUP, deleteGuestsHandler);
    document.addEventListener(EVENTS.OPEN_IAM_GOING_POPUP, iamGoingHandler);

    return () => {
      document.removeEventListener(EVENTS.OPEN_FLOATING_BAR, floatingBarhandler);
      document.removeEventListener(EVENTS.OPEN_REMOVE_GUESTS_POPUP, deleteGuestsHandler);
      document.removeEventListener(EVENTS.OPEN_IAM_GOING_POPUP, iamGoingHandler);
    };
  }, []);

  //close floating bar on route change
  useEffect(() => {
    setShowFloatingBar(false);
    setSelectedGuests([]);
  }, [searchParams, router]);

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
          getEventDetails={getEventDetails}
          searchParams={searchParams}
        />
      )}
      <div className="attendeeList">
        <div className="attendeeList__toolbar">
          <Toolbar location={location} onLogin={onLogin} filteredListLength={filteredList?.length} eventDetails={updatedEventDetails} userInfo={userInfo} isLoggedIn={isLoggedIn} />
        </div>
        <div className="attendeeList__table">
          {eventDetails?.guests?.length > 0 && (
            <div className={`irl__table table__login`}>
              <AttendeeTableHeader isLoggedIn={isLoggedIn} eventDetails={updatedEventDetails} sortConfig={sortConfig} filterConfig={filterConfig} />
              <div className={`irl__table__body w-full`}>
                <GuestList
                  userInfo={userInfo}
                  items={filteredList}
                  eventDetails={updatedEventDetails}
                  showTelegram={showTelegram}
                  selectedGuests={selectedGuests}
                  setSelectedGuests={setSelectedGuests}
                  location={location}
                  isLoggedIn={isLoggedIn}
                  onLogin={onLogin}
                />
              </div>
            </div>
          )}
          {eventDetails?.guests?.length === 0 && searchParams.type !== 'past' && <NoAttendees userInfo={userInfo} isLoggedIn location={location} onLogin={onLogin} />}
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
            getEventDetails={getEventDetails}
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

        @media (min-width: 360px) {
          .attendeeList__table {
            overflow: auto;
          }
        }
        @media (min-width: 1024px) {
          .attendeeList__table {
            overflow: unset;
          }
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
