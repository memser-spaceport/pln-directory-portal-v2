import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE, URL_QUERY_VALUE_SEPARATOR } from './constants';
import { format, toZonedTime } from 'date-fns-tz';
import { isSameDay } from 'date-fns';
import { CalendarDate, EventDuration } from '@/types/irl.types';

export const isPastDate = (date: any) => {
  const currentDate = new Date();
  const inputDate = new Date(date);
  return inputDate.getTime() < currentDate.getTime();
};

export function formatIrlEventDate(
  startDateStr: string | Date,
  endDateStr: string | Date,
  timeZone = 'America/Los_Angeles',
) {
  const startDate = toZonedTime(startDateStr, timeZone);
  const endDate = toZonedTime(endDateStr, timeZone);

  if (isSameDay(startDate, endDate)) {
    return format(startDate, 'MMM d, yyyy', { timeZone });
  }

  // Format the start date and end date
  const startFormatted = format(startDate, 'MMM d', { timeZone });
  const endFormatted = format(endDate, 'd, yyyy', { timeZone });

  // Combine the range into the desired format
  return `${startFormatted}-${endFormatted}`;
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

export function getFormattedDateString(startDate: string, endDate: string, showStartYear?: boolean) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  try {
    const [startDateOnly] = startDate.split('T');
    const [endDateOnly] = endDate.split('T');

    const [startYear, startMonth, startDay] = startDateOnly.split('-');
    const [endYear, endMonth, endDay] = endDateOnly.split('-');

    const startMonthName = monthNames[parseInt(startMonth, 10) - 1];
    const endMonthName = monthNames[parseInt(endMonth, 10) - 1];

    if (startDateOnly === endDateOnly) {
      return `${startMonthName} ${parseInt(startDay, 10)} '${endYear.slice(2)}`;
    } else if (startMonth === endMonth && startYear === endYear) {
      return `${startMonthName} ${parseInt(startDay, 10)}-${parseInt(endDay, 10)} '${endYear.slice(2)}`;
    } else if (startYear === endYear) {
      return `${startMonthName} ${parseInt(startDay, 10)} - ${endMonthName} ${parseInt(endDay, 10)} '${endYear.slice(2)}`;
    } else {
      if (showStartYear) {
        return `${startMonthName} ${parseInt(startDay, 10)} '${startYear.slice(2)} - ${endMonthName} ${parseInt(endDay, 10)} '${endYear.slice(2)}`;
      } else {
        return `${startMonthName} ${parseInt(startDay, 10)} '${startYear.slice(2)} - ${endMonthName} ${parseInt(endDay, 10)} '${endYear.slice(2)}`;
      }
    }
  } catch {
    return '';
  }
}

function getDayWithSuffix(day: number) {
  if (day > 3 && day < 21) return day + 'th';
  switch (day % 10) {
    case 1:
      return day + 'st';
    case 2:
      return day + 'nd';
    case 3:
      return day + 'rd';
    default:
      return day + 'th';
  }
}

export function formatDateRangeForDescription(startDate: any, endDate: any) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  try {
    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');

    const startMonthName = monthNames[parseInt(startMonth, 10) - 1];
    const endMonthName = monthNames[parseInt(endMonth, 10) - 1];

    const startDayWithSuffix = getDayWithSuffix(parseInt(startDay, 10));
    const endDayWithSuffix = getDayWithSuffix(parseInt(endDay, 10));

    // Format the final string with month and day suffixes
    const startFormattedWithSuffix = `${startMonthName} ${startDayWithSuffix}`;
    const endFormattedWithSuffix = `${endMonthName} ${endDayWithSuffix}`;

    if (startYear === endYear) {
      return `${startFormattedWithSuffix} - ${endFormattedWithSuffix}`;
    } else {
      return `${startFormattedWithSuffix} - ${endFormattedWithSuffix}, ${endYear}`;
    }
  } catch (e) {
    return '';
  }
}
export const getAttendingStartAndEndDate = (events: any) => {
  if (events.length === 0) {
    return { checkInDate: null, checkOutDate: null };
  }

  const checkInDate = events.reduce(
    (earliest: string | number | Date, event: { checkInDate: string | number | Date }) =>
      !earliest || new Date(event.checkInDate) < new Date(earliest) ? event.checkInDate : earliest,
    events[0].checkInDate,
  );

  const checkOutDate = events.reduce(
    (latest: string | number | Date, event: { checkOutDate: string | number | Date }) =>
      !latest || new Date(event.checkOutDate) > new Date(latest) ? event.checkOutDate : latest,
    events[0].checkOutDate,
  );

  return { checkInDate, checkOutDate };
};

