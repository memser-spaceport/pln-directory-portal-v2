import { format, toZonedTime } from 'date-fns-tz';

// March 12, 2026 @ 9am PT
export const formatDemoDayDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const pdtTimezone = 'America/Los_Angeles';
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const pdtZonedDate = toZonedTime(date, pdtTimezone);
    const userZonedDate = toZonedTime(date, userTimezone);

    const pdtDay = format(pdtZonedDate, 'd', { timeZone: pdtTimezone });
    const pdtMonth = format(pdtZonedDate, 'MMMM', { timeZone: pdtTimezone });
    const pdtYear = format(pdtZonedDate, 'yyyy', { timeZone: pdtTimezone });
    const pdtTime = format(pdtZonedDate, 'h a', { timeZone: pdtTimezone }).toLowerCase();
    const userTime = format(userZonedDate, 'h a', { timeZone: userTimezone }).toLowerCase();

    const dayWithOrdinal = `${pdtDay}`;
    const pdtFormatted = `${pdtMonth} ${dayWithOrdinal}, ${pdtYear} @ ${pdtTime} PT`;

    return `${pdtFormatted} (${userTime} your time)`;
  } catch {
    return dateString;
  }
};

// 9am PT on March 16, 2026
export const formatDemoDayDateTimeFirst = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const pdtTimezone = 'America/Los_Angeles';

    const pdtZonedDate = toZonedTime(date, pdtTimezone);

    const pdtDay = format(pdtZonedDate, 'd', { timeZone: pdtTimezone });
    const pdtMonth = format(pdtZonedDate, 'MMMM', { timeZone: pdtTimezone });
    const pdtYear = format(pdtZonedDate, 'yyyy', { timeZone: pdtTimezone });
    const pdtTime = format(pdtZonedDate, 'h a', { timeZone: pdtTimezone }).toLowerCase();

    const dayWithOrdinal = `${pdtDay}`;

    return `${pdtTime} PT on ${pdtMonth} ${dayWithOrdinal}, ${pdtYear}`;
  } catch {
    return dateString;
  }
};