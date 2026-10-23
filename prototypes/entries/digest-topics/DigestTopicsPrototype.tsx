'use client';

/**
 * News preferences: a new Settings page that holds what shapes the news a
 * member sees, for BOTH For You on Home and the email digest. It sits after
 * Email Preferences in the settings menu. Email Preferences keeps delivery only
 * (frequency, Forum activity, Network news) plus one link line to this page.
 *
 * Why its own page, not Email Preferences or Recommendations: Email Preferences
 * is about email delivery, and the feed would have no natural door into it.
 * Recommendations is a separate product (a member/team-matching email with its
 * own on/off, frequency, Save button and recommendationsEnabled flag).
 *
 * Sections:
 *   Topics ................. hashtag topics (invented; backend supplies the real
 *                            list), prefilled per member, unsubscribe/resubscribe
 *                            in place. Replaces the feed categories AND the team
 *                            focus areas as what shapes For You + digest.
 *   Teams you follow ....... production FollowButton; unfollow is undoable in place
 *
 * Doors in (prototype switch "Arrived"):
 *   digest email "Update preferences" → ?from=digest
 *   For You hint "Tune For You"       → ?from=feed
 *   settings menu                     → ?from=settings
 * Arriving from the digest or the feed lands on the biggest gap (no topics →
 * topics; no follows → teams; else topics) and outlines it until the
 * first change. Other switch: ?persona=complete|investor|empty.
 *
 * Reuse map:
 *   app/settings/email/page.module.css ............ settings shell (aside + content)
 *   EmailPreferencesForm.module.scss .............. page root + title
 *   ForumDigest.module.scss ....................... Digest card, frequency field, option rows
 *   Newsletter.module.scss ........................ cards + bordered rows + Switch
 *   ./SettingsMenu ................................ copy of the settings menu + News preferences item
 *   components/ui/FollowButton .................... follow / following toggle
 *   NEW: topic chips are multi-select CONTROL chips (brand hover,
 *   aria-pressed, check mark = subscribed). Not the feed's .cat pill
 *   (single-select) and not Badge (label lineage, no interaction states).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { clsx } from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { Field } from '@base-ui-components/react/field';

import shellCss from '@/app/settings/email/page.module.css';
import formCss from '@/components/page/email-preferences/components/EmailPreferencesForm/EmailPreferencesForm.module.scss';
import digestCss from '@/components/page/email-preferences/components/ForumDigest/ForumDigest.module.scss';
import toggleCss from '@/components/page/email-preferences/components/Newsletter/Newsletter.module.scss';
import { FollowButton } from '@/components/ui/FollowButton';

import { SettingsMenu, type SettingsPage } from './SettingsMenu';
import { PERSONAS, TOPICS, type Persona } from './mocks';
import s from './DigestTopicsPrototype.module.scss';

const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: 50 }} />,
});

type FreqValue = 'no_digest' | 'daily_digest' | 'weekly_digest';
interface FreqOption {
  label: string;
  value: FreqValue;
  description: string;
}

const FREQ_OPTIONS: FreqOption[] = [
  { label: 'No Digest', value: 'no_digest', description: 'Don’t receive a digest by email.' },
  { label: 'Daily Digest', value: 'daily_digest', description: 'A roundup of new activity every day.' },
  { label: 'Weekly Digest', value: 'weekly_digest', description: 'The week’s highlights, once a week.' },
];

// Copied from production ForumDigest's inline react-select styles.
const selectStyles = {
  container: (base: any) => ({ ...base, width: '100%' }),
  control: (base: any) => ({
    ...base,
    alignItems: 'center',
    gap: '8px',
    alignSelf: 'stretch',
    borderRadius: '8px',
    border: '1px solid rgba(203, 213, 225, 0.50)',
    background: '#fff',
    outline: 'none',
    minWidth: '140px',
    width: '100%',
    borderColor: 'rgba(203, 213, 225, 0.50) !important',
    position: 'relative' as const,
    fontSize: '16px',
    color: '#455468',
    boxShadow: 'none !important',
    '&:hover': {
      border: '1px solid #5E718D',
      boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
      borderColor: '#5E718D !important',
    },
  }),
  input: (base: any) => ({ ...base, height: '42px', padding: 0, fontSize: 16 }),
  option: (base: any) => ({
    ...base,
    fontSize: '14px',
    fontWeight: 300,
    color: '#455468',
    '&:hover': { background: 'rgba(27, 56, 96, 0.12)' },
  }),
  menuList: (base: any) => ({ ...base, width: '100%' }),
  menu: (base: any) => ({
    ...base,
    outline: 'none',
    zIndex: 3,
    display: 'flex',
    padding: '8px',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
  }),
  placeholder: (base: any) => ({ ...base, color: '#CBD5E1' }),
  indicatorSeparator: () => ({ display: 'none' }),
};

const selectComponents = {
  Option: (props: any) => {
    const d = props.data as FreqOption;
    return (
      <div onClick={() => props.selectOption(d)} className={digestCss.option}>
        <div className={digestCss.optionLabel}>{d.label}</div>
        {d.description && <div className={digestCss.optionDesc}>{d.description}</div>}
      </div>
    );
  },
};

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={toggleCss.toggleSection}>
      <label className={clsx(toggleCss.Label, toggleCss.toggle)}>
        {label}
        <Switch.Root className={toggleCss.Switch} checked={checked} onCheckedChange={onChange}>
          <Switch.Thumb className={toggleCss.Thumb}>
            <div className={toggleCss.dot} />
          </Switch.Thumb>
        </Switch.Root>
      </label>
      <div className={toggleCss.desc}>{desc}</div>
    </div>
  );
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

type Arrival = 'digest' | 'feed' | 'settings';
type Gap = 'topics' | 'teams';

const ARRIVALS: { v: Arrival; label: string }[] = [
  { v: 'digest', label: 'Digest email' },
  { v: 'feed', label: 'For You hint' },
  { v: 'settings', label: 'Settings menu' },
];

function readParams(): { persona: Persona; arrival: Arrival } {
  const p = new URLSearchParams(window.location.search);
  const rawP = p.get('persona');
  const persona: Persona = rawP === 'investor' || rawP === 'empty' ? rawP : 'complete';
  const rawA = p.get('from');
  // No `from` = the demo default: arriving from the email.
  const arrival: Arrival = rawA === 'feed' || rawA === 'settings' ? rawA : 'digest';
  return { persona, arrival };
}

export default function DigestTopicsPrototype() {
  const [mounted, setMounted] = useState(false);
  const [persona, setPersona] = useState<Persona>('complete');
  const [arrival, setArrival] = useState<Arrival>('digest');
  const [page, setPage] = useState<SettingsPage>('news preferences');

  // Email Preferences
  const [freq, setFreq] = useState<FreqOption>(FREQ_OPTIONS[1]);
  const [includeForum, setIncludeForum] = useState(true);
  const [includeNews, setIncludeNews] = useState(true);
  const [newsletter, setNewsletter] = useState(true);
  const [demoDay, setDemoDay] = useState(true);
  const [showInvestor, setShowInvestor] = useState(false);

  // News preferences
  const [topics, setTopics] = useState<string[]>(PERSONAS.complete.topics);
  const [unfollowed, setUnfollowed] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState<null | 'topics' | 'teams'>(null);

  const refs = {
    topics: useRef<HTMLDivElement>(null),
    teams: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const p = readParams();
    setPersona(p.persona);
    setTopics(PERSONAS[p.persona].topics);
    setArrival(p.arrival);
    setMounted(true);
  }, []);

  const mock = PERSONAS[persona];
  // The biggest gap gets the arrival outline: no topics, then no follows.
  const gap: Gap = mock.topics.length > 0 && mock.follows.length === 0 ? 'teams' : 'topics';
  // Subscribed topics first, frozen per member, so chips don't jump when toggled.
  const topicOrder = useMemo(
    () => [...mock.topics, ...TOPICS.filter((t) => !mock.topics.includes(t))],
    [mock],
  );
  const arriving = arrival !== 'settings' && page === 'news preferences' && !touched;

  useEffect(() => {
    if (!mounted || !arriving) return;
    refs[gap].current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, arrival, persona, page]);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(null), 2000);
    return () => window.clearTimeout(t);
  }, [saved]);

  const syncUrl = (p: Persona, a: Arrival) => {
    const url = new URL(window.location.href);
    url.searchParams.set('persona', p);
    url.searchParams.set('from', a);
    window.history.replaceState(null, '', url);
  };

  const reset = (p: Persona = persona) => {
    setTouched(false);
    setUnfollowed([]);
    setTopics(PERSONAS[p].topics);
  };

  const switchPersona = (p: Persona) => {
    setPersona(p);
    reset(p);
    syncUrl(p, arrival);
  };

  const switchArrival = (a: Arrival) => {
    setArrival(a);
    reset();
    // Every door except the settings menu itself lands on News preferences.
    if (a !== 'settings') setPage('news preferences');
    syncUrl(persona, a);
  };

  const toggleTopic = (topic: string) => {
    const on = topics.includes(topic);
    setTopics(on ? topics.filter((x) => x !== topic) : [...topics, topic]);
    setTouched(true);
    setSaved('topics');
    console.log('[analytics]', on ? 'news_pref_topic_unsubscribed' : 'news_pref_topic_subscribed', { topic, arrival });
  };

  const toggleFollow = (uid: string) => {
    setUnfollowed((cur) => (cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid]));
    setTouched(true);
    setSaved('teams');
  };

  const SavedNote = () => (
    <span className={s.saved} role="status">
      <CheckIcon /> Saved
    </span>
  );

  if (!mounted) return <div className={shellCss.privacy} />;

  const lit = (g: Gap) => arriving && gap === g;
  const followingCount = mock.follows.filter((t) => !unfollowed.includes(t.uid)).length;
  const arrivalWhere = arrival === 'digest' ? 'your digest' : 'For You';

  const emailPage = (
    <div className={formCss.root}>
      <h5 className={formCss.title}>Email Preferences</h5>

      <div className={digestCss.root}>
        <div className={digestCss.header}>Digest</div>
        <div className={digestCss.content}>
          <Field.Root className={digestCss.field}>
            <Field.Label className={digestCss.label}>Email me a digest:</Field.Label>
            <Select
              instanceId="digest-frequency"
              menuPlacement="auto"
              placeholder="Select frequency"
              options={FREQ_OPTIONS}
              value={freq}
              onChange={(v) => setFreq(v as FreqOption)}
              styles={selectStyles}
              components={selectComponents}
            />
          </Field.Root>

          {freq.value !== 'no_digest' && (
            <>
              <ToggleRow
                label="Forum activity"
                desc="Discussions, replies, and trending posts from the forum."
                checked={includeForum}
                onChange={setIncludeForum}
              />
              <ToggleRow
                label="Network news"
                desc="Funding, launches, partnerships, and milestones from teams across the network."
                checked={includeNews}
                onChange={setIncludeNews}
              />
              {/* NEW: the one link to where the news itself is chosen. */}
              {includeNews && (
                <p className={s.crossLink}>
                  Choose which news you get in{' '}
                  <button type="button" className={s.inlineLink} onClick={() => setPage('news preferences')}>
                    News preferences
                  </button>
                  . It also shapes For You on Home.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className={toggleCss.root}>
        <div className={toggleCss.header}>Newsletter</div>
        <div className={toggleCss.content}>
          <ToggleRow
            label="Subscribe to PL Newsletter"
            desc="Get newsletter straight to your inbox"
            checked={newsletter}
            onChange={setNewsletter}
          />
        </div>
      </div>

      <div className={toggleCss.root}>
        <div className={toggleCss.header}>Demo Day Updates</div>
        <div className={toggleCss.content}>
          <ToggleRow
            label="Receive Demo Day Updates"
            desc="Get notified when registration opens, demo day begins and other relevant reminders."
            checked={demoDay}
            onChange={setDemoDay}
          />
        </div>
      </div>

      <div className={toggleCss.root}>
        <div className={toggleCss.header}>Investor Communications</div>
        <div className={toggleCss.content}>
          <ToggleRow
            label="Show Investor Profile on my public member page"
            desc="Toggle to make your investor information visible to other network members and eligible for Demo Day invitations."
            checked={showInvestor}
            onChange={setShowInvestor}
          />
        </div>
      </div>
    </div>
  );

  const newsPage = (
    <div className={formCss.root}>
      <div className={s.pageHead}>
        <h5 className={formCss.title}>News Preferences</h5>
        <p className={s.pageIntro}>
          These shape For You on Home and the news in your email digest. To change how often the digest arrives,
          go to{' '}
          <button type="button" className={s.inlineLink} onClick={() => setPage('email preferences')}>
            Email Preferences
          </button>
          .
        </p>
      </div>

      {/* Topics */}
      <div ref={refs.topics} className={clsx(toggleCss.root, s.card, lit('topics') && s.cardHighlight)}>
        <div className={clsx(toggleCss.header, s.cardHeader)}>
          Topics{topics.length > 0 && ` · ${topics.length}`}
          {saved === 'topics' && <SavedNote />}
        </div>
        <div className={toggleCss.content}>
          {lit('topics') && (
            <p className={s.arrivalNote}>
              {topics.length === 0
                ? `Subscribe to a few topics to get news that fits your work in ${arrivalWhere}.`
                : `Unsubscribe from topics you don’t want in ${arrivalWhere}.`}
            </p>
          )}
          <div className={toggleCss.desc}>
            {mock.prefilledFrom && `We picked these from ${mock.prefilledFrom}. `}
            {topics.length > 0
              ? 'News tagged with them shows up in For You and your digest. Click one to unsubscribe.'
              : 'You’re not subscribed to any topics. Pick some to get news tagged with them in For You and your digest.'}
          </div>
          <div className={s.chips} role="group" aria-label="Topics">
            {topicOrder.map((topic) => {
              const on = topics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  className={clsx(s.chip, on && s.chipOn)}
                  aria-pressed={on}
                  title={on ? `Unsubscribe from #${topic}` : `Subscribe to #${topic}`}
                  onClick={() => toggleTopic(topic)}
                >
                  {on ? <CheckIcon /> : <PlusIcon />}#{topic}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Teams you follow */}
      <div ref={refs.teams} className={clsx(toggleCss.root, s.card, lit('teams') && s.cardHighlight)}>
        <div className={clsx(toggleCss.header, s.cardHeader)}>
          Teams you follow{mock.follows.length > 0 && ` · ${followingCount}`}
          {saved === 'teams' && <SavedNote />}
        </div>
        <div className={toggleCss.content}>
          {lit('teams') && (
            <p className={s.arrivalNote}>Follow teams to see their news in {arrivalWhere}.</p>
          )}
          <div className={toggleCss.desc}>News from these teams shows up in For You and your digest.</div>
          {mock.follows.length > 0 ? (
            <ul className={s.teams}>
              {mock.follows.map((t) => {
                const following = !unfollowed.includes(t.uid);
                return (
                  <li key={t.uid} className={s.team}>
                    <img src={t.logo} alt="" width={32} height={32} className={s.teamLogo} />
                    <div className={s.teamText}>
                      <a href={`/teams/${t.uid}`} className={s.teamName} onClick={(e) => e.preventDefault()}>
                        {t.name}
                      </a>
                      <span className={s.teamMeta}>{t.focusArea}</span>
                    </div>
                    <FollowButton
                      following={following}
                      name={t.name}
                      size="compact"
                      onClick={() => toggleFollow(t.uid)}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={s.emptyLine}>
              You don’t follow any teams yet.{' '}
              <a href="#" className={s.inlineLink} onClick={(e) => e.preventDefault()}>
                See teams to follow
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      {/* Prototype chrome, not product UI. */}
      <div className={s.switcher} role="group" aria-label="Prototype controls">
        <div className={s.switchGroup}>
          <span className={s.switchLabel}>Member</span>
          <div className={s.segmented}>
            {(Object.keys(PERSONAS) as Persona[]).map((p) => (
              <button
                key={p}
                type="button"
                className={clsx(s.segment, persona === p && s.segmentActive)}
                aria-pressed={persona === p}
                onClick={() => switchPersona(p)}
              >
                {PERSONAS[p].label}
              </button>
            ))}
          </div>
        </div>
        <div className={s.switchGroup}>
          <span className={s.switchLabel}>Arrived from</span>
          <div className={s.segmented}>
            {ARRIVALS.map((o) => (
              <button
                key={o.v}
                type="button"
                className={clsx(s.segment, arrival === o.v && s.segmentActive)}
                aria-pressed={arrival === o.v}
                onClick={() => switchArrival(o.v)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={shellCss.privacy}>
        <div className={shellCss.privacy__main}>
          <aside className={shellCss.privacy__main__aside}>
            <SettingsMenu activeItem={page} onSelect={setPage} />
          </aside>
          <div className={shellCss.privacy__main__content}>{page === 'news preferences' ? newsPage : emailPage}</div>
        </div>
      </div>
    </div>
  );
}
