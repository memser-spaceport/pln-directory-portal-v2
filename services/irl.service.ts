import { getHeader } from '@/utils/common.utils';
import { isPastDate } from '@/utils/irl.utils';

export const getAllEvents = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/events?orderBy=priority`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });

  const result = await response.json();

  if (!response.ok) {
    return { errorCode: 500, errorMessage: 'Something went wrong' };
  }

  const events = result?.map((event: any) => {
    return {
      id: event?.uid,
      name: event?.name,
      slugUrl: event?.slugURL,
      bannerUrl: event?.banner?.url,
      description: event?.description,
      location: event?.location,
      startDate: event?.startDate,
      endDate: event?.endDate,
      createdAt: event?.createdAt,
      type: event?.type,
      attendees: event?.eventGuests?.length,
      priority: event?.priority,
    };
  });

  return events;
};

export const getEventDetailBySlug = async (slug: string, token: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/events/${slug}`, {
    method: 'GET',
    cache: 'no-store',
    headers: getHeader(token),
  });

  if (!response.ok) {
    return {
      isError: true,
    };
  }

  const output = await response.json();

  const isExclusionEvent = output?.additionalInfo?.isExclusiveEvent ?? false;
  const defaultTopics = process.env.IRL_DEFAULT_TOPICS?.split(',');
  const topics = output?.additionalInfo?.topics ?? defaultTopics;

  const guests = output?.eventGuests?.map((guest: any) => {
    const memberRole = guest?.member?.teamMemberRoles?.find((teamRole: any) => guest?.teamUid === teamRole?.teamUid)?.role;

    const projectContributions = guest?.member?.projectContributions?.filter((pc: any) => !pc?.project?.isDeleted)?.map((item: any) => item?.project?.name);

    return {
      uid: guest?.uid,
      teamUid: guest?.teamUid,
      teamName: guest?.team?.name,
      teamLogo: guest?.team?.logo?.url,
      memberUid: guest?.memberUid,
      memberName: guest?.member?.name,
      memberLogo: guest?.member?.image?.url,
      memberRole,
      reason: guest?.reason,
      telegramId: guest?.member?.telegramHandler || '',
      isTelegramRemoved: guest?.telegramId === '',
      officeHours: guest?.member?.officeHours || '',
      createdAt: guest?.createdAt,
      projectContributions,
      topics: guest?.topics,
      additionalInfo: guest?.additionalInfo,
    };
  });

  return {
    id: output?.uid,
    name: output?.name,
    slugUrl: output?.slugURL,
    bannerUrl: output?.banner?.url,
    eventCount: output?.eventsCount,
    description: output?.description,
    websiteUrl: output?.websiteURL,
    telegram: output?.telegramId,
    type: output?.type,
    startDate: output?.startDate,
    endDate: output?.endDate,
    eventLocation: output?.location,
    // isPastEvent,
    resources: output?.resources,
    guests,
    topics: Array.isArray(topics) ? topics : [],
    isExclusionEvent,
    additionalInfo: output?.additionalInfo,
  };
};

export const createEventGuest = async (slug: string, payload: any, authToken: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/events/${slug}/guest`, {
    method: 'POST',
    cache: 'no-store',
    body: JSON.stringify(payload),
    headers: getHeader(authToken),
  });

  if (!response.ok) {
    return false;
  }
  return true;
};

export const editEventGuest = async (slug: string, uid: string, payload: any, authToken: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/events/${slug}/guest/${uid}`, {
    method: 'PUT',
    cache: 'no-store',
    body: JSON.stringify(payload),
    headers: getHeader(authToken),
  });

  if (!response.ok) {
    return false;
  }

  return true;
};

export const getUserEvents = async (token: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/me/events`, {
    method: 'GET',
    cache: 'no-store',
    headers: getHeader(token),
  });

  if (!response.ok) {
    return {
      errorCode: 500,
    };
  }

  return await response.json();
};