export function sortEvents(events: any[], type: 'past' | 'upcoming' | 'all' = 'all'): any[] {
  if (!events || events.length === 0) return [];

  const currentDate = new Date().toISOString().split('T')[0];

  return [...events].sort((eventA, eventB) => {
    // First: Sort by priority (null priorities go to the end)
    if ((eventA.priority !== null || eventB.priority !== null) && eventA.priority !== eventB.priority) {
      if (eventA.priority === null) return 1;
      if (eventB.priority === null) return -1;
      return eventA.priority - eventB.priority;
    }

    // Extract dates (handle both ISO strings and date objects)
    const getDateString = (date: any) => {
      if (typeof date === 'string') return date.split('T')[0];
      return date.toISOString().split('T')[0];
    };

    const eventAStartDate = getDateString(eventA.startDate);
    const eventAEndDate = getDateString(eventA.endDate);
    const eventBStartDate = getDateString(eventB.startDate);
    const eventBEndDate = getDateString(eventB.endDate);

    // Determine event status
    const isEventAPast = eventAEndDate < currentDate;
    const isEventBPast = eventBEndDate < currentDate;
    const isEventAOngoing = eventAStartDate <= currentDate && eventAEndDate >= currentDate;
    const isEventBOngoing = eventBStartDate <= currentDate && eventBEndDate >= currentDate;

    // Handle different sorting types
    if (type === 'past') {
      // For past events: sort by end date (most recent first)
      return eventBEndDate.localeCompare(eventAEndDate);
    }

    if (type === 'upcoming') {
      // Ongoing events come first
      if (isEventAOngoing && !isEventBOngoing) return -1;
      if (!isEventAOngoing && isEventBOngoing) return 1;

      // Then sort by start date (earliest first)
      return eventAStartDate.localeCompare(eventBStartDate);
    }

    // For 'all' type: upcoming first, then past
    if (!isEventAPast && isEventBPast) return -1;
    if (isEventAPast && !isEventBPast) return 1;

    // If both are upcoming
    if (!isEventAPast && !isEventBPast) {
      // Ongoing events come first
      if (isEventAOngoing && !isEventBOngoing) return -1;
      if (!isEventAOngoing && isEventBOngoing) return 1;

      // Then sort by start date (earliest first)
      return eventAStartDate.localeCompare(eventBStartDate);
    }

    // If both are past, sort by end date (most recent first)
    return eventBEndDate.localeCompare(eventAEndDate);
  });
}

