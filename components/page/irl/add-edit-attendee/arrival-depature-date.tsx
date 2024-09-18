'use client';

import { formatDateRangeForDescription } from '@/utils/irl.utils';
import { useEffect, useState } from 'react';

interface ArrivalDepatureDateProps {}

const ArrivalAndDepatureDate = (props: any) => {
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
    const startDateList = gatherings.map((gathering: any) => gathering.startDate);
    const endDateList = gatherings.map((gathering: any) => gathering.endDate);
    const leastStartDate = startDateList.reduce((minDate: any, currentDate: any) => {
      if (currentDate < minDate) {
        return currentDate;
      }
      return minDate;
    });

    const highestEndDate = endDateList.reduce((maxDate: any, currentDate: any) => {
      if (currentDate > maxDate) {
        return currentDate;
      }
      return maxDate;
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

  const onArrivalDateChange = (e: any) => {
    setArrivalDate(e.target.value);
  };

  const onDepartureDateChange = (e: any) => {
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
    const startDateList = gatherings.map((gathering: any) => gathering.startDate);
    const endDateList = gatherings.map((gathering: any) => gathering.endDate);
    const leastStartDate = startDateList.reduce((minDate: any, currentDate: any) => {
      if (currentDate < minDate) {
        return currentDate;
      }
      return minDate;
    });

    const highestEndDate = endDateList.reduce((maxDate: any, currentDate: any) => {
      if (currentDate > maxDate) {
        return currentDate;
      }
      return maxDate;
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
          border: 1px solid lightgrey;
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
          border: ${dateErrors?.checkIn ? '1px solid #ef4444' : '1px solid lightgrey'};
        }

        .dtscnt__dte__deprdte__outfield {
          border: ${dateErrors?.checkOut ? '1px solid #ef4444' : '1px solid lightgrey'};
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
