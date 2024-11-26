'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { ADMIN_ROLE, EVENTS, IRL_DEFAULT_TOPICS, TOAST_MESSAGES } from '@/utils/constants';
import Toolbar from './toolbar';
import GuestList from './guest-list';
import FloatingBar from './floating-bar';
import Modal from '@/components/core/modal';
import DeleteAttendeesPopup from './delete-attendees-popup';
import { getParsedValue, triggerLoader } from '@/utils/common.utils';
import { getGuestEvents, getGuestsByLocation, getTopicsByLocation } from '@/services/irl.service';
import AttendeeForm from '../add-edit-attendee/attendee-form';
import NoAttendees from './no-attendees';
import AttendeeTableHeader from './attendee-table-header';
import { IUserInfo } from '@/types/shared.types';
import { IAnalyticsGuestLocation, IGuest, IGuestDetails } from '@/types/irl.types';
import usePagination from '@/hooks/irl/use-pagination';
import { checkAdminInAllEvents, getFilteredEventsForUser, parseSearchParams } from '@/utils/irl.utils';
import TableLoader from '@/components/core/table-loader';

interface IAttendeeList {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  eventDetails: IGuestDetails;
  showTelegram: boolean;
  location: IAnalyticsGuestLocation;
  isUserGoing: boolean;
  searchParams: any;
  currentEventNames: string[];
  locationEvents: any;
}

const AttendeeList = (props: IAttendeeList) => {
  const userInfo = props.userInfo;
  const isLoggedIn = props.isLoggedIn;
  const eventDetails = props.eventDetails;
  const showTelegram = props.showTelegram;
  const location = props.location;
  const searchParams = props?.searchParams;
  const currentEventNames = props?.currentEventNames;
  const locationEvents = props?.locationEvents;
  const isAdminInAllEvents = checkAdminInAllEvents(searchParams?.type, locationEvents?.upcomingEvents, locationEvents?.pastEvents);

  const defaultTopics = IRL_DEFAULT_TOPICS?.split(',') ?? [];

  const [updatedEventDetails, setUpdatedEventDetails] = useState({ ...eventDetails });
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isAttendeeLoading, setIsAttendeeLoading] = useState<boolean>(false);
  const [showFloaingBar, setShowFloatingBar] = useState(false);
  const [iamGoingPopupProps, setIamGoingPopupProps]: any = useState({ isOpen: false, formdata: null, mode: '' });
  const deleteRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const [deleteModalOpen, setDeleteModalOpen] = useState({ isOpen: false, type: '' });

  const observerRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const { currentPage, limit, setPagination } = usePagination({
    observerTargetRef: observerRef,
    totalItems: updatedEventDetails?.totalGuests,
    totalCurrentItems: updatedEventDetails?.guests?.length,
  });

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
    const eventType = searchParams?.type === 'past' ? 'past' : searchParams?.type === 'upcoming' ? 'upcoming' : '';

    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
    setPagination({ page: 1, limit: 10 });

    const [eventInfo, currentGuestResponse, topics, loggedInUserEvents]: any = await Promise.all([
      await getGuestsByLocation(location?.uid, parseSearchParams(searchParams, eventDetails?.events), authToken, currentEventNames),
      await getGuestsByLocation(location?.uid, { type: eventType }, authToken, currentEventNames, 1, 1),
      await getTopicsByLocation(location?.uid, eventType),
      await getGuestEvents(location?.uid, authToken),
    ]);
    const currentGuest = currentGuestResponse?.guests[0].memberUid === userInfo?.uid ? currentGuestResponse?.guests[0] : null;
    eventInfo.isUserGoing = currentGuestResponse?.guests[0].memberUid === userInfo?.uid;
    eventInfo.topics = topics;
    eventInfo.eventsForFilter = getFilteredEventsForUser(loggedInUserEvents, eventDetails?.events, isLoggedIn, userInfo);

    setUpdatedEventDetails((prev) => ({ ...eventInfo, events: prev.events, currentGuest, totalGuests: eventInfo.totalGuests }));
    triggerLoader(false);
    router.refresh();
  };

  const onIamGoingPopupClose = () => {
    setIamGoingPopupProps({ isOpen: false, formdata: null, mode: '' });
  };

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

  useEffect(() => {
    if (currentPage !== 1) {
      setIsAttendeeLoading(true);
      const getEventDetails = async () => {
        const authToken = getParsedValue(Cookies.get('authToken'));
        const eventInfo: any = await getGuestsByLocation(location?.uid, parseSearchParams(searchParams, eventDetails?.events), authToken, currentEventNames, currentPage, limit);
        if (eventInfo.totalGuests > 0) {
          setUpdatedEventDetails((prev) => ({ ...prev, guests: [...prev.guests, ...eventInfo.guests], totalGuests: eventInfo.totalGuests }));
        }
        setIsAttendeeLoading(false);
      };

      const fetchData = async () => {
        await getEventDetails();
      };

      fetchData();
    }
  }, [currentPage]);

  // Sync  eventDetails changes
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
    setPagination({ page: 1, limit: 10 });
    setUpdatedEventDetails({ ...eventDetails });
  }, [eventDetails]);

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
          <Toolbar locationEvents={locationEvents} isAdminInAllEvents={isAdminInAllEvents} location={location} onLogin={onLogin} filteredListLength={updatedEventDetails.totalGuests} eventDetails={updatedEventDetails} userInfo={userInfo} isLoggedIn={isLoggedIn} />
        </div>
        <div className="attendeeList__table">
          {/* {eventDetails?.guests?.length > 0 && ( */}
          <div className={`irl__table table__login`}>
            <AttendeeTableHeader isLoggedIn={isLoggedIn} eventDetails={updatedEventDetails} />
            <div ref={tableRef} className={`irl__table__body w-full`}>
              <GuestList
                userInfo={userInfo}
                items={updatedEventDetails?.guests}
                eventDetails={updatedEventDetails}
                showTelegram={showTelegram}
                selectedGuests={selectedGuests}
                setSelectedGuests={setSelectedGuests}
                location={location}
                isLoggedIn={isLoggedIn}
                onLogin={onLogin}
                searchParams={searchParams}
                isAdminInAllEvents={isAdminInAllEvents}
              />
              {isAttendeeLoading && <TableLoader />}
              <div ref={observerRef} className="scroll-observer"></div>
            </div>
          </div>
          {/* )} */}
          {/* {eventDetails?.totalGuests === 0 && searchParams.type !== 'past' && <NoAttendees userInfo={userInfo} isLoggedIn={isLoggedIn} location={location} onLogin={onLogin} />} */}
        </div>
      </div>
      {/* FLOATING BAR */}
      {showFloaingBar && (
        <div className="irl__floating-bar">
          <FloatingBar location={location} eventDetails={updatedEventDetails} selectedGuests={selectedGuests} onClose={onCloseFloatingBar} searchParams={searchParams} />
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
          flex-direction: column;
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

        .scroll-observer {
          height: 3px;
          width: 100%;
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

        @media (min-width: 1440px) {
          .irl__table {
            width: 1244px;
          }

          .attendeeList__table {
            max-width: 1244px;
          }
        }

        @media (min-width: 1920px) {
          .irl__table {
            width: 1678px;
          }

          .attendeeList__table {
            max-width: 1678px;
          }
        }

        @media (min-width: 2560px) {
          .irl__table {
            width: 2240px;
          }

          .attendeeList__table {
            max-width: 2240px;
          }
        }
      `}</style>
    </>
  );
};

export default AttendeeList;
