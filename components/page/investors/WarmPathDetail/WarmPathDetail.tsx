'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQueryStates } from 'nuqs';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import { useGetPathsForTarget } from '@/services/investors/hooks/useGetPathsForTarget';
import { useSubmitCorrection } from '@/services/investors/hooks/useSubmitCorrection';
import { resolveBestPath } from '@/services/investors/pathfinder.service';
import { PathSummaryGraph } from '../PathSummaryGraph/PathSummaryGraph';
import { ChevronDownIcon, PencilSimpleLineIcon } from '@/components/icons';
import { useInvestorsAnalytics } from '@/analytics/investors.analytics';
import { PATH_CONNECTOR_LABEL } from '@/services/investors/constants';
import type {
  CorrectionInput,
  PathConnectorType,
  PathContact,
  PathCorrection,
  PathOrgConnector,
  PathfinderPath,
  RouteNode,
} from '@/services/investors/types';
import { ProximityCodeBadge } from '../ProximityCodeBadge/ProximityCodeBadge';
import { RouteChip } from '../RouteChip/RouteChip';
import { CopyButton } from '@/components/ui/CopyButton';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import s from './WarmPathDetail.module.scss';
import Image from 'next/image';

interface Props {
  investorId: string;
  bestProximityCode?: string | null;
  canEdit: boolean;
  /** Investor display name — shown as the destination node in the summary graph. */
  investorName?: string;
  /** Affinity last-email date (ISO) — shown under the summary graph as a relative time. */
  lastEmailAt?: string | null;
}

type CorrectionReason = 'caliber_too_high' | 'caliber_too_low' | 'wrong_connector' | 'path_invalid' | 'other';

const REASON_OPTIONS: { value: CorrectionReason; label: string }[] = [
  { value: 'caliber_too_high', label: 'Caliber is too high' },
  { value: 'caliber_too_low', label: 'Caliber is too low' },
  { value: 'wrong_connector', label: 'Wrong connector (the contact the path routes through)' },
  { value: 'path_invalid', label: 'This path is invalid' },
  { value: 'other', label: 'Something else' },
];

const CONNECTOR_CHOICES = (Object.keys(PATH_CONNECTOR_LABEL) as PathConnectorType[]).filter((c) => c !== 'C');

const LIST_ID_TO_TARGET_SET: Record<string, string> = {
  'neuro-lp': 'neuro-fund-i',
  'gold-coinvestors': 'gold-co-investors',
};

export function buildCorrection(
  path: PathfinderPath,
  reason: CorrectionReason,
  note: string,
  newConnector?: PathConnectorType | '',
): CorrectionInput {
  const subject = { subject_type: 'path' as const, subject_id: String(path.id) };
  switch (reason) {
    case 'caliber_too_high':
      return { ...subject, field: 'caliber', old_value: path.caliber ?? null, new_value: 'B', note };
    case 'caliber_too_low':
      return { ...subject, field: 'caliber', old_value: path.caliber ?? null, new_value: 'A', note };
    case 'wrong_connector':
      return {
        ...subject,
        field: 'connector_type',
        old_value: path.connector_type,
        new_value: newConnector || null,
        note,
      };
    case 'path_invalid':
      return { ...subject, field: 'valid', old_value: true, new_value: false, note };
    default:
      return { ...subject, field: 'note', note };
  }
}

const connectorLabel = (v: unknown): string =>
  (PATH_CONNECTOR_LABEL as Record<string, string>)[String(v)] ?? String(v ?? '—');