export const transformMembers = (result: any, currentEvents: string[]) => {
  if (!Array.isArray(result)) return []; // Return empty array if result is not iterable

  return result.map((guest: any) => {
    const { member, team, events } = guest || {};
    const memberTeams = member?.teamMemberRoles || [];
    const validEvents = events?.filter((event: any) => currentEvents.includes(event?.name));

    return {
      memberUid: guest?.memberUid,
      memberName: member?.name,
      memberLogo: member?.image?.url || '',
      teamUid: guest?.teamUid,
      teamName: team?.name,
      teamLogo: team?.logo?.url || '',
      teams: memberTeams.map((tm: any) => ({
        name: tm?.team?.name || '',
        id: tm?.team?.uid || '',
        logo: tm?.team?.logo?.url || '',
      })),
      eventNames: validEvents.map((event: any) => event?.name),
      events: validEvents.map((event: any) => ({
        slugURL: event?.slugURL || '',
        uid: event?.uid || '',
        name: event?.name || '',
        startDate: event?.startDate || '',
        endDate: event?.endDate || '',
        logo: event?.logo?.url || '',
        isHost: event?.isHost || false,
        isSpeaker: event?.isSpeaker || false,
        isSponsor: event?.isSponsor || false,
        hostSubEvents: event?.additionalInfo?.hostSubEvents || [],
        speakerSubEvents: event?.additionalInfo?.speakerSubEvents || [],
        sponsorSubEvents: event?.additionalInfo?.sponsorSubEvents || [],
        checkInDate: event?.additionalInfo?.checkInDate || '',
        checkOutDate: event?.additionalInfo?.checkOutDate || '',
        type: event?.type || '',
        resources: event?.resources || [],
      })),
      topics: guest?.topics || [],
      officeHours: member?.officeHours || '',
      telegramId: member?.telegramHandler || '',
      reason: guest?.reason || '',
      additionalInfo: guest?.additionalInfo || {},
      count: guest?.count || 0,
    };
  });
};

export const parseSearchParams = (searchParams: any, currentEvents: any[]) => {
  const { type, sortDirection, sortBy, search, attending, attendees, topics, event } = searchParams;
  const result: any = {};

  result.type = type === 'past' ? 'past' : type === 'upcoming' ? 'upcoming' : '';

  result.sortDirection = sortDirection ?? '';
  result.sortBy = sortBy ?? '';
  result.search = search ?? '';
  result.slugURL = searchParams?.event ?? '';

  // Initialize 'filteredEvents[]' as an array
  result['filteredEvents[]'] = [];
  result['topics[]'] = [];

  let isHost = false;
  let isSpeaker = false;
  let isSponsor = false;

  // Handle attending names if present
  if (attending) {
    const attendingNames = attending.split(URL_QUERY_VALUE_SEPARATOR).map((name: string) => name.trim());
    const matchingUIDs = currentEvents
      .filter((event: any) => attendingNames.includes(event.name))
      .map((event: any) => event.uid);

    // Push matching UIDs into the 'filteredEvents[]' array
    matchingUIDs.forEach((uid) => {
      result['filteredEvents[]'].push(uid);
    });
  }

  if (event) {
    const matchingEvent = currentEvents.find((event: any) => event.slugURL === searchParams?.event);
    result['filteredEvents[]'].push(matchingEvent?.uid);
  }

  if (attendees) {
    const attendeeTypes = attendees.split(URL_QUERY_VALUE_SEPARATOR).map((name: string) => name.trim());

    attendeeTypes.forEach((name: string) => {
      if (name === 'hosts') {
        isHost = true;
        isSpeaker = false;
        isSponsor = false;
      } else if (name === 'speakers') {
        isHost = false;
        isSpeaker = true;
        isSponsor = false;
      } else if (name === 'sponsors') {
        isHost = false;
        isSpeaker = false;
        isSponsor = true;
      } else if (name === 'hostsAndSpeakersAndSponsors') {
        isHost = true;
        isSpeaker = true;
        isSponsor = true;
      }
    });
  }

  if (topics) {
    const topicNames = topics.split(URL_QUERY_VALUE_SEPARATOR).map((name: string) => name.trim());

    topicNames?.forEach((topic: string) => {
      result['topics[]']?.push(topic);
    });
  }

  if (isHost || isSpeaker || isSponsor) {
    result.isHost = isHost;
    result.isSpeaker = isSpeaker;
    result.isSponsor = isSponsor;
  }

  return result;
};

