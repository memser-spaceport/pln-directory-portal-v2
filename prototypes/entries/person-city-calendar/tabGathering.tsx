'use client';

/**
 * Tab 1 — /events/irl?location=Berlin
 *
 * Rebuilt against a screenshot of dev, so the structure now matches:
 *
 *   "IRL Gatherings" header + description
 *   bordered strip: city cards → "See Other Locations" → "View All Events"
 *   Quick Links row inside that same strip
 *   periwinkle follow band: N members following · Schedule / Follow / I'm Going
 *   "Attendees (N)" + search + the real attendee table
 *
 * Two earlier inventions are gone: a gradient hero banner and an avatar-stack
 * attendees panel. Neither exists in production.
 *
 * "I'm Going" opens the genuine production `Modal` via `ModalBase`.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { Modal } from '@/components/common/Modal';
import { Checkbox } from '@/components/common/Checkbox';
import { CloseIcon, ConfettiIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { getFormattedDateString } from '@/utils/irl.utils';

import irl from '@/app/events/irl/page.module.css';
// The shared success-modal skin — see the success block below.
import ok from '@/components/page/founder-guides/RequestGuide/RequestGuideSuccessModal/RequestGuideSuccessModal.module.scss';

import { GATHERING, type PersonCityMember, type Trip } from './mocks';
import { eachDay, presenceOn } from './presence';
import { CITY_ART } from './irlCityArt';
import { CalendarIcon, ChevronIcon, PlaneIcon } from './icons';
import s from './Screens.module.scss';

type Step = 'closed' | 'confirm' | 'details' | 'done';

const CITIES = [
  { name: 'Berlin', flag: 'DE', current: 6, past: 2, active: true },
  { name: 'Lisbon', flag: 'PT', current: 4, past: 5, active: false },
  { name: 'Singapore', flag: 'SG', current: 3, past: 1, active: false },
  { name: 'Tokyo', flag: 'JP', current: 0, past: 4, active: false },
];

const QUICK_LINKS = ['Telegram', 'Twitter', 'Bluesky', 'Mastodon'];

const ATTENDING_TAGS: Record<string, string> = {
  'lucas-moreau': 'Protocol Berg — Main',
  'nadia-haddad': 'Storage Day',
  'olga-petrova': 'ZK Sessions',
  'theo-larsson': 'Protocol Berg — Main',
};

const INTERESTS: Record<string, { line: string; tags: string[] }> = {
  'theo-larsson': { line: 'making storage boring again', tags: ['Decentralized Storage', 'Rust'] },
  'lucas-moreau': { line: 'what teams decide not to build', tags: ['Product Strategy', 'IPFS'] },
  'nadia-haddad': { line: 'pre-seed infra bets', tags: ['Seed Investing', 'Infra'] },
  'olga-petrova': { line: 'measuring what actually shipped', tags: ['Data Science', 'Impact Metrics'] },
};

interface GatheringTabProps {
  onTripAdded: (trip: Trip) => void;
  alreadyGoing: boolean;
  onGoToCalendar: () => void;
  people: PersonCityMember[];
  trips: Trip[];
}

export function GatheringTab({ onTripAdded, alreadyGoing, onGoToCalendar, people, trips }: GatheringTabProps) {
  const [step, setStep] = useState<Step>('closed');
  const [search, setSearch] = useState('');
  // Opt-out, not opt-in: see the offer copy in step 2.
  const [addToLocation, setAddToLocation] = useState(true);

  // Anyone in the city at any point during the gathering — matching only the
  // first day drops people who arrive on day two, which is most of them.
  const gatheringDays = eachDay(GATHERING.startDate, GATHERING.endDate);
  const guests = people
    .map((person) => {
      const day = gatheringDays.find((d) => presenceOn(person, trips, d).city === GATHERING.city);
      return day ? { person, presence: presenceOn(person, trips, day) } : null;
    })
    .filter((row): row is { person: PersonCityMember; presence: ReturnType<typeof presenceOn> } => row !== null)
    .filter((row) => {
      const needle = search.trim().toLowerCase();
      if (!needle) return true;
      return row.person.name.toLowerCase().includes(needle) || row.person.teamName.toLowerCase().includes(needle);
    });

  const commit = () => {
    if (!addToLocation) {
      setStep('done');
      return;
    }
    onTripAdded({
      id: 't-me-berlin',
      memberId: 'maya-okonkwo',
      city: GATHERING.city,
      country: 'Germany',
      startDate: GATHERING.startDate,
      endDate: GATHERING.endDate,
      source: 'event',
      eventName: GATHERING.name,
      confirmed: false,
    });
    setStep('done');
  };

  return (
    <div className={irl.irlGatherings}>
      <div className={clsx(irl.irlGatherings__cn, s.irlPage)}>
        {/* irl-header.tsx:14-20 */}
        <section className={s.irlHeader}>
          <h1 className={s.irlHeaderTitle}>IRL Gatherings</h1>
          <p className={s.irlHeaderText}>
            Choose a destination to view current gatherings, attendees, resources &amp; let the network know about your
            presence
          </p>
        </section>

        {/* Bordered location strip + quick links, as one container. */}
        <section className={s.locationPanel}>
          <div className={s.locationRow}>
            {CITIES.map((city) => {
              const Art = CITY_ART[city.name] ?? CITY_ART.Berlin;
              return (
                <button
                  key={city.name}
                  type="button"
                  className={clsx(s.locationCard, { [s.locationCardActive]: city.active })}
                >
                  <span className={s.locationCardArt}>
                    <Art />
                  </span>
                  <span className={s.locationCardName}>
                    <span className={s.locationFlag}>{city.flag}</span>
                    {city.name}
                  </span>
                  <span className={s.locationCardCounts}>
                    {city.current > 0 && (
                      <span>
                        <strong>{city.current}</strong> Current
                      </span>
                    )}
                    {city.past > 0 && (
                      <span>
                        <strong>{city.past}</strong> Past
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

            <button type="button" className={clsx(s.locationCard, s.locationCardOther)}>
              <span className={s.otherTitle}>See Other Locations</span>
              <span className={s.otherFlags}>
                {['NL', 'BR', 'KE'].map((code) => (
                  <span key={code} className={s.otherFlag}>
                    {code}
                  </span>
                ))}
              </span>
              <span className={s.otherChevron}>
                <ChevronIcon />
              </span>
            </button>

            <button type="button" className={clsx(s.locationCard, s.locationCardAll)}>
              <span className={s.allEventsLabel}>View All Events</span>
            </button>
          </div>

          <div className={s.quickLinks}>
            <span className={s.quickLinksLabel}>📋 Quick Links for {GATHERING.city}</span>
            <div className={s.quickLinkChips}>
              {QUICK_LINKS.map((link) => (
                <span key={link} className={s.quickLinkChip}>
                  {link} <span className={s.quickLinkArrow}>↗</span>
                </span>
              ))}
              <span className={clsx(s.quickLinkChip, s.quickLinkMore)}>+3 more</span>
            </div>
          </div>
        </section>

        {/* Follow band — follow-section.tsx toolbar. */}
        <section className={s.followBand}>
          <div className={s.followLeft}>
            <span className={s.followAvatars}>
              {people.slice(1, 4).map((person) => (
                <img key={person.id} className={s.followAvatar} src={getDefaultAvatar(person.name)} alt="" />
              ))}
            </span>
            <span className={s.followText}>
              <strong>102 members</strong> following gatherings at <span className={s.locationFlag}>DE</span>{' '}
              {GATHERING.city}
            </span>
          </div>

          <div className={s.followActions}>
            <button type="button" className={s.bandBtn}>
              <CalendarIcon fill="#455468" />
              Schedule <span className={s.bandBtnMuted}>({GATHERING.eventCount} events)</span>{' '}
              <span className={s.quickLinkArrow}>↗</span>
            </button>
            <button type="button" className={s.bandBtn}>
              <BellIcon />
              Follow
            </button>
            {alreadyGoing ? (
              <button type="button" className={s.bandBtn} onClick={onGoToCalendar}>
                Response <ChevronIcon />
              </button>
            ) : (
              <button type="button" className={s.bandPrimary} onClick={() => setStep('confirm')}>
                I&apos;m Going
              </button>
            )}
          </div>
        </section>

        {/* Attendees + search + table */}
        <section className={s.attendeeSection}>
          <div className={s.attendeeHead}>
            <h2 className={s.attendeeTitle}>Attendees ({GATHERING.attendeeCount})</h2>
            <div className={s.attendeeSearch}>
              <input
                className={s.attendeeSearchInput}
                placeholder="Search by Attendee, Team or Project"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <SearchIcon />
            </div>
          </div>

          <div className={s.attendeeTable}>
            <div className={s.attendeeTableHead}>
              <span className={s.thSortable}>
                <SortIcon /> Attendee Name <FilterPill />
              </span>
              <span className={s.thSortable}>
                <SortIcon /> Team
              </span>
              <span>Connect</span>
              <span className={s.thSortable}>
                Attending <FilterPill />
              </span>
              <span className={s.thSortable}>
                Interested in <FilterPill />
              </span>
            </div>

            {guests.map(({ person, presence }) => {
              const interest = INTERESTS[person.id];
              return (
                <div key={person.id} className={s.attendeeRow}>
                  <span className={s.attendeeCell}>
                    <img className={s.attendeeAvatar} src={getDefaultAvatar(person.name)} alt="" />
                    {person.name}
                  </span>
                  <span className={s.attendeeCell}>
                    <span className={s.teamLogo}>{person.teamName.charAt(0)}</span>
                    <span className={s.teamName}>{person.teamName}</span>
                  </span>
                  {/* Transcribed from guest-table-row.tsx:312-380 — the real
                      telegram-solid + video-cam assets, a 24px-radius pill with
                      a 0.5px #cbd5e1 border on #f1f5f9, and #156ff7 link text
                      (not the brand blue). */}
                  <span className={s.connectCell}>
                    <span className={s.telegramRow}>
                      <img src="/icons/telegram-solid.svg" alt="" width={16} height={16} />
                      <span className={s.telegramLink}>@{person.name.split(' ')[0].toLowerCase()}</span>
                    </span>
                    {person.officeHours && (
                      <span className={s.bookTime}>
                        <img src="/icons/video-cam.svg" alt="" width={16} height={16} />
                        <span className={s.bookTimeTxt}>Book Time</span>
                      </span>
                    )}
                  </span>
                  <span className={s.attendingCell}>
                    <span className={s.eventChip}>{ATTENDING_TAGS[person.id] ?? GATHERING.name}</span>
                    <span className={s.attendingDates}>
                      {presence.trip
                        ? getFormattedDateString(presence.trip.startDate, presence.trip.endDate)
                        : 'Lives here'}
                    </span>
                  </span>
                  <span className={s.interestCell}>
                    {interest && <span className={s.interestLine}>{interest.line}</span>}
                    <span className={s.interestTags}>
                      {interest?.tags.map((tag) => (
                        <span key={tag} className={s.interestTag}>
                          {tag}
                        </span>
                      ))}
                      <span className={s.interestTag}>+5</span>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          <p className={s.panelFootnote}>
            The dates under &ldquo;Attending&rdquo; already exist in dev (guest-table-row.tsx:60-71) and already come
            from the same check-in / check-out fields the calendar would read.
          </p>
        </section>
      </div>

      {/* ---- step 1 — "IRL Gatherings: <city>" ---- */}
      <GatheringModal
        open={step === 'confirm'}
        onClose={() => setStep('closed')}
        secondary={{ label: 'No', onClick: () => setStep('closed') }}
        primary={{ label: "Yes, I'm going", onClick: () => setStep('details') }}
      >
        <h3 className={s.gmHeading}>About this Gathering:</h3>
        <p className={s.gmBody}>{GATHERING.description}</p>

        <h3 className={s.gmHeading}>Gathering details</h3>
        <dl className={s.gmDetails}>
          <div className={s.gmDetailRow}>
            <CalendarIcon fill="#455468" />
            <dt>Date:</dt>
            <dd>Aug 24, 2026 - Aug 28, 2026</dd>
          </div>
          <div className={s.gmDetailRow}>
            <PinIcon />
            <dt>Location:</dt>
            <dd>{GATHERING.city}</dd>
          </div>
          <div className={s.gmDetailRow}>
            <CalendarIcon fill="#455468" />
            <dt>Schedule:</dt>
            <dd>
              <span className={s.gmLink}>View all events ({GATHERING.eventCount}) ↗</span>
            </dd>
          </div>
          <div className={s.gmDetailRow}>
            <PlaneIcon fill="#455468" />
            <dt>Telegram:</dt>
            <dd>
              <span className={s.gmLink}>Link ↗</span>
            </dd>
          </div>
        </dl>

        <h3 className={s.gmHeading}>Attendees</h3>
        <div className={s.gmAttendees}>
          <span className={s.followAvatars}>
            {people.slice(1, 4).map((person) => (
              <img key={person.id} className={s.followAvatar} src={getDefaultAvatar(person.name)} alt="" />
            ))}
          </span>
          <span className={s.gmLink}>{GATHERING.attendeeCount} People going ↗</span>
        </div>
      </GatheringModal>

      {/* ---- step 2: the seam between the two systems ---- */}
      <GatheringModal
        open={step === 'details'}
        onClose={() => setStep('closed')}
        secondary={{ label: 'Cancel', onClick: () => setStep('closed') }}
        primary={{ label: 'Save', onClick: commit }}
      >
        <div className={s.planningContainer}>
          <div className={s.planningHeader}>
            <p className={s.planningTitle}>Thanks for confirming! 🎉</p>
            <p className={s.planningSubtitle}>Share a bit more to help others find you IRL.</p>
          </div>

          <div className={s.planningContent}>
            <div className={s.planningField}>
              {/* "Staying longer?" belongs to the dates, not to the location
                  offer below — it adjusts the range. Parking it in the offer row
                  made it fight the checkbox for the same line. */}
              <span className={s.planningLabelRow}>
                <span className={s.planningFieldLabel}>Select date range</span>
                <button type="button" className={s.linkBtn}>
                  Staying longer?
                </button>
              </span>
              <div className={s.planningFieldInput}>
                <span className={s.planningFieldValue}>Aug 24, 2026 - Aug 28, 2026</span>
              </div>

              {/* NEW — an offer, not an announcement.
                  Checked by default, because the whole argument is that most of
                  your travel is already known from your RSVPs and the job is
                  confirming rather than authoring; unchecked-by-default would
                  leave every calendar empty. But it is a checkbox, not a
                  statement: the previous copy told people what was about to
                  happen to their profile after the fact.
                  The label names the destination in the words the profile uses
                  ("your location"), and the sub-line states the actual outcome —
                  Berlin *instead of* Lisbon — because that swap is the thing a
                  person would be surprised by. */}
              {/* Production's own checkbox (components/common/Checkbox) — base-ui
                  Root + CheckIcon, the same control GenericCheckboxList uses in
                  the filter rail. The wrapper owns the click so the whole row is
                  a hit target without nesting a button inside a <label>. */}
              <div className={s.calendarOffer} onClick={() => setAddToLocation((current) => !current)}>
                <Checkbox checked={addToLocation} classes={{ root: s.calendarCheck }} />
                <span className={s.calendarOfferBody}>
                  <span className={s.calendarOfferLabel}>Add these dates to your location</span>
                  <span className={s.calendarOfferSub}>
                    Your profile will read <strong>Berlin, Aug 24–28</strong>
                    {' instead of Lisbon, so people looking for who’s around can find you.'}
                  </span>
                </span>
              </div>
            </div>

            <div className={s.planningField}>
              <span className={s.planningFieldLabel}>Select events you plan to attend</span>
              <div className={s.planningFieldInput}>
                {GATHERING.subEvents.slice(0, 2).map((event) => (
                  <span key={event} className={s.planningTag}>
                    {event}
                  </span>
                ))}
                <span className={s.planningTrailing}>
                  <ChevronIcon />
                </span>
              </div>
            </div>

            <div className={s.planningField}>
              <span className={s.planningFieldLabel}>Topics of interest</span>
              <div className={s.planningFieldInput}>
                <span className={s.planningFieldPlaceholder}>Select topics</span>
                <span className={s.planningTrailing}>
                  <ChevronIcon />
                </span>
              </div>
            </div>
          </div>
        </div>
      </GatheringModal>

      {/* ---- success ----
          Deliberately NOT the gathering dialog. Production already has a
          success-modal shell used by RequestGuideSuccessModal,
          RequestDealSuccessModal and SubmitDealSuccessModal — 368px wide, 24px
          radius, floating close, a centred ConfettiIcon over title + body, one
          full-width button. Its SCSS module is imported here so this is the
          fourth instance of that pattern rather than a fourth variant of it. */}
      <Modal isOpen={step === 'done'} onClose={() => setStep('closed')}>
        <div className={ok.root}>
          <button type="button" className={ok.closeBtn} onClick={() => setStep('closed')} aria-label="Close">
            <CloseIcon />
          </button>

          <div className={ok.content}>
            <div className={ok.iconWrap}>
              <ConfettiIcon />
            </div>
            <div className={ok.text}>
              <p className={ok.title}>You&apos;re going to {GATHERING.name}</p>
              <p className={ok.body}>Your response is on the attendee list.</p>
            </div>

            {/* The one addition to the pattern: where the dates landed. Only
                shown if they accepted the offer — confirming an outcome that
                didn't happen is worse than saying nothing. */}
            {addToLocation && (
              <div className={s.successCalendarCard}>
                <PlaneIcon />
                <div className={s.successCalendarText}>
                  <span className={s.successCalendarCity}>
                    {GATHERING.city} · {getFormattedDateString(GATHERING.startDate, GATHERING.endDate)}
                  </span>
                  <span className={s.successCalendarNote}>Added to your location</span>
                </div>
                <button type="button" className={s.ghostBtnSm} onClick={onGoToCalendar}>
                  View
                </button>
              </div>
            )}
          </div>

          <div className={ok.footer}>
            <button type="button" className={ok.backBtn} onClick={() => setStep('closed')}>
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * The gathering dialog shell, matching dev: an icon tile + "IRL Gatherings:
 * <city>" title with a close X above a bottom border, a scrollable body, and a
 * footer of two equal-width buttons. Uses the production `Modal` for the
 * portal, backdrop and animation — only the chrome inside is ours, because
 * `ModalBase` centres its title and renders small right-aligned buttons.
 */
function GatheringModal({
  open,
  onClose,
  children,
  primary,
  secondary,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  primary: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <Modal isOpen={open} onClose={onClose} className={s.gmModal}>
      <div className={s.gmHeader}>
        <span className={s.gmIconTile}>
          <CITY_ART.Berlin />
        </span>
        <h2 className={s.gmTitle}>IRL Gatherings: {GATHERING.city}</h2>
        <button type="button" className={s.gmClose} onClick={onClose} aria-label="Close">
          <CloseGlyph />
        </button>
      </div>

      <div className={s.gmBodyScroll}>{children}</div>

      <div className={s.gmFooter}>
        {secondary && (
          <button type="button" className={s.gmSecondary} onClick={secondary.onClick}>
            {secondary.label}
          </button>
        )}
        <button type="button" className={s.gmPrimary} onClick={primary.onClick}>
          {primary.label}
        </button>
      </div>
    </Modal>
  );
}

/* ---- small glyphs used by the table + band ---- */

const CloseGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5L15 15" stroke="#455468" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 14s5-4.2 5-8A5 5 0 0 0 3 6c0 3.8 5 8 5 8Z" stroke="#455468" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="8" cy="6" r="1.8" stroke="#455468" strokeWidth="1.3" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
      stroke="#94a3b8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 2a4 4 0 0 0-4 4v2.5L3 11h10l-1-2.5V6a4 4 0 0 0-4-4ZM6.5 13a1.5 1.5 0 0 0 3 0"
      stroke="#455468"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SortIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2L3.5 5h5L6 2ZM6 10L3.5 7h5L6 10Z" fill="#8897AE" />
  </svg>
);

const FilterPill = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 16,
      height: 16,
      borderRadius: '50%',
      border: '1px solid #AEBFFF',
    }}
  >
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 2h8L6 5.5V9L4 8V5.5L1 2Z" stroke="#1B4DFF" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  </span>
);
