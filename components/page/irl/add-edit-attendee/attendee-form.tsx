'use client';
import Modal from '@/components/core/modal';
import { FormEvent, useEffect, useRef } from 'react';
import AttendeeTeam from './attendee-team';
import Gatherings from './gatherings';
import { IUserInfo } from '@/types/shared.types';

interface IAttendeeForm {
  attendeeTeams: any;
  selectedTeam: any;
  formdata: any;
  selectedLocation: string;
  gatherings: any[];
  userInfo: IUserInfo;
}

const AttendeeForm = (props: IAttendeeForm) => {
  const ref = useRef<HTMLDialogElement>(null);

  const attendeeTeams = props?.attendeeTeams;
  const selectedTeam = props?.selectedTeam;
  const selectedLocation = props?.selectedLocation;
  const gatherings = props?.gatherings;
  const userInfo = props?.userInfo;

  const attendeeFormRef = useRef<HTMLFormElement>(null);

  const formInitialData = props?.formdata ?? {
    teamUid: '',
    telegramId: '',
    reason: '',
    topics: [],
    officeHours: '',
    additionalInfo: {
      checkInDate: '',
      checkOutDate: '',
    },
  };

  const onModalClose = () => {
    return 'closed';
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.showModal();
    }
  }, []);

  const onFormSubmitHandler = (e: FormEvent) => {
    e.preventDefault();

    if (!attendeeFormRef.current) {
      return;
    }
    const formData = new FormData(attendeeFormRef.current);
    const formattedData = transformObject(Object.fromEntries(formData));
    console.log('formattedData is', formattedData);
  };

  function transformObject(formValues: any) {
    let result: any = {};
    const gatherings: any[] = [];

    for (const key in formValues) {
      if (key.startsWith('gatherings')) {
        const [gathering, subKey] = key.split('-');
        const gatheringIndexMatch = gathering.match(/\d+$/);
        if (gatheringIndexMatch) {
          const gatheringIndex: any = gatheringIndexMatch[0];
          if (!gatherings[gatheringIndex]) {
            gatherings[gatheringIndex] = {};
          }
          if (formValues[key]) {
            gatherings[gatheringIndex][subKey] = formValues[key];
          }
        }
      } else {
        result[key] = formValues[key];
      }
    }

    result = {...result, gatherings};

    return result;
  }

  return (
    <>
      <Modal onClose={onModalClose} modalRef={ref}>
        <form noValidate onSubmit={onFormSubmitHandler} ref={attendeeFormRef} className="atndform">
          <div className="atndform__bdy">
            <h2 className="atndform__bdy__ttl">Enter Attendee Details</h2>
            <AttendeeTeam teams={attendeeTeams} selectedTeam={selectedTeam} />
            <Gatherings selectedLocation={selectedLocation} gatherings={gatherings} userInfo={userInfo}/>
          </div>

          <div className="atndform__optns">
            <div>
              <button type="button">Close</button>

              <button type="submit">Submit</button>
            </div>
          </div>
        </form>
      </Modal>

      <style jsx>
        {`
          .atndform {
            padding: 20px 0 0 0;
            width: 90vw;
            height: 90vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .atndform__bdy {
            flex: 1;
            padding: 0 20px 0 20px;
            overflow: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .atndform__bdy__ttl {
            font-size: 17px;
            font-weight: 600;
          }

          .atndform__optns {
            height: 40px;
          }

          @media (min-width: 1024px) {
            .atndform {
              width: 680px;
            }
          }
        `}
      </style>
    </>
  );
};

export default AttendeeForm;
