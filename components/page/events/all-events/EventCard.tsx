import clsx from 'clsx';

import { GlobeIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { EventImage } from '@/components/page/events/EventImage/EventImage';
import { GoingPill } from '@/components/page/events/GoingPill/GoingPill';
import { dayOfSpan, whenLine } from '@/services/events/all-events.filters';
import { ACCESS_COPY, eventPlace } from '@/services/events/event-facts';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { GoingFaces } from './GoingFaces';
import { AccessIcon, PinIcon } from './icons';
import s from './AllEventsPage.module.scss';

/** What a card needs to open the drawer: the press, and the hover / focus that preloads it. */
export interface EventPress {
  onOpen: () => void;
  onPrepare: () => void;
}

/** Where, with the mode folded in: "Online", "<place> · also online", else the place. Null with neither. */
export const placeText = (item: AllEventsItem): string | null =>
  eventPlace(item.mode, item.place ?? item.city)?.text ?? null;

function Place({ item, ellipsis }: { item: AllEventsItem; ellipsis?: boolean }) {
  const text = placeText(item);
  if (!text) return null;
  return (
    <>
      {item.mode === 'Virtual' ? <GlobeIcon width={14} height={14} className={s.pin} /> : <PinIcon />}
      {ellipsis ? <span className={s.ellipsis}>{text}</span> : text}
    </>
  );
}

/**
 * The Going pill, the faces and count when the event shows attendance, then how you get in when it isn't the usual
 * free RSVP: a glyph and a word in the meta ink, not a badge (prototype, 2026-11-17).
 */
function EventFoot({ item, going }: { item: AllEventsItem; going: boolean }) {
  const count = item.goingCount ?? 0;
  const access = item.access && item.access !== 'FREE w/ RSVP' ? item.access : null;
  if (!going && count === 0 && !access) return null;
  return (
    <span className={s.cardFoot}>
      {going && <GoingPill />}
      <GoingFaces item={item} />
      {access && (
        <span className={s.cardAccess}>
          {count > 0 && <span aria-hidden>·</span>}
          <AccessIcon inviteOnly={access === 'INVITE ONLY'} />
          {ACCESS_COPY[access].main}
        </span>
      )}
    </span>
  );
}

/** A List row (Luma's events list): when, title, host, place, foot, and the picture on the right. */
export function EventCard({
  item,
  day,
  going,
  highlighted,
  onOpen,
  onPrepare,
}: { item: AllEventsItem; day: string; going: boolean; highlighted: boolean } & EventPress) {
  const when = [`${item.startTime} ${item.zone}`, dayOfSpan(item, day)].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      data-event-uid={item.uid}
      className={clsx(s.card, highlighted && s.highlight)}
      onClick={onOpen}
      onPointerEnter={onPrepare}
      onFocus={onPrepare}
    >
      <span className={s.cardBody}>
        <span className={s.cardWhen}>{when}</span>
        <span className={s.cardTitle}>{item.name}</span>
        {item.hosts.length > 0 && (
          <span className={s.cardMeta}>
            <span className={s.hostFaces} aria-hidden>
              {item.hosts.slice(0, 2).map((host) => (
                <img key={host} src={getDefaultAvatar(host)} alt="" width={16} height={16} />
              ))}
            </span>
            By {item.hosts.join(' & ')}
          </span>
        )}
        {placeText(item) && (
          <span className={s.cardMeta}>
            <Place item={item} />
          </span>
        )}
        <EventFoot item={item} going={going} />
      </span>
      <EventImage src={item.picture} className={s.thumb} />
    </button>
  );
}

/** A Near you tile (Luma / Partiful grid): the picture on top, the Going pill floating on it. */
export function EventTile({
  item,
  todayIso,
  going,
  onOpen,
  onPrepare,
}: { item: AllEventsItem; todayIso: string; going: boolean } & EventPress) {
  return (
    <button
      type="button"
      data-event-uid={item.uid}
      className={s.tile}
      onClick={onOpen}
      onPointerEnter={onPrepare}
      onFocus={onPrepare}
    >
      <span className={s.tileImage}>
        <EventImage src={item.picture} className={s.tileFill} />
        {going && <GoingPill onImage />}
      </span>
      <span className={s.tileBody}>
        <span className={s.tileWhen}>{whenLine(item, todayIso)}</span>
        <span className={s.tileTitle}>{item.name}</span>
        {placeText(item) && (
          <span className={s.tileMeta}>
            <Place item={item} ellipsis />
          </span>
        )}
        <EventFoot item={item} going={false} />
      </span>
    </button>
  );
}
