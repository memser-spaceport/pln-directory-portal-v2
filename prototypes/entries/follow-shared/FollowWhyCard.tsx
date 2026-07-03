'use client';

import { useMemo, useState } from 'react';

import { FollowButton } from './FollowButton';
import { FollowControl, type SocialProof } from './FollowControl';
import { initials, prefsFor, type FollowableKind } from './types';
import s from './FollowWhyCard.module.scss';

export interface FollowSuggestion {
  id: string;
  name: string;
  subtitle?: string;
  image?: string | null;
  kind: FollowableKind;
}

interface Props {
  name: string;
  kind: FollowableKind;
  following: boolean;
  count: number;
  onToggle: () => void;
  socialProof?: SocialProof;
  /** Related follows surfaced once you're following (the "follow more" loop). */
  suggestions?: FollowSuggestion[];
  /** Hide the card's own follow action — when the button lives outside the card. */
  hideAction?: boolean;
  /** Once following, drop the "why" body and keep only the suggestions. */
  hideBodyWhenFollowing?: boolean;
}

/**
 * Right-rail companion to the header Follow button: answers "why follow?" with a
 * plain promise of what lands in your feed, then offers the action with network
 * social proof. Once following, it confirms the state and surfaces related
 * people/teams to follow next. Shares follow state with the header control.
 */
export function FollowWhyCard({
  name,
  kind,
  following,
  count,
  onToggle,
  socialProof,
  suggestions,
  hideAction,
  hideBodyWhenFollowing,
}: Props) {
  const prefs = useMemo(() => prefsFor(kind), [kind]);
  const noun = kind === 'team' ? 'this team' : name.split(' ')[0];

  // Once following, optionally collapse the "why" body and keep only suggestions.
  const showBody = !(hideBodyWhenFollowing && following);

  return (
    <section className={s.card} aria-label={following ? `Following ${name}` : `Why follow ${name}`}>
      {showBody && (
        <header className={s.head}>
          <span className={s.eyebrow}>{following ? 'Following' : 'Stay in the loop'}</span>
          <h3 className={s.title}>{following ? `You're following ${name}` : `Get updates from ${noun}`}</h3>
          <p className={s.lede}>
            {following
              ? `${kind === 'team' ? "The team's" : 'Their'} updates now rank first in your feed. You'll be notified about:`
              : `Follow to pull ${noun}'s updates to the top of your feed and get notified about:`}
          </p>
        </header>
      )}

      {showBody && (
        <ul className={s.promise}>
          {prefs.map((p) => (
            <li key={p.key} className={s.promiseItem}>
              <span className={s.promiseDot} aria-hidden="true" />
              <span className={s.promiseText}>
                <span className={s.promiseLabel}>{p.label}</span>
                <span className={s.promiseHelper}>{p.helper}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {!hideAction && (
        <div className={s.action}>
          <FollowControl
            name={name}
            kind={kind}
            following={following}
            count={count}
            onToggle={onToggle}
            align="start"
            block
            socialProof={socialProof}
          />
        </div>
      )}

      {following && suggestions && suggestions.length > 0 && (
        <div className={s.suggestions}>
          <span className={s.suggestTitle}>{kind === 'team' ? 'Related teams to follow' : 'People you may also want to follow'}</span>
          <ul className={s.suggestList}>
            {suggestions.map((sug) => (
              <SuggestionRow key={sug.id} suggestion={sug} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SuggestionRow({ suggestion }: { suggestion: FollowSuggestion }) {
  const [followed, setFollowed] = useState(false);
  const isTeam = suggestion.kind === 'team';
  return (
    <li className={s.suggestRow}>
      {suggestion.image ? (
        <img className={s.suggestAvatar} data-team={isTeam || undefined} src={suggestion.image} alt="" loading="lazy" />
      ) : (
        <div className={s.suggestAvatar} data-fallback="true" data-team={isTeam || undefined} aria-hidden="true">
          {initials(suggestion.name)}
        </div>
      )}
      <div className={s.suggestText}>
        <span className={s.suggestName}>{suggestion.name}</span>
        {suggestion.subtitle && <span className={s.suggestSub}>{suggestion.subtitle}</span>}
      </div>
      <FollowButton following={followed} onClick={() => setFollowed((v) => !v)} name={suggestion.name} size="xs" />
    </li>
  );
}
