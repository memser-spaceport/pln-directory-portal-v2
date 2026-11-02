'use client';

/**
 * LAB-3038: News preferences with a long tag list (44 tags), "Show more" and
 * "Show less". Starts from production's page (components/page/news-preferences/
 * NewsPreferences.tsx) with mock data; only the Topics card changes.
 *
 * Two options for the open question, in the "Limit" switch:
 *   Per theme ..... each theme shows its first 8 tags; a longer theme ends its
 *                   chip row with "Show N more" / "Show less" (one per theme).
 *   Whole list .... the first 20 tags of the list, in theme order; one
 *                   "Show all 44 tags" / "Show fewer tags" under the themes.
 *
 * Rules in both options:
 *   - A tag the member picked always shows, also after the limit. A tag stays
 *     where it is for the rest of the visit after a toggle, so a removed pick
 *     can be put back in place (production's "pinned" rule).
 *   - Tags keep their order (alphabetical in a theme); picks do not move up.
 *   - A theme with 8 tags or fewer has no link. A theme that would hide only
 *     one tag shows it: "Show 1 more" takes the same room as the tag.
 *   - While the search has text, the limit is off: every match shows, and no
 *     link shows. Clearing the search puts back the open/closed state.
 *
 * Reuse map:
 *   app/settings/email/page.module.css ........ settings shell (aside + content)
 *   EmailPreferencesForm.module.scss .......... page root + title
 *   Newsletter.module.scss .................... cards
 *   NewsPreferences.module.scss ............... production page classes (chips,
 *                                               search, themes, teams), imported as is
 *   components/ui/FollowButton ................ follow toggle
 *   ./SettingsMenu ............................ copy of digest-topics' menu
 *   NEW: .moreLink, the "Show more" text button (brand, chip height, at the end
 *   of the chip row) in ./DesignTheLongTagListOnNePrototype.module.scss.
 * Simplified: no data hooks, no tracking, no save request (a mock "Saved").
 *
 * Version 2 (Polina, 2026-11-02): the "New member" state follows no teams. The
 * Teams card shows production's empty line, then "Teams to follow": 4 teams from
 * the focus areas of the member's team, each with a Follow button, and "See all
 * teams". A follow keeps the team in its place and adds to the card count.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';

import shellCss from '@/app/settings/email/page.module.css';
import formCss from '@/components/page/email-preferences/components/EmailPreferencesForm/EmailPreferencesForm.module.scss';
import toggleCss from '@/components/page/email-preferences/components/Newsletter/Newsletter.module.scss';
import prodCss from '@/components/page/news-preferences/NewsPreferences.module.scss';
import { FollowButton } from '@/components/ui/FollowButton';
import { CloseIcon, SearchIcon } from '@/components/icons';

import { SettingsMenu } from './SettingsMenu';
import {
  FOLLOWED_TEAMS,
  PER_THEME_LIMIT,
  PERSONAS,
  SUGGESTED_TEAMS,
  TAG_THEMES,
  WHOLE_LIST_LIMIT,
  type MockTeam,
  type Persona,
  type TagTheme,
} from './mocks';
import s from './DesignTheLongTagListOnNePrototype.module.scss';

type Mode = 'theme' | 'list';

const MODES: { v: Mode; label: string }[] = [
  { v: 'theme', label: `Per theme (${PER_THEME_LIMIT})` },
  { v: 'list', label: `Whole list (${WHOLE_LIST_LIMIT})` },
];

/** Copy of production's normalize(): "#Frontier tech" and "frontier-tech" both find #frontier-tech. */
function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[\s_]+/g, '-');
}

/** Production's search rule: a query that names a theme shows the whole theme; empty themes go. */
function searchThemes(themes: TagTheme[], query: string): TagTheme[] {
  const q = normalize(query);
  return themes
    .map(({ title, slugs }) => ({
      title,
      slugs: q && !normalize(title).includes(q) ? slugs.filter((slug) => slug.includes(q)) : slugs,
    }))
    .filter((theme) => theme.slugs.length > 0);
}

const SORTED_THEMES: TagTheme[] = TAG_THEMES.map((t) => ({
  title: t.title,
  slugs: [...t.slugs].sort((a, b) => a.localeCompare(b)),
}));
const TOTAL_TAGS = SORTED_THEMES.reduce((n, t) => n + t.slugs.length, 0);