export const getFilteredEventsForUser = (
  loggedInUserEvents: any,
  currentEvents: any,
  isLoggedIn: boolean,
  userInfo: IUserInfo,
) => {
  const uniqueEventsMap = new Map();

  // Determine if the user has the admin role
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const publicEvents = currentEvents.filter((event: any) => event.type !== 'INVITE_ONLY');

  // Combine events based on the user's login and role status
  const eventsToConsider = isLoggedIn
    ? isAdmin
      ? currentEvents
      : [...loggedInUserEvents, ...publicEvents]
    : publicEvents;

  eventsToConsider.forEach((event: any) => {
    if (!uniqueEventsMap.has(event.uid)) {
      uniqueEventsMap.set(event.uid, event);
    }
  });

  const filteredEvents = Array.from(uniqueEventsMap.values())?.filter(
    (event) => event.eventGuests && event.eventGuests?.length > 0,
  );

  // Convert the map values to an array for the final unique events list
  return filteredEvents;
};

export const transformGuestDetail = (result: any, gatherings: any) => {
  const detail = result[0] || {};
  const gatheringsToShow = result?.filter((gathering: any) =>
    gatherings?.some((guest: any) => guest?.slugURL === gathering.event?.slugURL),
  );
  return {
    memberUid: detail?.memberUid,
    memberName: detail?.member?.name,
    memberLogo: detail?.member?.image?.url,
    teamUid: detail?.teamUid,
    teamName: detail?.team?.name,
    teamLogo: detail?.team?.logo?.url || '',
    teams: detail?.member?.teamMemberRoles?.map((tm: any) => ({
      name: tm?.team?.name,
      id: tm?.team?.uid,
      logo: tm?.team?.logo?.url ?? '',
    })),
    eventNames: result?.map((item: any) => item?.event?.name),
    events: gatheringsToShow?.map((item: any) => ({
      slugURL: item?.slugURL || '',
      uid: item?.event?.uid || '',
      name: item?.event?.name || '',
      startDate: item?.event?.startDate || '',
      endDate: item?.event?.endDate || '',
      logo: item?.event?.logo?.url || '',
      isHost: item?.isHost || false,
      isSpeaker: item?.isSpeaker || false,
      isSponsor: item?.isSponsor || false,
      hostSubEvents: item?.additionalInfo?.hostSubEvents || [],
      speakerSubEvents: item?.additionalInfo?.speakerSubEvents || [],
      sponsorSubEvents: item?.additionalInfo?.sponsorSubEvents || [],
      checkInDate: item?.additionalInfo?.checkInDate || '',
      checkOutDate: item?.additionalInfo?.checkOutDate || '',
      type: item?.event?.type || '',
      resources: item?.event?.resources || [],
    })),
    topics: detail?.topics || [],
    officeHours: detail?.member?.officeHours || '',
    telegramId: detail?.member?.telegramHandler || '',
    reason: detail?.reason || '',
    additionalInfo: detail?.additionalInfo || {},
    count: detail?.count || 0,
  };
};
export function checkAdminInAllEvents(searchType: any, upcomingEvents: any, pastEvents: any) {
  if (
    searchType === 'upcoming' ||
    (upcomingEvents && upcomingEvents.length > 0 && pastEvents && pastEvents.length === 0)
  ) {
    return true;
  } else if (
    searchType === 'past' ||
    (pastEvents && pastEvents.length > 0 && upcomingEvents && upcomingEvents.length === 0)
  ) {
    return true;
  }
  return false;
}

export function sortEventsByDate(member: any) {
  const now = new Date().toISOString(); // Current time in UTC ISO format

  return [...member]?.sort((a, b) => {
    const startA = a.event.startDate;
    const endA = a.event.endDate;
    const startB = b.event.startDate;
    const endB = b.event.endDate;

    // Determine category for event A
    const categoryA = startA > now ? 0 : startA <= now && endA >= now ? 1 : 2;
    // Determine category for event B
    const categoryB = startB > now ? 0 : startB <= now && endB >= now ? 1 : 2;

    // Sort by category first (0: upcoming, 1: ongoing, 2: completed)
    if (categoryA !== categoryB) return categoryA - categoryB;

    // If in the same category, sort by start date in descending order (ISO strings compare lexicographically)
    if (startA !== startB) return startB.localeCompare(startA);

    // If start dates are the same, sort by duration (longer events first)
    const durationA = Date.parse(endA) - Date.parse(startA);
    const durationB = Date.parse(endB) - Date.parse(startB);
    return durationB - durationA; // Longer duration first
  });
}

