'use client';

import { Fragment, useState, type ReactNode } from 'react';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { Badge } from '@/components/common/Badge/Badge';
import { Button } from '@/components/common/Button/Button';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
// Reuse the Member-page contact components (icon + handle links) for the connectors.
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { getProfileFromURL } from '@/utils/common.utils';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
// Reuse the production path-card styling so the prototype tracks production.
import pd from '@/components/page/investors/WarmPathDetail/WarmPathDetail.module.scss';
import {
  pathChainNodes,
  pathDirectness,
  resolveRoute,
  type ContactPerson,
  type MockInvestor,
  type MockPath,
  type OrgConnector,
  type RouteMediator,
  type TeamLink,
} from './mocks';
import { PeopleChain, PersonGlyph, OrgGlyph } from './PeopleChain';
import { ArrowUpRightIcon } from './ArrowUpRightIcon';
import { ChevronDownIcon, PencilSimpleLineIcon } from '@/components/icons';
import x from './WarmIntrosImprovements.module.scss';

interface Props {
  paths: MockPath[];
  investor: MockInvestor;
}

// Issue #3: production renders ALL paths at once. Here we show the best path
// plus the next alternative (so a Direct and a Hop are visible side by side)
// and collapse the rest behind a "Show N more" toggle.
const TOP_N = 2;

