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

export const processGuests = (guests: any[], userInfo: any) => {
  const currentUserEntries = guests?.filter((guest: any) => guest?.memberUid === userInfo?.uid);
  const inviteOnlyEvents = currentUserEntries?.filter((entry: any) => entry?.event?.type === 'INVITE_ONLY').map((entry: any) => entry?.event?.uid);

  const inviteOnlyEventMembers = guests?.filter((r: any) => r?.event?.type === 'INVITE_ONLY' && inviteOnlyEvents.includes(r?.event?.uid));
  const publicEventMembers = guests?.filter((r: any) => r.event?.type !== 'INVITE_ONLY');

  return [...inviteOnlyEventMembers, ...publicEventMembers];
};


export const groupMembers = (events: any) => {
  const groupedMembers: any = {};
  events?.forEach((event: any) => {
    if (!groupedMembers[event.memberUid]) {
      groupedMembers[event.memberUid] = [];
    }
    groupedMembers[event.memberUid].push(event);
  });

  return groupedMembers;
};

export const transformMembers = (groupedMembers: any) => {
  return Object.keys(groupedMembers)?.map((memberUid) => ({
    memberUid,
    memberName: groupedMembers[memberUid][0]?.member?.name,
    memberLogo: groupedMembers[memberUid][0]?.member?.image?.url,
    teamUid: groupedMembers[memberUid][0]?.teamUid,
    teamName: groupedMembers[memberUid][0]?.team?.name,
    teamLogo: groupedMembers[memberUid][0]?.team?.logo?.url,
    teams: groupedMembers[memberUid][0]?.member?.teamMemberRoles?.map((tm: any) => ({
      name: tm?.team?.name,
      id: tm?.team?.uid,
      role: tm?.role,
      logo: tm?.team?.logo?.url ?? '',
    })),
    projectContributions: groupedMembers[memberUid][0]?.member?.projectContributions?.filter((pc: any) => !pc?.project?.isDeleted)?.map((item: any) => item?.project?.name),
    eventNames: groupedMembers[memberUid].map((member: any) => member?.event?.name),
    events: groupedMembers[memberUid].map((member: any) => ({
      uid: member?.event?.uid,
      name: member?.event?.name,
      startDate: member?.event?.startDate,
      endDate: member?.event?.endDate,
      logo: member?.event?.logo?.url,
      isHost: member?.isHost,
      isSpeaker: member?.isSpeaker,
      hostSubEvents: member?.additionalInfo?.hostSubEvents,
      speakerSubEvents: member?.additionalInfo?.speakerSubEvents,
      type: member?.event?.type,
      resources: member?.event?.resources
    })),
    topics: groupedMembers[memberUid][0]?.topics,
    officeHours: groupedMembers[memberUid][0]?.member?.officeHours,
    telegramId: groupedMembers[memberUid][0]?.member?.telegramHandler || '',
    reason: groupedMembers[memberUid][0]?.reason,
    additionalInfo: groupedMembers[memberUid][0]?.additionalInfo,
  }));
};

export const sortGuestList = (guests: any, userInfo: any) => {
  let sortedGuests = sortByDefault(guests);
  let isUserGoing = false;
  let currentUser = null;

  // Check if the current user is part of the guest list
  if (userInfo) {
    const currentUserIndex = sortedGuests.findIndex((guest) => guest.memberUid === userInfo.uid);
    if (currentUserIndex !== -1) {
      currentUser = sortedGuests[currentUserIndex];
      // Move the current user to the top of the list
      sortedGuests = [currentUser, ...sortedGuests.filter((guest, index) => index !== currentUserIndex)];
      isUserGoing = true; // Set isUserGoing to true if user is found
    }
  }

  // Return sortedGuests, isUserGoing, and currentUser
  return { sortedGuests, isUserGoing, currentUser };
};