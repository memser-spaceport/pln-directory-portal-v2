'use client';

import { IIrlAttendeeFormErrors, IIrlEvent, IIrlGathering } from '@/types/irl.types';
import { IRL_ATTENDEE_FORM_ERRORS } from '@/utils/constants';
import { formatDateRangeForDescription } from '@/utils/irl.utils';
import { useEffect, useState } from 'react';

interface IArrivalDepatureDateProps {
  allGatherings: IIrlEvent[];
  errors: IIrlAttendeeFormErrors;
  initialValues: any;
}

const ArrivalAndDepatureDate = (props: IArrivalDepatureDateProps) => {
  const gatherings = props?.allGatherings;
  const dateErrors = props?.errors?.dateErrors;
  const initialValues = props?.initialValues;

  const startAndEndDateInfo = getDateRange();
  const [arrivalDateDetails, setArrivalDateDetails] = useState<any>({
    min: '',
    max: '',
  });

  const [depatureDateDetails, setDepatureDateDetails] = useState<any>({
    min: '',
    max: '',
  });

  const [arrivalDate, setArrivalDate] = useState('');
  const [depatureDate, setDepatureDate] = useState('');

  useEffect(() => {
    try {
      const startDateList = gatherings.map((gathering: IIrlEvent) => gathering.startDate);
      const endDateList = gatherings.map((gathering: IIrlEvent) => gathering.endDate);

      let leastStartDate = startDateList[0];
      let highestEndDate = endDateList[0];

      startDateList?.map((startDate: string) => {
        const date = new Date(startDate);
        if (date < new Date(leastStartDate)) {
          leastStartDate = startDate;
        }
      });

      endDateList?.map((endDate: string) => {
        const date = new Date(endDate);
        if (date > new Date(highestEndDate)) {
          highestEndDate = endDate;
        }
      });

      const fiveDaysBeforeLeastStartDate = new Date(leastStartDate);
      fiveDaysBeforeLeastStartDate.setDate(fiveDaysBeforeLeastStartDate.getDate() - 5);

      const fiveDaysAfterHighestEndDate = new Date(highestEndDate);
      fiveDaysAfterHighestEndDate.setDate(fiveDaysAfterHighestEndDate.getDate() + 5);

      setArrivalDateDetails({
        min: fiveDaysBeforeLeastStartDate.toISOString().split('T')[0],
        max: highestEndDate.split('T')[0],
      });

      setDepatureDateDetails({
        min: leastStartDate.split('T')[0],
        max: fiveDaysAfterHighestEndDate.toISOString().split('T')[0],
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const checkInDate = initialValues?.additionalInfo?.checkInDate;
    const checkOutDate = initialValues?.additionalInfo?.checkOutDate;

    if (checkInDate) {
      setArrivalDate(checkInDate);
    }

    if (checkOutDate) {
      setDepatureDate(checkOutDate);
    }
    if (!initialValues) {
      setArrivalDate('');
      setDepatureDate('');
    }
  }, [initialValues]);

  const onArrivalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArrivalDate(e.target.value);
  };

  const onDepartureDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepatureDate(e.target.value);
  };

  const onClearDate = (dateType: string) => {
    if (dateType === 'checkInDate') {
      setArrivalDate('');
    } else {
      setDepatureDate('');
    }
  };

  function getDateRange() {
    const startDateList = gatherings.map((gathering: IIrlEvent) => gathering.startDate);
    const endDateList = gatherings.map((gathering: IIrlEvent) => gathering.endDate);

    let leastStartDate = startDateList[0];
    let highestEndDate = endDateList[0];

    startDateList?.map((startDate: string) => {
      const date = new Date(startDate);
      if (date < new Date(leastStartDate)) {
        leastStartDate = startDate;
      }
    });

    endDateList?.map((endDate: string) => {
      const date = new Date(endDate);
      if (date > new Date(highestEndDate)) {
        highestEndDate = endDate;
      }
    });

    return formatDateRangeForDescription(leastStartDate, highestEndDate);
  }

  return (
    <>
      <div className="dtscnt">
        <div className="dtscnt__dte">
          <div className="dtscnt__dte__arvldte">
            <span className="dtscnt__dte__arvldte__ttl">Arrival Date</span>
            <input
              type="date"
              className="dtscnt__dte__arvldte__infield "
              name="checkInDate"
              id="check-in-date"
              autoComplete="off"
              min={arrivalDateDetails.min}
              max={arrivalDateDetails.max}
              onChange={onArrivalDateChange}
              value={arrivalDate}
            />
            {arrivalDate && (
              <button type="button" className="dtscnt__dte__deprdte__clse" onClick={() => onClearDate('checkInDate')}>
                <img src="/icons/close-tags.svg" alt="close" />
              </button>
            )}
          </div>

          <div className="dtscnt__dte__deprdte">
            <span className="dtscnt__dte__deprdte__ttl">Departure Date</span>
            <input
              type="date"
              className="dtscnt__dte__deprdte__outfield"
              name="checkOutDate"
              id="check-out-date"
              autoComplete="off"
              min={depatureDateDetails.min}
              max={depatureDateDetails.max}
              onChange={onDepartureDateChange}
              value={depatureDate}
            />

            {depatureDate && (
              <button type="button" className="dtscnt__dte__deprdte__clse" onClick={() => onClearDate('checkOutDate')}>
                <img src="/icons/close-tags.svg" alt="close" />
              </button>
            )}
          </div>
        </div>

        <div className="dtscnt__desc">
          <img src="/icons/info.svg" alt="info" width={16} height={16} />
          <p className="dtscnt__desc__txt">Please note that your arrival and departure dates must fall within five days before or after the official event dates ({startAndEndDateInfo}).</p>
        </div>
      </div>

      <style jsx>{`
        .dtscnt {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        button {
          background: inherit;
        }

        .error {
          font-size: 13px;
          color: #ef4444;
          font-weight: 400;
        }

        .cmperror {
          margin-top: 12px;
        }

        .dtscnt__dte {
          display: flex;
          gap: 25px;
          flex-direction: column;
        }

        .dtscnt__dte__arvldte,
        .dtscnt__dte__deprdte {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }

        .dtscnt__dte__arvldte__ttl,
        .dtscnt__dte__deprdte__ttl {
          font-size: 14px;
          font-weight: 700;
          line-height: 20px;
        }

        .dtscnt__dte__arvldte__infield,
        .dtscnt__dte__deprdte__outfield {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          min-height: 40px;
          font-size: 14px;
          font-family: inherit;
          position: relative;
        }

        .dtscnt__dte__arvldte__infield:focus-visible,
        .dtscnt__dte__arvldte__infield:focus,
        .dtscnt__dte__deprdte__outfield:focus-visible,
        .dtscnt__dte__deprdte__outfield:focus {
          outline: none;
        }

        .dtscnt__dte__deprdte__clse {
          position: absolute;
          right: 35px;
          top: 44px;
          margin: auto;
        }

        .dtscnt__dte__arvldte__infield {
          border: ${dateErrors?.includes(IRL_ATTENDEE_FORM_ERRORS.CHECKIN_DATE_REQUIRED) || dateErrors?.includes(IRL_ATTENDEE_FORM_ERRORS.DATE_DIFFERENCE) ? '1px solid red' : '1px solid lightgrey'};
        }

        .dtscnt__dte__deprdte__outfield {
          border: ${dateErrors?.includes(IRL_ATTENDEE_FORM_ERRORS.CHECKOUT_DATE_REQUIRED) || dateErrors?.includes(IRL_ATTENDEE_FORM_ERRORS.DATE_DIFFERENCE) ? '1px solid red' : '1px solid lightgrey'};
        }

        .dtscnt__desc {
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }

        .dtscnt__desc__txt {
          font-weight: 500;
          font-size: 13px;
          line-height: 18px;
          color: #94a3b8;
        }

        @media (min-width: 1024px) {
          .dtscnt__dte {
            flex-direction: row;
          }

          .dtscnt__dte__arvldte,
          .dtscnt__dte__deprdte {
            width: 50%;
          }
        }
      `}</style>
    </>
  );
};

export default ArrivalAndDepatureDate;
