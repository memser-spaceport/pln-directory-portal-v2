export const isPastDate = (date: any) => {
  const currentDate = new Date();
  const inputDate = new Date(date);
  return inputDate.getTime() < currentDate.getTime();
};

export function formatIrlEventDate(startDateStr: string | Date, endDateStr: string | Date, timeZone = 'America/Los_Angeles') {
  const options = { month: 'short', day: 'numeric', timeZone: timeZone };

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const startFormatter = new Intl.DateTimeFormat('en-US', options as any);
  const startFormatted = startFormatter.format(startDate);

  const endMonth = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: timeZone }).format(endDate);
  const endDay = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: timeZone }).format(endDate);
  const endYear = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: timeZone }).format(endDate);

  const startMonth = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: timeZone }).format(startDate);

  let endFormatted;
  if (startMonth === endMonth) {
    endFormatted = endDay;
  } else {
    endFormatted = `${endMonth} ${endDay}`;
  }

  return `${startFormatted}-${endFormatted}, ${endYear}`;
}

export function getFormattedDateString(startDate: string, endDate: string) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
  const [startYear, startMonth, startDay] = startDate.split('-');
  const [endYear, endMonth, endDay] = endDate.split('-');
  
  const startMonthName = monthNames[parseInt(startMonth, 10) - 1];
  const endMonthName = monthNames[parseInt(endMonth, 10) - 1];
  
  if (startMonth === endMonth && startYear === endYear) {
      return `${startMonthName} ${parseInt(startDay, 10)}-${parseInt(endDay, 10)}`;
  } else if (startYear === endYear) {
      return `${startMonthName} ${parseInt(startDay, 10)} - ${endMonthName} ${parseInt(endDay, 10)}`;
  } else {
      return `${startMonthName} ${parseInt(startDay, 10)} - ${endMonthName} ${parseInt(endDay, 10)} '${endYear.slice(2)}`;
  }
}