export default function DesignTheLongTagListOnNePrototype() {
  const [mode, setMode] = useState<Mode>('theme');
  const [persona, setPersona] = useState<Persona>('picks');
  const [tags, setTags] = useState<string[]>(PERSONAS.picks.tags);
  const [seeded, setSeeded] = useState(PERSONAS.picks.seeded);
  // Picks at page open plus every tag toggled in this visit: they always show.
  const [kept, setKept] = useState<Set<string>>(() => new Set(PERSONAS.picks.tags));
  const [openThemes, setOpenThemes] = useState<Set<string>>(() => new Set());
  const [listOpen, setListOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [unfollowed, setUnfollowed] = useState<Set<string>>(() => new Set());
  // Version 2: a new member follows no teams and sees "Teams to follow".
  const [followsTeams, setFollowsTeams] = useState(PERSONAS.picks.followsTeams);
  const [newFollows, setNewFollows] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(t);
  }, [saved]);

  const reset = (p: Persona, m: Mode) => {
    setPersona(p);
    setMode(m);
    setTags(PERSONAS[p].tags);
    setSeeded(PERSONAS[p].seeded);
    setKept(new Set(PERSONAS[p].tags));
    setOpenThemes(new Set());
    setListOpen(false);
    setQuery('');
    setFollowsTeams(PERSONAS[p].followsTeams);
    setUnfollowed(new Set());
    setNewFollows(new Set());
  };

  const toggleTag = (slug: string) => {
    setSeeded(false);
    setKept((k) => new Set(k).add(slug));
    setTags((current) => (current.includes(slug) ? current.filter((t) => t !== slug) : [...current, slug]));
    setSaved(true);
  };

  const toggleTheme = (title: string) =>
    setOpenThemes((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  const searching = query.trim().length > 0;

  // What each theme shows, and how many tags the limit hides.
  const view = useMemo(() => {
    if (searching) {
      return searchThemes(SORTED_THEMES, query).map((t) => ({ ...t, visible: t.slugs, hidden: 0 }));
    }
    if (mode === 'theme') {
      return SORTED_THEMES.map((t) => {
        const visible =
          openThemes.has(t.title) || t.slugs.length <= PER_THEME_LIMIT
            ? t.slugs
            : t.slugs.filter((slug, i) => i < PER_THEME_LIMIT || kept.has(slug));
        // "Show 1 more" takes the room of the tag it hides: show that tag instead.
        if (t.slugs.length - visible.length < 2) return { ...t, visible: t.slugs, hidden: 0 };
        return { ...t, visible, hidden: t.slugs.length - visible.length };
      });
    }
    let index = 0;
    return SORTED_THEMES.map((t) => {
      const visible = t.slugs.filter((slug) => listOpen || index++ < WHOLE_LIST_LIMIT || kept.has(slug));
      if (listOpen) index += t.slugs.length;
      return { ...t, visible, hidden: t.slugs.length - visible.length };
    }).filter((t) => t.visible.length > 0);
  }, [searching, query, mode, openThemes, listOpen, kept]);

  const listHidden = mode === 'list' && !searching ? TOTAL_TAGS - view.reduce((n, t) => n + t.visible.length, 0) : 0;

  const renderTagChip = (slug: string) => {
    const on = tags.includes(slug);
    return (
      <button
        key={slug}
        type="button"
        className={clsx(prodCss.chip, on && prodCss.chipOn)}
        aria-pressed={on}
        title={on ? `Unsubscribe from #${slug}` : `Subscribe to #${slug}`}
        onClick={() => toggleTag(slug)}
      >
        {on ? <CheckIcon /> : <PlusIcon />}#{slug}
      </button>
    );
  };

  const followingCount = followsTeams ? FOLLOWED_TEAMS.filter((t) => !unfollowed.has(t.uid)).length : newFollows.size;

  const flip = (set: Set<string>, uid: string) => {
    const next = new Set(set);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    return next;
  };

  const renderTeam = (t: MockTeam, following: boolean, onToggle: () => void) => (
    <li key={t.uid} className={prodCss.team}>
      <span className={prodCss.teamLogo} aria-hidden="true" />
      <div className={prodCss.teamText}>
        <span className={prodCss.teamName}>{t.name}</span>
        <span className={prodCss.teamMeta}>{t.focusAreas.join(', ')}</span>
      </div>
      <FollowButton following={following} name={t.name} size="compact" onClick={onToggle} />
    </li>
  );

  return (
    <div className={s.page}>
      <div className={s.switcher}>
        <div className={s.switchGroup}>
          <span className={s.switchLabel}>Limit</span>
          <div className={s.segmented}>
            {MODES.map((o) => (
              <button
                key={o.v}
                type="button"
                className={clsx(s.segment, mode === o.v && s.segmentActive)}
                aria-pressed={mode === o.v}
                onClick={() => reset(persona, o.v)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className={s.switchGroup}>
          <span className={s.switchLabel}>Member</span>
          <div className={s.segmented}>
            {(Object.keys(PERSONAS) as Persona[]).map((p) => (
              <button
                key={p}
                type="button"
                className={clsx(s.segment, persona === p && s.segmentActive)}
                aria-pressed={persona === p}
                onClick={() => reset(p, mode)}
              >
                {PERSONAS[p].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={shellCss.privacy}>
        <div className={shellCss.privacy__main}>
          <aside className={shellCss.privacy__main__aside}>
            <SettingsMenu activeItem="news preferences" onSelect={() => undefined} />
          </aside>
          <div className={shellCss.privacy__main__content}>
            <div className={formCss.root}>
              <div className={prodCss.pageHead}>
                <h5 className={formCss.title}>News Preferences</h5>
                <p className={prodCss.pageIntro}>
                  These shape <span className={prodCss.inlineLink}>For You</span> on Home and the news in your email
                  digest. To change how often the digest arrives, go to{' '}
                  <span className={prodCss.inlineLink}>Email Preferences</span>.
                </p>
              </div>

              {/* Topics: the only card that changes. */}
              <div className={clsx(toggleCss.root, prodCss.card)}>
                <div className={clsx(toggleCss.header, prodCss.cardHeader)}>
                  What do you want news about?
                  {saved && (
                    <span className={prodCss.saved} role="status">
                      <CheckIcon /> Saved
                    </span>
                  )}
                </div>
                <div className={toggleCss.content}>
                  <div className={toggleCss.desc}>
                    {seeded && tags.length > 0 && 'We picked these from your teams’ focus areas. '}
                    Pick a few tags. They shape For You and your digest.
                  </div>
                  <div className={prodCss.search}>
                    <input
                      ref={searchRef}
                      type="search"
                      value={query}
                      placeholder="Search tags"
                      aria-label="Search tags"
                      className={prodCss.searchInput}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query ? (
                      <button
                        type="button"
                        className={prodCss.searchClear}
                        aria-label="Clear search"
                        onClick={() => {
                          setQuery('');
                          searchRef.current?.focus();
                        }}
                      >
                        <CloseIcon />
                      </button>
                    ) : (
                      <SearchIcon className={prodCss.searchIcon} aria-hidden="true" />
                    )}
                  </div>
                  <div className={prodCss.themes} role="group" aria-label="Topics">
                    {view.map((theme) => {
                      const long = mode === 'theme' && !searching && theme.slugs.length > PER_THEME_LIMIT + 1;
                      const open = openThemes.has(theme.title);
                      return (
                        <div key={theme.title} className={prodCss.theme} role="group" aria-label={theme.title}>
                          <span className={prodCss.themeTitle} aria-hidden="true">
                            {theme.title}
                          </span>
                          <div className={prodCss.chips}>
                            {theme.visible.map(renderTagChip)}
                            {long && (open || theme.hidden > 0) && (
                              <button
                                type="button"
                                className={s.moreLink}
                                aria-expanded={open}
                                aria-label={
                                  open
                                    ? `Show fewer ${theme.title} tags`
                                    : `Show ${theme.hidden} more ${theme.title} tags`
                                }
                                onClick={() => toggleTheme(theme.title)}
                              >
                                {open ? 'Show less' : `Show ${theme.hidden} more`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {searching && view.length === 0 && (
                      <p className={clsx(prodCss.emptyLine, prodCss.noMatch)}>No tags match “{query.trim()}”.</p>
                    )}
                    {mode === 'list' && !searching && (listOpen || listHidden > 0) && (
                      <button
                        type="button"
                        className={clsx(s.moreLink, s.moreLinkList)}
                        aria-expanded={listOpen}
                        onClick={() => setListOpen((v) => !v)}
                      >
                        {listOpen ? 'Show fewer tags' : `Show all ${TOTAL_TAGS} tags`}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Teams you follow: production's card with mock teams. Version 2: the
                  "New member" state follows no teams, so the card adds "Teams to follow". */}
              <div className={clsx(toggleCss.root, prodCss.card)}>
                <div className={clsx(toggleCss.header, prodCss.cardHeader)}>
                  Teams you follow{(followsTeams || followingCount > 0) && ` · ${followingCount}`}
                </div>
                <div className={toggleCss.content}>
                  <div className={toggleCss.desc}>News from these teams shows up in For You and your digest.</div>
                  {followsTeams ? (
                    <ul className={prodCss.teams}>
                      {FOLLOWED_TEAMS.map((t) =>
                        renderTeam(t, !unfollowed.has(t.uid), () => setUnfollowed((u) => flip(u, t.uid))),
                      )}
                    </ul>
                  ) : (
                    <>
                      {newFollows.size === 0 && (
                        <p className={prodCss.emptyLine}>You don&apos;t follow any teams yet.</p>
                      )}
                      <section className={s.suggest} aria-labelledby="lab3038-teams-to-follow">
                        <div className={s.suggestHead}>
                          <h6 id="lab3038-teams-to-follow" className={s.suggestTitle}>
                            Teams to follow
                          </h6>
                          <span className={s.suggestNote}>From the focus areas of your team</span>
                        </div>
                        <ul className={prodCss.teams}>
                          {SUGGESTED_TEAMS.map((t) =>
                            renderTeam(t, newFollows.has(t.uid), () => setNewFollows((f) => flip(f, t.uid))),
                          )}
                        </ul>
                        <span className={clsx(prodCss.inlineLink, s.suggestMore)}>See all teams</span>
                      </section>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
