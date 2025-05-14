'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import InfiniteScroll from 'react-infinite-scroll-component';

import { EVENTS, IRL_DEFAULT_TOPICS, TOAST_MESSAGES } from '@/utils/constants';
import Toolbar from './toolbar';
import GuestList from './guest-list';
import FloatingBar from './floating-bar';
import Modal from '@/components/core/modal';
import DeleteAttendeesPopup from './delete-attendees-popup';
import AttendeeForm from '../add-edit-attendee/attendee-form';
import AttendeeTableHeader from './attendee-table-header';
import { IUserInfo } from '@/types/shared.types';
import { IAnalyticsGuestLocation, IGuestDetails } from '@/types/irl.types';
import { checkAdminInAllEvents, parseSearchParams } from '@/utils/irl.utils';
import TableLoader from '@/components/core/table-loader';
import { useInfiniteGuestsList } from '@/services/irl/hooks/useInfiniteGuestsList';
import { useEventDetails } from '@/services/irl/hooks/useEventDetails';

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
  followers: any;
  newSearchParams: URLSearchParams;
}

const AttendeeList = (props: IAttendeeList) => {
  const userInfo = props.userInfo;
  const isLoggedIn = props.isLoggedIn;
  const eventDetails = props.eventDetails;
  const showTelegram = props.showTelegram;
  const location = props.location;
  const newSearchParams = props.newSearchParams;
  const searchParams = props?.searchParams;
  const currentEventNames = props?.currentEventNames;
  const locationEvents = props?.locationEvents;
  const isAdminInAllEvents = checkAdminInAllEvents(searchParams?.type, locationEvents?.upcomingEvents, locationEvents?.pastEvents);

  const defaultTopics = IRL_DEFAULT_TOPICS?.split(',') ?? [];
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [showFloaingBar, setShowFloatingBar] = useState(false);
  const [iamGoingPopupProps, setIamGoingPopupProps]: any = useState({ isOpen: false, formdata: null, mode: '' });
  const deleteRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const [deleteModalOpen, setDeleteModalOpen] = useState({ isOpen: false, type: '' });
  const tableRef = useRef<HTMLDivElement | null>(null);
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

  const eventType = searchParams?.type === 'past' ? 'past' : searchParams?.type === 'upcoming' ? 'upcoming' : '';

  const { data: eventDetailsData, refetch: getEventDetails } = useEventDetails(
    {
      userInfo,
      isLoggedIn,
      currentEventNames,
      events: eventDetails.events,
      eventType,
      location: location?.uid,
      searchParams,
    },
    eventDetails,
  );

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
    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, [eventDetails]);

  const { data, hasNextPage, fetchNextPage } = useInfiniteGuestsList(
    {
      location: location?.uid,
      currentEventNames,
      searchParams: parseSearchParams(searchParams, eventDetailsData?.events),
    },
    {
      initialData: eventDetailsData,
    },
  );

  const updatedEventDetails = useMemo(() => {
    return { ...eventDetailsData, guests: data.guests, totalGuests: data.totalGuests };
  }, [data.guests, data.totalGuests, eventDetailsData]);

  return (
    <>
      {iamGoingPopupProps?.isOpen && (
        <AttendeeForm
          onClose={onIamGoingPopupClose}
          formData={iamGoingPopupProps?.formdata}
          from={iamGoingPopupProps?.from ?? ''}
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
          <Toolbar
            locationEvents={locationEvents}
            isAdminInAllEvents={isAdminInAllEvents}
            location={location}
            onLogin={onLogin}
            filteredListLength={updatedEventDetails.totalGuests}
            eventDetails={updatedEventDetails}
            userInfo={userInfo}
            isLoggedIn={isLoggedIn}
            followers={props.followers}
          />
        </div>
        <div className="attendeeList__table">
          <div className={`irl__table table__login`}>
            <AttendeeTableHeader isLoggedIn={isLoggedIn} eventDetails={updatedEventDetails} />
            <div ref={tableRef} className={`irl__table__body w-full`} id="irl__table__body">
              <InfiniteScroll scrollableTarget="irl__table__body" loader={<TableLoader />} hasMore={hasNextPage} dataLength={data.guests?.length ?? 0} next={fetchNextPage} scrollThreshold={0.6}>
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
                  newSearchParams={newSearchParams}
                />
              </InfiniteScroll>
            </div>
          </div>
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
            scroll-behavior: smooth;
            scrollbar-width: thin;
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
