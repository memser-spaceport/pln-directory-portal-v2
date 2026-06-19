'use client';

import { Fragment, useState } from 'react';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { Button } from '@/components/common/Button/Button';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
// Reuse the Member-page contact components (icon + handle links) for the connectors.
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { getProfileFromURL } from '@/utils/common.utils';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
// Reuse the production path-card styling so the prototype tracks production.
import pd from '@/components/page/investors/WarmPathDetail/WarmPathDetail.module.scss';
import { ArrowUpRightIcon } from '@/components/icons';
import type { ContactPerson, MockPath, OrgConnector, TeamLink } from './mocks';
import { PersonGlyph, OrgGlyph } from './PeopleChain';
import x from './WarmIntrosImprovements.module.scss';

interface Props {
  paths: MockPath[];
}

// Issue #3: production renders ALL paths at once. Here we show only the best
// path and collapse the rest behind a "Show N more" toggle.
const TOP_N = 1;

export function WarmPathPanel({ paths }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (paths.length === 0) {
    return <div className={x.coldNote}>No warm path yet — this investor would be cold outreach.</div>;
  }

  const visible = expanded ? paths : paths.slice(0, TOP_N);
  const hidden = paths.length - visible.length;

  return (
    <div className={pd.root}>
      <ol className={pd.pathList}>
        {visible.map((p) => (
          <li key={p.id} className={pd.pathItem}>
            <div className={`${pd.pathHead} ${x.pathHeadWrap}`}>
              {/* One confidence signal: the proximity code stays as a quiet
                  reference (no % on it); warmth is the single number. */}
              <ProximityCodeBadge code={p.proximity_code} />
              <span className={`${pd.rank} ${x.rankSm}`}>
                {p.rank <= 1 ? 'Best path' : `Alternative #${p.rank}`} · {Math.round(p.score * 100)}% warm
              </span>
            </div>

            {p.explanation && <div className={`${pd.explanation} ${x.explanationSpaced}`}>{p.explanation}</div>}

            {/* Either a known person (with their team(s) + contacts) or an
                org-led line where the specific person is unknown. */}
            {p.orgConnector ? <OrgBlock org={p.orgConnector} /> : <ContactBlock path={p} />}

            <div className={`${pd.correction} ${x.correctionRow}`}>
              <CorrectionLink />
            </div>
          </li>
        ))}
      </ol>

      {hidden > 0 && (
        <button type="button" className={x.showMoreBtn} onClick={() => setExpanded(true)}>
          ＋ Show {hidden} more path{hidden === 1 ? '' : 's'}
        </button>
      )}
      {expanded && paths.length > TOP_N && (
        <button type="button" className={x.showMoreBtn} onClick={() => setExpanded(false)}>
          – See less
        </button>
      )}
    </div>
  );
}

// "Suggest a correction" — same affordance as production WarmPathDetail. The
// real form (wrong connector / caliber / invalid path) is wired in prod; here
// it's a stubbed inline note.
function CorrectionLink() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button
        style="link"
        variant="secondary"
        underline
        size="s"
        className={x.correctionLink}
        onClick={() => setOpen(true)}
      >
        Suggest a correction
      </Button>
    );
  }
  return (
    <div className={x.correctionNote}>
      In production this opens the correction form — wrong connector, caliber too high/low, or invalid path.{' '}
      <Button style="link" variant="secondary" underline size="s" onClick={() => setOpen(false)}>
        Close
      </Button>
    </div>
  );
}

function ContactBlock({ path }: { path: MockPath }) {
  if (!path.contact) return null;

  // Only the closest connector — warmth is scored on this single tie, so we
  // don't stack the rest of the team underneath. No caption: the explanation
  // above + the card itself already say "this is the person to reach".
  return (
    <div className={x.contactBlock}>
      <div className={x.contactBox}>
        <ConnectorCard person={path.contact} />
      </div>
    </div>
  );
}

