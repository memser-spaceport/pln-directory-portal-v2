import { EventsSkeleton } from '@/components/page/events/all-events/states';
import s from '@/components/page/events/all-events/AllEventsPage.module.scss';
import { SHOW_EVENT_DRAWER } from '@/utils/event-drawer';
import { SHOW_EVENTS_PAGE_V2 } from '@/utils/events-page';

/** The native page's loading state (LAB-3247): the List's shape in grey while the events load. Nothing for the iframe. */
export default function Loading() {
  if (!SHOW_EVENTS_PAGE_V2 || !SHOW_EVENT_DRAWER) return null;
  return (
    <div className={s.page}>
      <div className={s.container}>
        <EventsSkeleton />
      </div>
    </div>
  );
}