export function correctionSummary(c: PathCorrection): string {
  switch (c.field) {
    case 'caliber':
      return `Caliber ${c.old_value ?? '—'} → ${c.new_value ?? '—'}`;
    case 'connector_type':
      return `Connector ${connectorLabel(c.old_value)} → ${connectorLabel(c.new_value)}`;
    case 'valid':
      return 'Marked invalid';
    case 'note':
      return 'Note';
    default:
      return c.field;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

export function WarmPathDetail({ investorId, bestProximityCode, canEdit, investorName, lastEmailAt }: Props) {
  const [filters] = useQueryStates(investorsFilterParsers, { history: 'replace', shallow: true });
  const { data, isLoading } = useGetPathsForTarget(investorId, true);
  const { trackPathsViewed, trackCorrectionSubmitted, trackPathExpanded, trackContactDetailsExpanded } =
    useInvestorsAnalytics();
  const submitCorrection = useSubmitCorrection(investorId);

  const paths = useMemo(() => {
    const all = data?.paths ?? [];
    const targetSet = filters.wi_list_id ? LIST_ID_TO_TARGET_SET[filters.wi_list_id] : null;
    if (!targetSet) return all;
    const filtered = all.filter((p) => p.target_set === targetSet);
    return filtered.length > 0 ? filtered : all;
  }, [data, filters.wi_list_id]);
  const bestPath = useMemo(() => resolveBestPath(paths), [paths]);
  const [showAll, setShowAll] = useState(false);

  const viewedRef = useRef(false);
  useEffect(() => {
    if (data && !viewedRef.current) {
      viewedRef.current = true;
      trackPathsViewed({ investorId, pathCount: data.paths.length, bestProximityCode });
    }
  }, [data, investorId, bestProximityCode, trackPathsViewed]);

  // Contact details are collapsed by default to reduce card density; tracked per
  // path id so multiple expanded cards toggle independently. Reset for free on
  // investor switch via the key={investor_id} remount in InvestorDrawer.
  const [openContactIds, setOpenContactIds] = useState<Set<number>>(new Set());
  const toggleContacts = (pathId: number) =>
    setOpenContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(pathId)) {
        next.delete(pathId);
      } else {
        next.add(pathId);
        trackContactDetailsExpanded({ investorId, pathId });
      }
      return next;
    });

  const [openPathId, setOpenPathId] = useState<number | null>(null);
  const [reason, setReason] = useState<CorrectionReason>('caliber_too_high');
  const [note, setNote] = useState('');
  const [newConnector, setNewConnector] = useState<PathConnectorType | ''>('');

  const openFormFor = (pathId: number) => {
    setOpenPathId(pathId);
    setReason('caliber_too_high');
    setNote('');
    setNewConnector('');
  };

  const onSubmit = async (path: PathfinderPath) => {
    const correction = buildCorrection(path, reason, note.trim(), newConnector);
    const ok = await submitCorrection.mutateAsync(correction);
    if (ok) {
      trackCorrectionSubmitted({
        investorId,
        pathId: path.id,
        subjectType: correction.subject_type,
        field: correction.field,
      });
      setOpenPathId(null);
      setNote('');
      setNewConnector('');
    }
  };

  if (isLoading) return <div className={s.state}>Loading warm paths…</div>;
  if (paths.length === 0) {
    return (
      <div className={s.state}>
        No computed warm paths for this investor yet — run the pathfinder to populate paths.
      </div>
    );
  }

  const visiblePaths = showAll ? paths : paths.slice(0, 1);
  const hiddenCount = paths.length - 1;

  return (
    <div className={s.root}>
      {/*<PathSummaryGraph bestPath={bestPath} investorName={investorName ?? ''} lastEmailAt={lastEmailAt} />*/}
      <ol className={s.pathList}>
        {visiblePaths.map((p) => {
          const formOpen = openPathId === p.id;

          return (
            <li key={p.id} className={s.pathItem}>
              {/* Correction trigger — corner icon opening the same inline form */}
              {canEdit && (
                <button
                  type="button"
                  className={s.correctionIcon}
                  aria-label="Suggest a correction"
                  aria-expanded={formOpen}
                  onClick={() => (formOpen ? setOpenPathId(null) : openFormFor(p.id))}
                >
                  <PencilSimpleLineIcon width={14} height={14} />
                </button>
              )}

              {/* Header: proximity badge (path warmth %) + rank */}
              <div className={s.pathMeta}>
                <ProximityCodeBadge code={p.proximity_code} confidence={p.score} />
                <span className={s.warmth}>{p.rank === 1 ? 'Best path' : `Alternative #${p.rank}`}</span>
              </div>
              <p className={s.warmthSubtitle}>How strong this intro route is</p>

              {p.hop_chain.explanation?.trim() && <div className={s.explanation}>{p.hop_chain.explanation}</div>}
              {p.hop_chain.attribution_lines && p.hop_chain.attribution_lines.length > 0 && (
                <ul className={s.attributionList}>
                  {p.hop_chain.attribution_lines.map((line, i) => (
                    <li key={`${p.id}-attr-${i}`}>
                      {line.source}: {line.text}
                    </li>
                  ))}
                </ul>
              )}

              {/* Route chain + trailing details toggle */}
              {(p.hop_chain.routeNodes?.length || p.hop_chain.nodes.length > 0) && (
                <div className={s.chainRow}>
                  <div className={s.chain}>
                    {p.hop_chain.routeNodes
                      ? p.hop_chain.routeNodes.map((n, i) => (
                          <span key={`${p.id}-rn-${i}`} className={s.node}>
                            {i > 0 && <span className={s.arrow}>→</span>}
                            <RouteNodeChip node={n} />
                          </span>
                        ))
                      : p.hop_chain.nodes.map((n, i) => (
                          <span key={`${p.id}-${n.id}-${i}`} className={s.node}>
                            {i > 0 && <span className={s.arrow}>→</span>}
                            <RouteChip node={n} />
                          </span>
                        ))}
                  </div>
                  {(p.contact || p.org_connector) && (
                    <button
                      type="button"
                      className={s.detailsBtn}
                      onClick={() => toggleContacts(p.id)}
                      aria-expanded={openContactIds.has(p.id)}
                    >
                      {p.contact ? 'Contact details' : 'Organization details'}
                      <ChevronDownIcon width={14} height={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Expanded detail card */}
              {openContactIds.has(p.id) && p.contact && <ContactCard contact={p.contact} org={p.org_connector} />}
              {openContactIds.has(p.id) && !p.contact && p.org_connector && <OrgCard org={p.org_connector} />}

              {p.corrections.length > 0 && (
                <ul className={s.pendingList}>
                  {p.corrections.map((c) => (
                    <li key={c.id} className={s.pendingItem}>
                      <span className={s.pendingBadge}>Pending correction</span>
                      <span className={s.pendingSummary}>{correctionSummary(c)}</span>
                      {c.note && <span className={s.pendingNote}>&ldquo;{c.note}&rdquo;</span>}
                      <span className={s.pendingMeta}>
                        {c.actor_email ?? 'unknown'}
                        {formatDate(c.created_at) ? ` · ${formatDate(c.created_at)}` : ''} · awaiting recompute
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {canEdit && formOpen && (
                <div className={s.correction}>
                  <div className={s.form}>
                    <select
                      className={s.select}
                      value={reason}
                      onChange={(e) => setReason(e.target.value as CorrectionReason)}
                    >
                      {REASON_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {reason === 'wrong_connector' && (
                      <select
                        className={s.select}
                        value={newConnector}
                        onChange={(e) => setNewConnector(e.target.value as PathConnectorType | '')}
                        aria-label="Correct connector"
                      >
                        <option value="">Correct connector…</option>
                        {CONNECTOR_CHOICES.filter((c) => c !== p.connector_type).map((c) => (
                          <option key={c} value={c}>
                            {PATH_CONNECTOR_LABEL[c]}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      className={s.input}
                      placeholder="Add a note (optional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <button
                      type="button"
                      className={s.btnPrimary}
                      onClick={() => onSubmit(p)}
                      disabled={submitCorrection.isPending || (reason === 'wrong_connector' && !newConnector)}
                    >
                      {submitCorrection.isPending ? 'Saving…' : 'Submit'}
                    </button>
                    <button type="button" className={s.linkBtn} onClick={() => setOpenPathId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {hiddenCount > 0 && !showAll && (
        <button
          type="button"
          className={s.showMore}
          onClick={() => {
            trackPathExpanded({ investorId, bestProximityCode });
            setShowAll(true);
          }}
        >
          + Show {hiddenCount} more {hiddenCount === 1 ? 'path' : 'paths'}
        </button>
      )}
      {hiddenCount > 0 && showAll && (
        <button type="button" className={s.showMore} onClick={() => setShowAll(false)}>
          − Show less
        </button>
      )}
    </div>
  );
}

function RouteNodeChip({ node }: { node: RouteNode }) {
  if (node.variant === 'org') {
    const orgInner = (
      <>
        <span className={s.rnAvatarWrap}>
          {node.logo ? (
            <img src={node.logo} alt={node.label} className={s.rnAvatarImg} />
          ) : (
            <span className={s.rnAvatarInitials}>
              {node.label
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? '')
                .join('')}
            </span>
          )}
        </span>
        <span className={s.rnLabelCol}>
          <span className={s.rnLabel}>{node.label}</span>
        </span>
        <span className={s.rnUnknown} aria-label="contact unknown">
          ?
        </span>
      </>
    );
    if (node.teamUid) {
      return (
        <Link href={`/teams/${node.teamUid}`} className={s.rnChip} target="_blank" rel="noopener noreferrer">
          {orgInner}
          <span className={s.rnArrow} aria-hidden>
            ↗
          </span>
        </Link>
      );
    }
    return <span className={s.rnChip}>{orgInner}</span>;
  }

  const initials = node.label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const inner = (
    <>
      <span className={s.rnAvatarWrap}>
        {node.imageUrl ? (
          <img src={node.imageUrl} alt={node.label} className={s.rnAvatarImg} />
        ) : (
          <span className={s.rnAvatarInitials}>{initials}</span>
        )}
      </span>
      <span className={s.rnLabelCol}>
        <span className={s.rnLabel}>{node.label}</span>
        {node.orgName ? <span className={s.rnOrgName}>{node.orgName}</span> : null}
      </span>
    </>
  );

  if (node.memberUid) {
    return (
      <Link href={`/members/${node.memberUid}`} className={s.rnChip} target="_blank" rel="noopener noreferrer">
        {inner}
        <span className={s.rnArrow} aria-hidden>
          ↗
        </span>
      </Link>
    );
  }
  return <span className={s.rnChip}>{inner}</span>;
}

function ContactCard({ contact, org }: { contact: PathContact; org?: PathOrgConnector }) {
  const initials = contact.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase();

  const nameEl = contact.member_uid ? (
    <Link href={`/members/${contact.member_uid}`} className={s.contactName} target="_blank" rel="noopener noreferrer">
      {contact.name} ↗
    </Link>
  ) : (
    <span className={s.contactName}>{contact.name}</span>
  );

  const orgEl = org ? (
    org.team_uid ? (
      <Link href={`/teams/${org.team_uid}`} className={s.contactOrgLink} target="_blank" rel="noopener noreferrer">
        {org.name} ↗
      </Link>
    ) : org.website_url ? (
      <a
        href={org.website_url?.startsWith('http') ? org.website_url : `https://${org.website_url}`}
        className={s.contactOrgLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        {org.name} ↗
      </a>
    ) : (
      <span className={s.contactOrgText}>{org.name}</span>
    )
  ) : null;

  return (
    <div className={s.contactBlock}>
      <div className={s.contactHeader}>
        <div className={s.contactAvatar}>
          {contact.image_url ? (
            <img src={contact.image_url} alt={contact.name} className={s.contactAvatarImg} />
          ) : (
            <span className={s.contactAvatarInitials}>{initials}</span>
          )}
        </div>
        <div className={s.contactInfo}>
          {nameEl}
          {(contact.role || orgEl) && (
            <div className={s.contactMeta}>
              {contact.role && <span>{contact.role}</span>}
              {contact.role && orgEl && <span className={s.contactMetaSep}>&nbsp;·&nbsp;</span>}
              {orgEl}
            </div>
          )}
        </div>
      </div>
      {(contact.email || contact.linkedin_url || contact.telegram) && (
        <div className={s.contactSocials}>
          {contact.linkedin_url && (
            <a
              href={contact.linkedin_url}
              className={s.contactIcon}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <Image src={getContactLogoByProvider('linkedin')} alt="LinkedIn" width={20} height={20} />
            </a>
          )}
          {contact.telegram && (
            <a
              href={`https://t.me/${contact.telegram.replace(/^@/, '')}`}
              className={s.contactIcon}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
            >
              <Image src={getContactLogoByProvider('telegram')} alt="Telegram" width={20} height={20} />
            </a>
          )}
          {contact.email && (
            <>
              <a href={`mailto:${contact.email}`} className={s.socialEmail}>
                <span className={s.socialCircle}>@</span>
                {contact.email}
              </a>
              <CopyButton text={contact.email} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function OrgCard({ org }: { org: PathOrgConnector }) {
  const nameEl = org.team_uid ? (
    <Link href={`/teams/${org.team_uid}`} className={s.contactName} target="_blank" rel="noopener noreferrer">
      {org.name}
    </Link>
  ) : org.website_url ? (
    <a href={org.website_url} className={s.contactName} target="_blank" rel="noopener noreferrer">
      {org.name}
    </a>
  ) : (
    <span className={s.contactName}>{org.name}</span>
  );

  return (
    <div className={s.contactBlock}>
      <div className={s.contactHeader}>
        <div className={s.orgIcon} aria-hidden>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            <line x1="12" y1="12" x2="12" y2="12" />
          </svg>
        </div>
        <div className={s.contactInfo}>
          <div className={s.orgNameRow}>
            {nameEl}
            <span className={s.unknownPill}>Connection unknown</span>
          </div>
          <p className={s.orgHint}>This team can route the intro — reach out and ask for the right person.</p>
        </div>
      </div>
    </div>
  );
}
