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

// Common function to check user access

export function canUserPerformEditAction(roles: string[], allowedRoles: string[]): boolean {
  return roles?.some((role: string) => allowedRoles.includes(role)) ?? false;
}

export const getUniqueEvents = (events: any) => {
  const allEvents = events?.map((event: any) => event?.name);
  const uniqueTopics = Array.from(new Set(allEvents));
  return uniqueTopics;
};

// Get topics from guests
export const getTopics = (guests: any) => {
  const allTopics = guests?.reduce((acc: any[], guest: any) => {
    const topics = guest?.topics;
    if (topics) {
      return acc.concat(topics);
    }
    return acc;
  }, []);

  const uniqueTopics = Array.from(new Set([...allTopics]));

  return uniqueTopics;
};

// sort by default
export const sortByDefault = (guests: any) => {
  const guestsWithReasonAndTopics: any = [];
  const guestsWithReason: any = [];
  const guestsWithTopics: any = [];
  const remaining: any = [];

  guests?.forEach((guest: any) => {
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

  guestsWithReasonAndTopics?.sort((a: any, b: any) => a.memberName?.localeCompare(b?.memberName));
  guestsWithReason?.sort((a: any, b: any) => a.memberName?.localeCompare(b?.memberName));
  guestsWithTopics?.sort((a: any, b: any) => a.memberName?.localeCompare(b?.memberName));
  remaining?.sort((a: any, b: any) => a.memberName?.localeCompare(b?.memberName));

  const combinedList = [...guestsWithReasonAndTopics, ...guestsWithTopics, ...guestsWithReason, ...remaining];

  return combinedList;
};

const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

const getMonthName = (monthNumber: number) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthNames[monthNumber - 1];
};

//remove the @ symbol from telegram
export function removeAt(text: string) {
  const textToBeModified = text?.trim();
  const modifiedText = textToBeModified?.replace(/\B@/g, '');
  return modifiedText;
}

export function getTelegramUsername(input: string) {
  const regex = /(?:https?:\/\/)?(?:www\.)?t(?:elegram)?\.me\/([a-zA-Z0-9_]+)/;
  const match = input?.match(regex);
  return match ? match[1] : input;
}

export function getFormattedDateString(startDate: string, endDate: string) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  try {
    const [startDateOnly] = startDate.split('T');
    const [endDateOnly] = endDate.split('T');

    const [startYear, startMonth, startDay] = startDateOnly.split('-');
    const [endYear, endMonth, endDay] = endDateOnly.split('-');

    const startMonthName = monthNames[parseInt(startMonth, 10) - 1];
    const endMonthName = monthNames[parseInt(endMonth, 10) - 1];

    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonthName} ${parseInt(startDay, 10)}-${parseInt(endDay, 10)}`;
    } else if (startYear === endYear) {
      return `${startMonthName} ${parseInt(startDay, 10)} - ${endMonthName} ${parseInt(endDay, 10)}`;
    } else {
      return `${startMonthName} ${parseInt(startDay, 10)} - ${endMonthName} ${parseInt(endDay, 10)} '${endYear.slice(2)}`;
    }
  } catch {
    return '';
  }
}
