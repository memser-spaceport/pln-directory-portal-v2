import { useState } from 'react';

function MonthYearField(props) {
  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const start = currentYear - 50;
    const years = [];
    for (let year = start; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  };
  const initDate = props.initDate;
  const label = props.label ?? '';
  const yearValues = getYears();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const defaultValue = props.defaultValue ?? 'min';
  const defaultYear = defaultValue === 'min' ? yearValues[0] : yearValues[yearValues.length - 1];
  const defaultMonth = defaultValue === 'min' ? 0 : 11;
  const defaultDate = `${defaultMonth}/01/${defaultYear}`;
  const name = props.name;
  const id = props.id;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [isMonthDpActive, setMonthDpStatus] = useState(false);
  const [isYearDpActive, setYearDpStatus] = useState(false);

  const onMonthSelected = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMonth(index);
    setMonthDpStatus(false);
  };

  const onYearSelected = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedYear(yearValues[index]);
    setYearDpStatus(false);
  };

  return (
    <>
      <div className="myf">
        <label className="myf__title">{label}</label>
        <div className="myf__cn">
          <div onClick={() => setMonthDpStatus((v) => !v)} className="myf__cn__dp myf__cn__dp--month">
            <p>{monthNames[selectedMonth]}</p>
            <img width="8" height="8" src="/icons/arrow-down.svg" />
            {isMonthDpActive === true && (
              <div className="myf__cn__dp__pane">
                {monthNames.map((monthName, monthIndex) => (
                  <div
                    onClick={(e) => onMonthSelected(e, monthIndex)}
                    className={`myf__cn__dp__pane__item ${selectedMonth === monthIndex ? 'myf__cn__dp__pane__item--active' : ''}`}
                    key={`month-year${monthIndex}`}
                  >
                    <p>{monthName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div onClick={() => setYearDpStatus((v) => !v)} className="myf__cn__dp myf__cn__dp--year">
            <p>{`${selectedYear}`}</p>
            <img width="8" height="8" src="/icons/arrow-down.svg" />
            {isYearDpActive === true && (
              <div className="myf__cn__dp__pane">
                {yearValues.map((yearValue, yearIndex) => (
                  <div
                    onClick={(e) => onYearSelected(e, yearIndex)}
                    className={`myf__cn__dp__pane__item ${selectedYear === yearValues[yearIndex] ? 'myf__cn__dp__pane__item--active' : ''}`}
                    key={`month-year${yearIndex}`}
                  >
                    <p>{yearValue}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .myf {
          }
          .myf__cn {
            display: flex;
            gap: 8px;
             margin-top: 12px;
          }
          .myf__title {
            font-weight: 600;
            font-size: 14px;
           
          }
          .myf__cn__dp {
            padding: 8px 12px;
            border: 1px solid grey;
            font-size: 14px;
            cursor: pointer;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            justify-content: center;
            align-items: center;
            position: relative;
          }

          .myf__cn__dp--month {
            width: 115px;
          }
          .myf__cn__dp--year {
            width: 80px;
          }
          .myf__cn__dp__pane {
            padding: 8px;
            border: 1px solid grey;
            height: 100px;
            position: absolute;
            bottom: -102px;
            background: white;
            font-size: 12px;
            left: 0;
            right: 0;
            overflow-y: auto;
            overflow-x: hidden;
          }
          .myf__cn__dp__pane__item {
            padding: 8px;
            color: black;
            border-radius: 2px;
            background: white;
          }
          .myf__cn__dp__pane__item--active {
            color: white;
            background: #156ff7;
          }
          .myf__cn__dp__pane__item__text {
          }
        `}
      </style>
    </>
  );
}

export default MonthYearField;
