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

export const sortByDefault = (guests:any) => {
  const guestsWithReasonAndTopics:any = [] ;
  const guestsWithReason:any = [];
  const guestsWithTopics:any = [];
  const remaining:any = [];

  guests?.forEach((guest:any) => {
    if (guest?.reason?.trim() && guest?.topics?.length > 0) {
      guestsWithReasonAndTopics.push(guest);
    } else if (guest?.reason?.trim() && guest?.topics?.length === 0) {
      guestsWithReason.push(guest);
    } else if (!guest?.reason?.trim() && guest?.topics?.length > 0) {
      guestsWithTopics.push(guest);
    } else {
      remaining.push(guest);
    }
  });

  guestsWithReasonAndTopics?.sort((a:any, b:any) => a.memberName?.localeCompare(b?.memberName));
  guestsWithReason?.sort((a:any, b:any) => a.memberName?.localeCompare(b?.memberName));
  guestsWithTopics?.sort((a:any, b:any) => a.memberName?.localeCompare(b?.memberName));
  remaining?.sort((a:any, b:any) => a.memberName?.localeCompare(b?.memberName));

  const combinedList = [...guestsWithReasonAndTopics, ...guestsWithTopics, ...guestsWithReason, ...remaining];

  return combinedList;
};
