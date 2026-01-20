/**
 * Formats a date range into a human-readable string
 * @param startDate - ISO date string for the start date
 * @param endDate - ISO date string for the end date
 * @returns Formatted date range string (e.g., "Jan 1, 2024 - Jan 5, 2024")
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Formats a Date object into an API-compatible date string (YYYY-MM-DD)
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Builds the events link URL for a gathering
 * @param locationName - Name of the location
 * @param startDate - Optional start date string
 * @returns Full URL to the events schedule
 */
export function buildEventsLink(locationName: string, startDate?: string): string {
  const dateParam = startDate ? formatDateForApi(new Date(startDate)) : '';
  return `${process.env.SCHEDULE_BASE_URL}?location=${locationName}&date=${dateParam}`;
}

/**
 * Builds the gathering link URL
 * @param locationName - Name of the location
 * @returns URL path to the IRL events page filtered by location
 */
export function buildGatheringLink(locationName: string): string {
  return `/events/irl?location=${locationName}`;
}