// combine guest going events and new events(if any event matches with the new events will replace the events in going events)
export function mergeGuestEvents(userAlreadyGoingEvents: any, formattedEvents: any) {
  return formattedEvents;
  // Create a Map for `formattedEvents` for quick lookup by `uid`
  // const formattedEventsMap = new Map(formattedEvents.map((event:any) => [event.uid, event]));

  // // Replace events in `userAlreadyGoingEvents` if there's a match in `formattedEvents`
  // const mergedEvents = userAlreadyGoingEvents.map((event:any) => {
  //   return formattedEventsMap.get(event.uid) || event;
  // });

  // // Add non-matching events from `formattedEvents` to the result
  // const userAlreadyGoingUids = new Set(userAlreadyGoingEvents.map((event:any) => event.uid));
  // const nonOverlappingFormattedEvents = formattedEvents.filter(
  //   (event:any) => !userAlreadyGoingUids.has(event.uid)
  // );

  // // Combine the results
  // return [...mergedEvents, ...nonOverlappingFormattedEvents];
}

export function abbreviateString(inputString: string) {
  const words = inputString.split(' ');
  if (words.length === 1) {
    return inputString;
  } else {
    return words.map((word: any) => word[0].toLowerCase()).join('');
  }
}

export function formatHtml(html: string) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '');
}

export function parseDateString(dateString: string): CalendarDate {
  const [dateOnly] = dateString.split('T');
  const [year, month, day] = dateOnly.split('-').map(Number);
  return { year, month, day };
}

export function getEventDates(event: any): EventDuration {
  return {
    startDate: parseDateString(event.startDate),
    endDate: parseDateString(event.endDate),
  };
}

export function compareDates(date1: CalendarDate, date2: CalendarDate): number {
  if (date1.year !== date2.year) return date1.year - date2.year;
  if (date1.month !== date2.month) return date1.month - date2.month;
  return date1.day - date2.day;
}

export function isDateBefore(date1: CalendarDate, date2: CalendarDate): boolean {
  return compareDates(date1, date2) < 0;
}

export function isDateAfter(date1: CalendarDate, date2: CalendarDate): boolean {
  return compareDates(date1, date2) > 0;
}

export function isDateEqual(date1: CalendarDate, date2: CalendarDate): boolean {
  return compareDates(date1, date2) === 0;
}

export function isDateBeforeOrEqual(date1: CalendarDate, date2: CalendarDate): boolean {
  return compareDates(date1, date2) <= 0;
}

export function isDateAfterOrEqual(date1: CalendarDate, date2: CalendarDate): boolean {
  return compareDates(date1, date2) >= 0;
}

export function comparePriority(eventA: any, eventB: any): number {
  if ((eventA.priority !== null || eventB.priority !== null) && eventA.priority !== eventB.priority) {
    if (eventA.priority === null) return 1;
    if (eventB.priority === null) return -1;
    return eventA.priority - eventB.priority;
  }
  return 0;
}

export function getEventStatus(event: any, today: CalendarDate) {
  const { startDate, endDate } = getEventDates(event);
  const isUpcoming = isDateAfterOrEqual(endDate, today);
  const isPast = isDateBefore(endDate, today);
  return { isUpcoming, isPast };
}

export function compareEventDates(eventA: any, eventB: any, type: 'upcoming' | 'past'): number {
  const { startDate: startA, endDate: endA } = getEventDates(eventA);
  const { startDate: startB, endDate: endB } = getEventDates(eventB);

  switch (type) {
    case 'upcoming':
      // For upcoming events (including current), sort by start date (ascending)
      const startDateComparison = compareDates(startA, startB);
      if (startDateComparison !== 0) return startDateComparison;
      // If start dates are same, sort by end date
      return compareDates(endA, endB);
    case 'past':
      // For past events, sort by end date (descending)
      return compareDates(endB, endA);
    default:
      return 0;
  }
}