// One connector: avatar (network) or grey icon (external) + name, the role with
// the team(s) inline as text links (+N more to expand the rest), and the contact
// channels on their own row below so emails line up across cards.
function ConnectorCard({ person }: { person: ContactPerson }) {
  const teams = person.teams ?? [];
  const [teamsExpanded, setTeamsExpanded] = useState(false);
  const extraTeams = teams.length - 1;
  const shownTeams = teamsExpanded ? teams : teams.slice(0, 1);
  const memberHref = person.memberUid ? `/members/${person.memberUid}` : undefined;

  const avatar = memberHref ? (
    <img className={x.memberAvatar} src={getDefaultAvatar(person.name)} alt="" width={32} height={32} />
  ) : (
    <span className={x.memberAvatarExternal} aria-hidden title="Not in the PL network">
      <PersonGlyph />
    </span>
  );

  return (
    <div className={x.connectorCard}>
      <div className={x.connectorIdentity}>
        {memberHref ? (
          <a
            className={x.memberAvatarLink}
            href={memberHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {avatar}
          </a>
        ) : (
          avatar
        )}

        <span className={x.memberText}>
          <span className={x.memberNameRow}>
            {memberHref ? (
              <a
                className={x.memberNameLink}
                href={memberHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <span className={x.memberName}>{person.name}</span>
                <span className={x.memberArrow} aria-hidden>
                  <ArrowUpRightIcon width={12} height={12} />
                </span>
              </a>
            ) : (
              <span className={x.memberName}>{person.name}</span>
            )}
          </span>

          {/* Role line carries the team(s) inline as links, side by side. */}
          <span className={x.memberRoleLine}>
            {person.role}
            {teams.length > 0 && (
              <>
                {' · '}
                {shownTeams.map((t, i) => (
                  <Fragment key={t.teamUid ?? t.name}>
                    {i > 0 && (
                      <span className={x.teamDivider} aria-hidden>
                        ·
                      </span>
                    )}
                    <TeamInlineLink team={t} />
                  </Fragment>
                ))}
                {extraTeams > 0 && (
                  <button
                    type="button"
                    className={x.teamMoreBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTeamsExpanded((v) => !v);
                    }}
                  >
                    {teamsExpanded ? 'Show less' : `+${extraTeams} more`}
                  </button>
                )}
              </>
            )}
          </span>
        </span>
      </div>

      <ContactChannels person={person} />
    </div>
  );
}

// A team rendered as an inline text link (no logo) with a small grey ↗.
function TeamInlineLink({ team }: { team: TeamLink }) {
  if (!team.teamUid) return <span className={x.teamInline}>{team.name}</span>;
  return (
    <a
      className={x.teamInline}
      href={`/teams/${team.teamUid}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {team.name}
      <span className={x.teamInlineArrow} aria-hidden>
        <ArrowUpRightIcon width={11} height={11} />
      </span>
    </a>
  );
}

// Org-led connector: we know the company can route an intro but not who. Same
// placement as a person card — name, then the signal tags under it, then the
// description, then the org's contacts on their own row (aligned with people).
function OrgBlock({ org }: { org: OrgConnector }) {
  // PL-network org → clickable logo + name (link to its team profile); external
  // firm → dashed building glyph + plain name.
  const orgHref = org.teamUid ? `/teams/${org.teamUid}` : undefined;

  return (
    <div className={x.contactBlock}>
      <div className={`${x.contactBox} ${x.orgBox}`}>
        <div className={x.connectorIdentity}>
          {orgHref ? (
            <a
              className={x.memberAvatarLink}
              href={orgHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <img className={x.orgLogo} src={org.logo ?? getDefaultAvatar(org.name)} alt="" width={32} height={32} />
            </a>
          ) : (
            <span className={x.orgAvatar} aria-hidden>
              <OrgGlyph />
            </span>
          )}
          <span className={x.memberText}>
            <span className={x.orgNameRow}>
              {orgHref ? (
                <a
                  className={x.memberNameLink}
                  href={orgHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={x.memberName}>{org.name}</span>
                  <span className={x.memberArrow} aria-hidden>
                    <ArrowUpRightIcon width={12} height={12} />
                  </span>
                </a>
              ) : (
                <span className={x.memberName}>{org.name}</span>
              )}
              {org.tags.map((tag) => (
                <span key={tag} className={x.orgTag}>
                  {tag}
                </span>
              ))}
            </span>
            <span className={x.orgDescription}>{org.description}</span>
          </span>
        </div>

        {(org.email || org.website) && (
          <div className={x.contactChannels}>
            {org.email && (
              <span className={x.emailGroup}>
                <ProfileSocialLink
                  type="email"
                  handle={org.email}
                  profile={getProfileFromURL(org.email, 'email')}
                  logo={getContactLogoByProvider('email')}
                  height={20}
                  width={20}
                  callback={() => {}}
                />
                <CopyButton text={org.email} className={x.copyEmail} />
              </span>
            )}
            {org.email && org.website && <span className={x.channelDivider} aria-hidden />}
            {/* Website: icon only (the email is the one shown in full). */}
            {org.website && (
              <span className={x.iconOnly}>
                <ProfileSocialLink
                  type="website"
                  handle={org.website}
                  profile={getProfileFromURL(org.website, 'website')}
                  logo={getContactLogoByProvider('website')}
                  height={20}
                  width={20}
                  callback={() => {}}
                />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// A connector's individual contact channels (email + copy, linkedin, telegram).
function ContactChannels({ person }: { person: ContactPerson }) {
  const channels: { type: string; handle: string }[] = [];
  if (person.email) channels.push({ type: 'email', handle: person.email });
  if (person.linkedin) channels.push({ type: 'linkedin', handle: person.linkedin });
  if (person.telegram) channels.push({ type: 'telegram', handle: person.telegram });
  if (channels.length === 0) return null;

  return (
    <div className={x.contactChannels}>
      {channels.map((ch, i) => (
        <Fragment key={ch.type}>
          {i > 0 && <span className={x.channelDivider} aria-hidden />}
          {ch.type === 'email' ? (
            <span className={x.emailGroup}>
              <ProfileSocialLink
                type="email"
                handle={ch.handle}
                profile={getProfileFromURL(ch.handle, 'email')}
                logo={getContactLogoByProvider('email')}
                height={20}
                width={20}
                callback={() => {}}
              />
              <CopyButton text={ch.handle} className={x.copyEmail} />
            </span>
          ) : (
            <span className={x.iconOnly}>
              <ProfileSocialLink
                type={ch.type}
                handle={ch.handle}
                profile={getProfileFromURL(ch.handle, ch.type)}
                logo={getContactLogoByProvider(ch.type)}
                height={20}
                width={20}
                callback={() => {}}
              />
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
