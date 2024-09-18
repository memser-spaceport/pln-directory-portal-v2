'use client';

import MonthYearPicker from '@/components/form/month-year-picker';
import { useEffect, useState } from 'react';

interface ArrivalDepatureDateProps {}

const ArrivalAndDepatureDate = (props: any) => {
  const gatherings = props?.allGatherings;
  const dateErrors = props?.errors?.dateErrors;


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

  const onArrivalDateChange = (e: any) => {
    console.log('data is', e.target.value);
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

  return (
    <>
      <div>
        <div className="dtscnt">
          <div className="dtscnt__arvldte">
            <span className="dtscnt__arvldte__ttl">Arrival Date</span>
            <input
              type="date"
              className="details__cn__spl__date__in__field "
              name="checkInDate"
              id="check-in-date"
              autoComplete="off"
              min={arrivalDateDetails.min}
              max={arrivalDateDetails.max}
              onChange={onArrivalDateChange}
              value={arrivalDate}
            />
            {arrivalDate && (
              <button type="button" className="details__cn__spl__date__in__close" onClick={() => onClearDate('checkInDate')}>
                <img src="/icons/close-tags.svg" alt="close" />
              </button>
            )}
            {dateErrors?.checkIn && <div className="error">{dateErrors.checkIn}</div>}
          </div>

          <div className="dtscnt__deprdte">
            <span className="dtscnt__deprdte__ttl">Departure Date</span>
            <input
              type="date"
              className="details__cn__spl__date__out__field"
              name="checkOutDate"
              id="check-out-date"
              autoComplete="off"
              min={depatureDateDetails.min}
              max={depatureDateDetails.max}
              onChange={onDepartureDateChange}
              value={depatureDate}
            />

            {depatureDate && (
              <button type="button" className="details__cn__spl__date__in__close" onClick={() => onClearDate('checkOutDate')}>
                <img src="/icons/close-tags.svg" alt="close" />
              </button>
            )}
            {dateErrors?.checkOut && <div className="error">{dateErrors.checkOut}</div>}
          </div>
        </div>
        {dateErrors?.comparisonError && <div className="error cmperror">{dateErrors.comparisonError}</div>}
      </div>

      <style jsx>{`
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

        .dtscnt {
          display: flex;
          gap: 25px;
          flex-direction: column;
        }

        .dtscnt__arvldte,
        .dtscnt__deprdte {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }

        .dtscnt__arvldte__ttl,
        .dtscnt__deprdte__ttl {
          font-size: 14px;
          font-weight: 700;
          line-height: 20px;
        }

        .details__cn__spl__date__in__field,
        .details__cn__spl__date__out__field {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid lightgrey;
          border-radius: 8px;
          min-height: 40px;
          font-size: 14px;
          font-family: inherit;
          position: relative;
        }

        .details__cn__spl__date__in__field:focus-visible,
        .details__cn__spl__date__in__field:focus,
        .details__cn__spl__date__out__field:focus-visible,
        .details__cn__spl__date__out__field:focus {
          outline: none;
        }

        .details__cn__spl__date__in__close {
          position: absolute;
          right: 35px;
          top: 44px;
          margin: auto;
        }

        .details__cn__spl__date__in__field {
          border: ${dateErrors?.checkIn ? '1px solid #ef4444' : '1px solid lightgrey'};
        }

        .details__cn__spl__date__out__field {
          border: ${dateErrors?.checkOut ? '1px solid #ef4444' : '1px solid lightgrey'};
        }

        @media (min-width: 1024px) {
          .dtscnt {
            flex-direction: row;
          }

          .dtscnt__arvldte,
          .dtscnt__deprdte {
            width: 50%;
          }
        }
      `}</style>
    </>
  );
};

export default ArrivalAndDepatureDate;
