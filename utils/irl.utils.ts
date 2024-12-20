import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE, URL_QUERY_VALUE_SEPARATOR } from './constants';
import { format, toZonedTime } from 'date-fns-tz';
import { isSameDay } from 'date-fns';

export const isPastDate = (date: any) => {
  const currentDate = new Date();
  const inputDate = new Date(date);
  return inputDate.getTime() < currentDate.getTime();
};

export function formatIrlEventDate(startDateStr: string | Date, endDateStr: string | Date, timeZone = 'America/Los_Angeles') {
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

export function getFormattedDateString(startDate: string, endDate: string) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  try {
    const [startDateOnly] = startDate.split('T');
    const [endDateOnly] = endDate.split('T');

    const [startYear, startMonth, startDay] = startDateOnly.split('-');
    const [endYear, endMonth, endDay] = endDateOnly.split('-');

    const startMonthName = monthNames[parseInt(startMonth, 10) - 1];
    const endMonthName = monthNames[parseInt(endMonth, 10) - 1];

    if (startDateOnly === endDateOnly) {
      return `${startMonthName} ${parseInt(startDay, 10)}`;
    } else if (startMonth === endMonth && startYear === endYear) {
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

export function sortPastEvents(events: any[]) {
  // Sort the events array
  events.sort((a: any, b: any) => {
    // Compare by start date (latest start first)
    const startDateComparison = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();

    if (startDateComparison !== 0) {
      return startDateComparison;
    }

    // If start dates are equal, compare by duration (shorter duration first)
    const durationA = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
    const durationB = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();

    return durationA - durationB;
  });

  // Use forEach to perform actions on each sorted event
  events.forEach((event: any) => {
    // Perform any additional actions needed for each event
    // Example: log the event or perform some processing
  });

  return events; // Return the sorted array if needed
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
        uid: event?.uid || '',
        name: event?.name || '',
        startDate: event?.startDate || '',
        endDate: event?.endDate || '',
        logo: event?.logo?.url || '',
        isHost: event?.isHost || false,
        isSpeaker: event?.isSpeaker || false,
        hostSubEvents: event?.additionalInfo?.hostSubEvents || [],
        speakerSubEvents: event?.additionalInfo?.speakerSubEvents || [],
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

  // Handle attending names if present
  if (attending) {
    const attendingNames = attending.split(URL_QUERY_VALUE_SEPARATOR).map((name: string) => name.trim());
    const matchingUIDs = currentEvents.filter((event: any) => attendingNames.includes(event.name)).map((event: any) => event.uid);

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
      } else if (name === 'speakers') {
        isHost = false;
        isSpeaker = true;
      } else if (name === 'hostsAndSpeakers') {
        isHost = true;
        isSpeaker = true;
      }
    });
  }

  if (topics) {
    const topicNames = topics.split(URL_QUERY_VALUE_SEPARATOR).map((name: string) => name.trim());

    topicNames?.forEach((topic: string) => {
      result['topics[]']?.push(topic);
    });
  }

  if (isHost || isSpeaker) {
    result.isHost = isHost;
    result.isSpeaker = isSpeaker;
  }

  return result;
};

export const getFilteredEventsForUser = (loggedInUserEvents: any, currentEvents: any, isLoggedIn: boolean, userInfo: IUserInfo) => {
  const uniqueEventsMap = new Map();

  // Determine if the user has the admin role
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const publicEvents = currentEvents.filter((event: any) => event.type !== 'INVITE_ONLY');

  // Combine events based on the user's login and role status
  const eventsToConsider = isLoggedIn ? (isAdmin ? currentEvents : [...loggedInUserEvents, ...publicEvents]) : publicEvents;

  eventsToConsider.forEach((event: any) => {
    if (!uniqueEventsMap.has(event.uid)) {
      uniqueEventsMap.set(event.uid, event);
    }
  });

  const filteredEvents = Array.from(uniqueEventsMap.values())?.filter((event) => event._count && event._count.eventGuests > 0);

  // Convert the map values to an array for the final unique events list
  return filteredEvents;
};

export const transformGuestDetail = (result: any, gatherings:any) => {
  const detail = result[0] || {};
  const gatheringsToShow = result?.filter((gathering:any) => (gatherings?.some((guest: any) => guest?.slugURL === gathering.event?.slugURL)));
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
      uid: item?.event?.uid,
      name: item?.event?.name,
      startDate: item?.event?.startDate,
      endDate: item?.event?.endDate,
      logo: item?.event?.logo?.url,
      isHost: item?.isHost,
      isSpeaker: item?.isSpeaker,
      hostSubEvents: item?.additionalInfo?.hostSubEvents,
      speakerSubEvents: item?.additionalInfo?.speakerSubEvents,
      type: item?.event?.type,
      resources: item?.event?.resources,
    })),
    topics: detail?.topics,
    officeHours: detail?.member?.officeHours,
    telegramId: detail?.member?.telegramHandler || '',
    reason: detail?.reason,
    additionalInfo: detail?.additionalInfo,
    count: detail?.count,
  };
};

export function checkAdminInAllEvents(searchType: any, upcomingEvents: any, pastEvents: any) {
  if (searchType === 'upcoming' || (upcomingEvents && upcomingEvents.length > 0 && pastEvents && pastEvents.length === 0)) {
    return true;
  } else if (searchType === 'past' || (pastEvents && pastEvents.length > 0 && upcomingEvents && upcomingEvents.length === 0)) {
    return true;
  }
  return false;
}

export function sortEventsByDate(member:any) {
  const now = new Date().toISOString(); // Current time in UTC ISO format

  return [...member]?.sort((a, b) => {
    const startA = a.event.startDate;
    const endA = a.event.endDate;
    const startB = b.event.startDate;
    const endB = b.event.endDate;

    // Determine category for event A
    const categoryA = startA > now ? 0 : (startA <= now && endA >= now) ? 1 : 2;
    // Determine category for event B
    const categoryB = startB > now ? 0 : (startB <= now && endB >= now) ? 1 : 2;

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
  // Create a Map for `formattedEvents` for quick lookup by `uid`
  const formattedEventsMap = new Map(formattedEvents.map((event:any) => [event.uid, event]));

  // Replace events in `userAlreadyGoingEvents` if there's a match in `formattedEvents`
  const mergedEvents = userAlreadyGoingEvents.map((event:any) => {
    return formattedEventsMap.get(event.uid) || event;
  });

  // Add non-matching events from `formattedEvents` to the result
  const userAlreadyGoingUids = new Set(userAlreadyGoingEvents.map((event:any) => event.uid));
  const nonOverlappingFormattedEvents = formattedEvents.filter(
    (event:any) => !userAlreadyGoingUids.has(event.uid)
  );

  // Combine the results
  return [...mergedEvents, ...nonOverlappingFormattedEvents];
}