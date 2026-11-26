import clsx from 'clsx';

import { GlobeIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { EventImage } from '@/components/page/events/EventImage/EventImage';
import { GoingPill, WENT_LABEL } from '@/components/page/events/GoingPill/GoingPill';
import { dayOfSpan, whenLine } from '@/services/events/all-events.filters';
import { ACCESS_COPY, eventPlace } from '@/services/events/event-facts';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { GoingFaces } from './GoingFaces';
import { AccessIcon, PinIcon } from './icons';
import { LivePill } from './LivePill';
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

/** Who hosts: up to two faces, then "By <hosts>". */
function Hosts({ item, ellipsis }: { item: AllEventsItem; ellipsis?: boolean }) {
  const text = `By ${item.hosts.join(' & ')}`;
  return (
    <>
      <span className={s.hostFaces} aria-hidden>
        {item.hosts.slice(0, 2).map((host) => (
          <img key={host} src={getDefaultAvatar(host)} alt="" width={16} height={16} loading="lazy" />
        ))}
      </span>
      {ellipsis ? <span className={s.ellipsis}>{text}</span> : text}
    </>
  );
}

/**
 * The Going pill, the faces and count when the event shows attendance, then how you get in when it isn't the usual
 * RSVP: a glyph and a word in the meta ink, not a badge (prototype, 2026-11-17). On a tile the pill leaves the
 * foot for the picture, except on phones (`.tilePill`). On Past (LAB-3418) the pill reads "Went", the count "N went",
 * and how you got in no longer matters.
 */
function EventFoot({
  item,
  going,
  past = false,
  onTile,
  onOpenPeople,
}: {
  item: AllEventsItem;
  going: boolean;
  past?: boolean;
  onTile?: boolean;
  onOpenPeople?: () => void;
}) {
  const count = item.goingCount ?? 0;
  const access = !past && item.access && item.access !== 'FREE w/ RSVP' ? item.access : null;
  if (!going && count === 0 && !access) return null;
  return (
    <span className={s.cardFoot}>
      {going && (
        <GoingPill label={past ? WENT_LABEL : undefined} onImage={onTile} className={onTile ? s.tilePill : undefined} />
      )}
      <GoingFaces item={item} past={past} onOpenPeople={onOpenPeople} />
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
  past = false,
  live,
  highlighted,
  onOpen,
  onPrepare,
  onOpenPeople,
}: {
  item: AllEventsItem;
  day: string;
  /** The viewer is going; on Past, they went. */
  going: boolean;
  past?: boolean;
  live: boolean;
  highlighted: boolean;
  /** On Past: the faces and "N went" open who went (P1). */
  onOpenPeople?: () => void;
} & EventPress) {
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
        <span className={s.cardWhen}>
          {live && <LivePill />}
          {when}
        </span>
        <span className={s.cardTitle}>{item.name}</span>
        {item.hosts.length > 0 && (
          <span className={s.cardMeta}>
            <Hosts item={item} />
          </span>
        )}
        {placeText(item) && (
          <span className={s.cardMeta}>
            <Place item={item} />
          </span>
        )}
        <EventFoot item={item} going={going} past={past} onOpenPeople={onOpenPeople} />
      </span>
      <EventImage src={item.picture} className={s.thumb} />
    </button>
  );
}

/**
 * A Near you tile (Luma / Partiful grid): the picture on top, the Going pill floating on it. On phones it is the List
 * card instead (Polina, 2026-11-24): the picture on the right, the host, the pill in the foot.
 */
export function EventTile({
  item,
  todayIso,
  going,
  live,
  onOpen,
  onPrepare,
}: { item: AllEventsItem; todayIso: string; going: boolean; live: boolean } & EventPress) {
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
      </span>
      <span className={s.tileBody}>
        <span className={s.tileWhen}>
          {live && <LivePill />}
          {whenLine(item, todayIso)}
        </span>
        <span className={s.tileTitle}>{item.name}</span>
        {item.hosts.length > 0 && (
          <span className={clsx(s.tileMeta, s.tileHost)}>
            <Hosts item={item} ellipsis />
          </span>
        )}
        {placeText(item) && (
          <span className={s.tileMeta}>
            <Place item={item} ellipsis />
          </span>
        )}
        <EventFoot item={item} going={going} onTile />
      </span>
    </button>
  );
}
