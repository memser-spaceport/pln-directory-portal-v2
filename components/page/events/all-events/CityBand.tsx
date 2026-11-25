'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { ArrowBackIcon } from '@/components/icons';
import { MAIN_CITY_COUNT, spanLabel, type CitySummary } from '@/services/events/all-events.filters';

import { PinIcon } from './icons';
import s from './AllEventsPage.module.scss';

/**
 * The city tile's picture. The prototype draws a map tile around the city; phase 1 has no city coordinates on this
 * view (they arrive with the Map, LAB-3321), so it draws the pin mark on the same grey square.
 */
function CityThumb({ large }: { large?: boolean }) {
  return (
    <span className={clsx(s.cityThumb, large && s.cityThumbLarge)} aria-hidden>
      <span className={s.cityThumbMark}>
        <PinIcon />
      </span>
    </span>
  );
}

/**
 * "Browse by city": the five cities with the most upcoming events; past five, the header opens the rest in place.
 * Not on phones, where a city is chosen in Filters only (LAB-3391).
 */
export function CityBand({
  cities,
  selected,
  onPick,
}: {
  cities: CitySummary[];
  selected: string[];
  onPick: (city: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const more = cities.length > MAIN_CITY_COUNT;
  const shown = showAll ? cities : cities.slice(0, MAIN_CITY_COUNT);
  return (
    <section className={clsx(s.section, s.citySection)} aria-labelledby="cities-title">
      <div className={s.sectionHead}>
        <h2 id="cities-title" className={s.sectionTitle}>
          Browse by city
        </h2>
        {more && (
          <button type="button" className={s.sectionLink} aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer' : `All ${cities.length} cities`}
          </button>
        )}
      </div>
      <div className={s.cityRow}>
        {shown.map(({ city, eventCount }) => {
          const active = selected.includes(city);
          return (
            <button
              key={city}
              type="button"
              aria-pressed={active}
              className={clsx(s.cityCard, active && s.cityCardActive)}
              onClick={() => onPick(city)}
            >
              <CityThumb />
              <span className={s.cityText}>
                <span className={s.cityName}>{city}</span>
                <span className={s.cityMeta}>
                  {eventCount} {eventCount === 1 ? 'event' : 'events'}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** What a city turns the top of the page into: where you are, and the way back. */
export function CityHeader({
  city,
  summary,
  eventCount,
  onBack,
}: {
  city: string;
  summary: CitySummary | undefined;
  /** The events shown under the current filters. */
  eventCount: number;
  onBack: () => void;
}) {
  return (
    <section className={s.cityHeader} aria-labelledby="city-title">
      <button type="button" className={s.back} onClick={onBack}>
        <ArrowBackIcon width={16} height={16} />
        All cities
      </button>
      <div className={s.cityHeaderRow}>
        <CityThumb large />
        <div>
          <h2 id="city-title" className={s.cityHeaderTitle}>
            {city}
          </h2>
          <p className={s.cityHeaderMeta}>
            {eventCount} live & upcoming {eventCount === 1 ? 'event' : 'events'}
            {summary && ` · ${spanLabel(summary.startDay, summary.endDay)}`}
            {summary?.zone && ` · Times in ${city} time (${summary.zone})`}
          </p>
        </div>
      </div>
    </section>
  );
}