export function WarmPathPanel({ paths, investor }: Props) {
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
          <PathCard key={p.id} path={p} investor={investor} />
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

// One path card: header (proximity + rank + a quiet "suggest a correction" icon),
// description, the people chain, the PL tie stat, and the contact disclosure.
function PathCard({ path, investor }: { path: MockPath; investor: MockInvestor }) {
  const route = resolveRoute(path);
  // The PL tie/recency stat (only on a known PL node) lives on its own line under
  // the chain rather than inline in the chain.
  const plTie = route.pl.known ? route.pl : null;
  // "Suggest a correction" is demoted from a per-card text link to a quiet pencil
  // icon in the header — visible but low-attention. Clicking reveals the form.
  const [correctionOpen, setCorrectionOpen] = useState(false);
  // Contact details — a secondary button that sits inline at the end of the node
  // chain; clicking it reveals the mediator's contact card below.
  const [contactOpen, setContactOpen] = useState(false);
  const contactLabel = route.mediator?.known === false ? 'Organization details' : 'Contact details';
  // A single inline toggle at the end of the chain row — the chevron flips and the
  // card reveals/hides below.
  const contactButton = route.mediator ? (
    <button type="button" className={x.contactInlineBtn} onClick={() => setContactOpen((v) => !v)} aria-expanded={contactOpen}>
      <span>{contactLabel}</span>
      <span className={`${x.contactInlineChevron} ${contactOpen ? x.contactInlineChevronOpen : ''}`} aria-hidden>
        <ChevronDownIcon width={13} height={13} />
      </span>
    </button>
  ) : null;

  return (
    <li className={`${pd.pathItem} ${x.pathCardFill}`}>
      <div className={`${pd.pathHead} ${x.pathHeadWrap}`}>
        <ProximityCodeBadge code={path.proximity_code} />
        <span className={`${pd.rank} ${x.rankSm}`}>
          {path.rank <= 1 ? 'Best path' : `Alternative #${path.rank}`}
          {pathDirectness(path) ? ` · ${pathDirectness(path)}` : ''} · {Math.round(path.score * 100)}% warm
        </span>
        <button
          type="button"
          className={x.correctionIcon}
          onClick={() => setCorrectionOpen((v) => !v)}
          aria-expanded={correctionOpen}
          aria-label="Suggest a correction"
          title="Suggest a correction"
        >
          <PencilSimpleLineIcon width={15} height={15} />
        </button>
      </div>

      {/* Header → description → nodes. The plain-English explanation reads as the
          caption above the chain. */}
      {path.explanation && <div className={`${pd.explanation} ${x.explanationSpaced}`}>{path.explanation}</div>}

      {/* The people chain — the unique, scannable part of each path — rendered
          large so the connectors are the card's visual hero. The Contact details
          button sits inline at the end of the row. */}
      <PeopleChain
        nodes={pathChainNodes(path, investor)}
        className={`${x.drawerChain} ${x.chainBig}`}
        trailing={contactButton}
      />

      {/* PL relationship quality, under the chain. */}
      {plTie && (typeof plTie.tie === 'number' || plTie.lastContact) && (
        <div className={x.chainTieStat}>
          {typeof plTie.tie === 'number' ? `tie ${plTie.tie.toFixed(2)}` : ''}
          {typeof plTie.tie === 'number' && plTie.lastContact ? ' · ' : ''}
          {plTie.lastContact ? `last email ${plTie.lastContact}` : ''}
        </div>
      )}

      {/* Revealed by the inline Contact details button. Only meaningful when a
          mediator bridges the path — a direct PL connection has no external
          contact to surface. */}
      {contactOpen && route.mediator && (
        <div className={x.contactReveal}>
          <RouteBlocks path={path} />
        </div>
      )}

      {correctionOpen && (
        <div className={`${pd.correction} ${x.correctionRow}`}>
          <div className={x.correctionNote}>
            In production this opens the correction form — wrong connector, caliber too high/low, or invalid path.{' '}
            <Button style="link" variant="secondary" underline size="s" onClick={() => setCorrectionOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

// Per-node detail for a path's route: the PL side (known person + tie stat, or
// "not yet identified"), then the mediator if the path is indirect.
function RouteBlocks({ path }: { path: MockPath }) {
  const route = resolveRoute(path);
  // Only the mediator's contact is surfaced. Even when we know the PL teammate,
  // their contact isn't shown — they're reached internally; the tie/recency stat
  // under the chain already conveys that relationship.
  return <div className={x.contactBlock}>{route.mediator && <MediatorBlock mediator={route.mediator} />}</div>;
}

function MediatorBlock({ mediator }: { mediator: RouteMediator }) {
  if (mediator.known) {
    // Solid-bordered container — same shape as the org card, without the dashes.
    return (
      <div className={`${x.contactBox} ${x.contactCardBox}`}>
        <ConnectorCard person={mediator} />
      </div>
    );
  }
  return (
    <div className={`${x.contactBox} ${x.orgBox}`}>
      <TeamUnknownBlock team={mediator.team} />
    </div>
  );
}

function TeamUnknownBlock({ team }: { team: TeamLink }) {
  const href = team.teamUid ? `/teams/${team.teamUid}` : undefined;
  return (
    <div className={x.connectorIdentity}>
      {href ? (
        <a className={x.memberAvatarLink} href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          <img className={x.orgLogo} src={team.logo ?? getDefaultAvatar(team.name)} alt="" width={32} height={32} />
        </a>
      ) : (
        <span className={x.orgAvatar} aria-hidden>
          <OrgGlyph />
        </span>
      )}
      <span className={x.memberText}>
        <span className={x.orgNameRow}>
          <span className={x.memberName}>{team.name}</span>
          <Badge variant="default" className={x.orgBadge}>
            Connection unknown
          </Badge>
        </span>
        <span className={x.orgDescription}>This team can route the intro — reach out and ask for the right person.</span>
      </span>
    </div>
  );
}

// One connector: avatar (network) or grey icon (external) + name, the role with
// the team(s) inline as text links (+N more to expand the rest), and the contact
// channels on their own row below so emails line up across cards.
function ConnectorCard({
  person,
  pl,
  tie,
  lastContact,
}: {
  person: ContactPerson;
  pl?: boolean;
  tie?: number;
  lastContact?: string;
}) {
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
              // In the PL network (= in LabOS): blue name + an always-visible arrow.
              <a
                className={`${x.memberNameLink} ${x.memberNameLabOs}`}
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
            {pl && (
              <Badge variant="default" className={x.orgBadge}>
                PL
              </Badge>
            )}
          </span>

          {/* Relationship-quality stat on a known PL tie (amber when weak). */}
          {(typeof tie === 'number' || lastContact) && (
            <span className={`${x.tieStat} ${typeof tie === 'number' && tie < 0.45 ? x.tieStatWeak : ''}`}>
              {typeof tie === 'number' ? `tie ${tie.toFixed(2)}` : ''}
              {typeof tie === 'number' && lastContact ? ' · ' : ''}
              {lastContact ? `last email ${lastContact}` : ''}
            </span>
          )}

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

      {/* Contacts underneath the profile, divided from the identity above. */}
      <div className={x.cardChannels}>
        <ContactChannels person={person} />
      </div>
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
              {/* DS Badge, neutral grey for both tags. */}
              {org.tags.map((tag) => (
                <Badge key={tag} variant="default" className={x.orgBadge}>
                  {tag}
                </Badge>
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

// Compact contact channels rendered next to a name: icon-only links with NO
// dividers, and the email LAST shown as just an icon + copy button (never the
// full address). Shared by the founder/connector card and the investor header.
export function CompactChannels({
  icons,
  email,
  fullEmail,
  dense,
  trailing,
}: {
  icons: { type: string; handle: string }[];
  email?: string;
  /** Show the full email address (default: icon + copy only). */
  fullEmail?: boolean;
  /** Tighter spacing between channels. */
  dense?: boolean;
  trailing?: ReactNode;
}) {
  if (icons.length === 0 && !email && !trailing) return null;
  const emailLink = (
    <ProfileSocialLink
      type="email"
      handle={email ?? ''}
      profile={getProfileFromURL(email ?? '', 'email')}
      logo={getContactLogoByProvider('email')}
      height={20}
      width={20}
      callback={() => {}}
    />
  );
  return (
    <span className={`${x.nameChannels} ${dense ? x.nameChannelsDense : ''}`}>
      {icons.map((ch) => (
        <span key={ch.type} className={x.iconOnly}>
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
      ))}
      {email && (
        <span className={x.emailIconGroup}>
          {fullEmail ? emailLink : <span className={x.iconOnly}>{emailLink}</span>}
          <CopyButton text={email} className={x.copyEmail} />
        </span>
      )}
      {trailing}
    </span>
  );
}

// The founder/connector's channels: LinkedIn + Telegram icons, then the full
// email + copy last.
function ContactChannels({ person }: { person: ContactPerson }) {
  return (
    <CompactChannels
      icons={[
        ...(person.linkedin ? [{ type: 'linkedin', handle: person.linkedin }] : []),
        ...(person.telegram ? [{ type: 'telegram', handle: person.telegram }] : []),
      ]}
      email={person.email}
      fullEmail
      dense
    />
  );
}
