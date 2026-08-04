'use client';

/**
 * Transcription of `WarmIntrosV2InvestorDrawer` with the two data hooks
 * (`useWarmIntrosV2PathsForInvestor`, `useMasterProfile`) swapped for mock lookups.
 * Markup, class names and the production SCSS module are unchanged — this is a
 * copy, not a re-interpretation.
 */

import { useMemo, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { CopyButton } from '@/components/ui/CopyButton';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { SectorTagsList } from '@/components/page/investors/SectorTagsList/SectorTagsList';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { SectorTag } from '@/services/investors/types';
import type { WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';
import { ScorePercentPill } from '@/components/page/investors/WarmIntrosV2Workspace/ScorePercentPill';
import { PathProfileChip } from '@/components/page/investors/WarmIntrosV2Workspace/PathProfileChip';
import { hopRoleFromRelationKind } from '@/components/page/investors/WarmIntrosV2Workspace/HopRoleBadge';
import { parseCoInvestments } from '@/components/page/investors/WarmIntrosV2Workspace/masterProfileDisplay.util';
import {
  affinityPersonUrl,
  allReasonDescriptions,
  derivePathProximity,
  explanationFromHopChain,
  hopCountFromRelationKind,
  parseWarmPathHopChain,
  proximityFamilyFromRelationKind,
  reasonDescription,
  type WarmPathV2HopNode,
} from '@/components/page/investors/WarmIntrosV2Workspace/parseWarmPathHopChain';
import s from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2InvestorDrawer.module.scss';
import c from './TableColumns.module.scss';
import { PathHop } from './PathRole';
import role from './PathRole.module.scss';
import { ReasonList, SharedEventsNote } from './PathEvidence';
import { PlBackingMark, plBackingLabel } from './PlHistory';
import h from './PlHistory.module.scss';
import press from './ChipPress.module.scss';
import { PathActions } from './PathFeedback';
import { MOCK_MASTER_PROFILES, pathsForInvestor } from './mocks';

interface Props {
  row: WarmIntrosV2PathListItem | null;
  open: boolean;
  onClose: () => void;
  onOpenMasterProfile: (profileUid: string) => void;
}

function PathHopRow({
  hops,
  imageByUid,
  onOpen,
}: {
  hops: WarmPathV2HopNode[];
  imageByUid: Map<string, string | null | undefined>;
  onOpen: (uid: string) => void;
}) {
  if (hops.length === 0) return null;
  return (
    // Same chips as the table, so the same press/focus states — the drawer is a
    // touch surface too, and hover reaches neither.
    <div className={`${s.chain} ${press.chipPress}`}>
      {hops.map((hop, i) => {
        const isOrg = hop.role === 'pl_org' || !hop.profileUid;
        return (
          <span key={`${hop.profileUid}-${i}`} className={s.node}>
            {i > 0 && <span className={s.arrow}>→</span>}
            {/* Same rule as the table: label every hop but the last. */}
            <PathHop role={hop.role} isLast={i === hops.length - 1}>
              <PathProfileChip
                name={hop.name}
                profileUid={hop.profileUid}
                imageUrl={isOrg ? null : imageByUid.get(hop.profileUid)}
                onOpen={onOpen}
                nonInteractive={isOrg}
                memberUid={isOrg ? null : hop.memberUid}
              />
            </PathHop>
          </span>
        );
      })}
    </div>
  );
}

export function InvestorDrawerMock({ row, open, onClose, onOpenMasterProfile }: Props) {
  const investor = row?.investor;
  const profileUid = investor?.profileUid ?? row?.targetProfileUid ?? null;
  const targetSet = row?.targetSet;

  // Mocked stand-ins for the two react-query hooks in production.
  const detail = useMemo(
    () => (open && profileUid ? { paths: pathsForInvestor(profileUid, targetSet) } : undefined),
    [open, profileUid, targetSet],
  );
  const pathsLoading = false;
  const masterProfile = open && profileUid ? MOCK_MASTER_PROFILES[profileUid] : undefined;

  const [showAlternates, setShowAlternates] = useState(true);
  const coInvestments = useMemo(() => parseCoInvestments(masterProfile?.coInvestments), [masterProfile?.coInvestments]);

  const bestPath = useMemo(() => {
    const paths = detail?.paths ?? [];
    if (paths.length === 0) return row;
    const forSet = targetSet ? paths.filter((p) => p.targetSet === targetSet) : paths;
    const pool = forSet.length > 0 ? forSet : paths;
    return pool.find((p) => p.rank === 1) ?? pool[0] ?? row;
  }, [detail?.paths, row, targetSet]);

  const hopChain = useMemo(() => parseWarmPathHopChain(bestPath?.hopChain), [bestPath?.hopChain]);
  const reasonLines = useMemo(
    () => (hopChain?.reasons?.length ? allReasonDescriptions(hopChain.reasons) : []),
    [hopChain],
  );
  const explanation =
    reasonLines[0] || bestPath?.pathSummary?.explanation?.trim() || explanationFromHopChain(bestPath?.hopChain) || null;

  const hops: WarmPathV2HopNode[] = useMemo(() => {
    if (hopChain?.hops?.length) return hopChain.hops;
    const out: WarmPathV2HopNode[] = [];
    if (bestPath?.bestConnector) {
      out.push({
        profileUid: bestPath.bestConnector.profileUid,
        name: bestPath.bestConnector.name,
        role: 'pl_connector',
      });
    }
    if (investor) {
      out.push({
        profileUid: investor.profileUid,
        name: investor.name,
        role: 'investor',
      });
    }
    return out;
  }, [hopChain, bestPath?.bestConnector, investor]);

  const alternates = hopChain?.alternates ?? [];
  const email = investor?.email?.trim() || null;
  const name = investor?.name?.trim() || profileUid || 'Investor';
  const org = investor?.currentOrg?.trim() || null;
  const title = investor?.currentTitle?.trim() || null;
  const sectors = (investor?.sectors ?? []) as SectorTag[];
  const affinityId = investor?.affinityPersonId?.trim() || null;
  const bio = typeof masterProfile?.bio === 'string' && masterProfile.bio.trim() ? masterProfile.bio.trim() : null;

  const imageByUid = useMemo(() => {
    const map = new Map<string, string | null | undefined>();

    const put = (
      uid: string | undefined | null,
      personName: string | undefined | null,
      memberUid?: string | null,
      imageUrl?: string | null,
    ) => {
      if (!uid) return;
      const trimmed = imageUrl?.trim() || null;
      if (memberUid) {
        map.set(uid, trimmed || getDefaultAvatar(personName || uid));
      } else if (trimmed) {
        map.set(uid, trimmed);
      } else if (!map.has(uid)) {
        map.set(uid, null);
      }
    };

    if (investor) {
      put(investor.profileUid, investor.name, investor.memberUid, investor.imageUrl);
    }
    if (bestPath?.bestConnector) {
      const c = bestPath.bestConnector;
      put(c.profileUid, c.name, c.memberUid, c.imageUrl);
    }
    for (const hop of hopChain?.hops ?? []) {
      put(hop.profileUid, hop.name, hop.memberUid, hop.imageUrl);
    }
    for (const alt of alternates) {
      put(alt.profileUid, alt.name, alt.memberUid, alt.imageUrl);
    }
    return map;
  }, [investor, bestPath?.bestConnector, hopChain?.hops, alternates]);

  const investorAvatarSrc = investor?.memberUid
    ? investor.imageUrl?.trim() || getDefaultAvatar(name)
    : investor?.imageUrl?.trim() || null;

  return (
    <Drawer isOpen={open} onClose={onClose} width={720}>
      {!row || !investor ? (
        <div className={s.loading}>No investor selected.</div>
      ) : (
        <>
          <div className={s.header}>
            <button type="button" className={s.backBtn} onClick={onClose} aria-label="Close">
              ← Back
            </button>
          </div>

          <div className={s.content}>
            <div className={s.section}>
              <div className={s.headerTop}>
                <div className={s.headerWho}>
                  <div className={s.nameRow}>
                    {investorAvatarSrc ? (
                      <Image
                        className={s.headerAvatar}
                        src={investorAvatarSrc}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                      />
                    ) : null}
                    <button
                      type="button"
                      className={s.nameBtn}
                      onClick={() => onOpenMasterProfile(investor.profileUid)}
                    >
                      <h2 id="wi2-investor-drawer-title" className={s.name}>
                        {name}
                      </h2>
                    </button>
                  </div>
                  <div className={s.meta}>
                    {org ? <span>{org}</span> : null}
                    {org && title ? <span className={s.metaVDivider} aria-hidden /> : null}
                    {title ? <span>{title}</span> : null}
                    {!org && !title ? <span className={s.muted}>—</span> : null}
                  </div>
                  {affinityId ? <div className={s.metaSub}>Affinity id: {affinityId}</div> : null}
                  {sectors.length > 0 ? (
                    <div className={s.pillRow}>
                      <SectorTagsList tags={sectors} max={12} />
                    </div>
                  ) : null}
                </div>
                <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close drawer">
                  ✕
                </button>
              </div>

              {email ? (
                <div className={s.channelsBox}>
                  <div className={s.socialEmailGroup}>
                    <Image src={getContactLogoByProvider('email')} alt="" aria-hidden width={20} height={20} />
                    <a href={`mailto:${email}`} className={s.socialEmailAddr}>
                      {email}
                    </a>
                    <CopyButton text={email} className={s.contactIconCopy} />
                  </div>
                </div>
              ) : null}
            </div>

            <div className={s.section}>
              <h3 className={s.sectionTitle}>Investor profile</h3>
              {bio ? <p className={s.enrichBio}>{bio}</p> : null}
              <dl className={s.kv}>
                <dt>Current org</dt>
                <dd>{org || <span className={s.muted}>—</span>}</dd>
                <dt>Title</dt>
                <dd>{title || <span className={s.muted}>—</span>}</dd>
                <dt>Industry / Sector</dt>
                <dd>
                  <SectorTagsList tags={sectors} max={20} />
                </dd>
              </dl>
              {/* Dev filters on plBacking but never renders it. The drawer was
                  showing one half of the PL relationship and not the other.

                  Untinted via `h.coInvestPlain` — production ships this as a
                  filled amber box, which reads as a warning on what is good news.
                  Deliberate deviation, flagged in COMPONENTS.md. */}
              {coInvestments.length > 0 || plBackingLabel(masterProfile?.plBacking) ? (
                <div className={`${s.coInvestBlock} ${h.coInvestPlain}`}>
                  <div className={`${s.coInvestLabel} ${h.coInvestPlainLabel}`}>
                    {coInvestments.length > 0 ? 'Co-investments with PL' : 'Relationship with PL'}
                    {coInvestments.length > 0 ? <span className={s.count}>{coInvestments.length}</span> : null}
                    <PlBackingMark backing={masterProfile?.plBacking} className={h.inline} />
                  </div>
                  {coInvestments.length > 0 ? (
                    <div className={s.coInvestNames}>
                      {coInvestments
                        .slice(0, 5)
                        .map((c) => c.name)
                        .join(', ')}
                      {coInvestments.length > 5 ? ` +${coInvestments.length - 5} more` : ''}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <button type="button" className={s.linkBtn} onClick={() => onOpenMasterProfile(investor.profileUid)}>
                View full profile
              </button>
            </div>

            <div className={s.section}>
              <h3 className={s.sectionTitle}>
                Path
                {alternates.length > 0 ? <span className={s.count}>{alternates.length + 1}</span> : null}
              </h3>

              {pathsLoading && !bestPath ? (
                <div className={s.state}>Loading paths…</div>
              ) : !bestPath ? (
                <div className={s.state}>No warm paths for this investor yet.</div>
              ) : (
                <>
                  <div className={s.pathItem}>
                    <div className={s.pathMeta}>
                      {/* Same joined object as the table — one fact should not
                          have two shapes across two surfaces. Wrapped rather
                          than collapsing `.pathMeta`'s gap, so "Best path" keeps
                          its spacing. */}
                      <span className={c.joinGroup}>
                        {bestPath.proximityCode ? (
                          <ProximityCodeBadge code={bestPath.proximityCode} className={c.joinLeft} />
                        ) : null}
                        <ScorePercentPill
                          scorePercent={bestPath.scorePercent}
                          scoreBand={bestPath.scoreBand}
                          className={bestPath.proximityCode ? c.joinRight : undefined}
                        />
                      </span>
                      <span className={s.warmth}>Best path</span>
                    </div>
                    <p className={s.warmthSubtitle}>How strong this intro route is</p>
                    {/* Reasons keep their `sourceType` here — production drops it
                        on the floor, so a verified fact and a model's guess look
                        the same. */}
                    {reasonLines.length > 0 ? (
                      <ReasonList reasons={hopChain?.reasons ?? []} listClassName={s.reasonList} />
                    ) : explanation ? (
                      <div className={s.explanation}>{explanation}</div>
                    ) : null}
                    <div className={`${s.chainRow} ${role.chainRowTight}`}>
                      <PathHopRow hops={hops} imageByUid={imageByUid} onOpen={onOpenMasterProfile} />
                    </div>
                    {/* Overlap between adjacent hops — a property of the edge, so
                        it sits under the chain rather than on either chip. */}
                    <SharedEventsNote hops={hops} />
                    {/* Design change: the card ends in a referral answer + a
                        feedback escape hatch. Keyed by path so re-opening the
                        drawer shows what was already answered. */}
                    <PathActions
                      key={bestPath.uid}
                      pathKey={bestPath.uid}
                      context={{
                        nodes: hops.map((hop) => ({
                          profileUid: hop.profileUid,
                          name: hop.name,
                          imageUrl: imageByUid.get(hop.profileUid),
                        })),
                        connectorName: bestPath.bestConnector?.name ?? hops[0]?.name ?? null,
                        proximityCode: bestPath.proximityCode,
                        scorePercent: bestPath.scorePercent,
                        scoreBand: bestPath.scoreBand,
                      }}
                    />
                  </div>

                  {alternates.length > 0 ? (
                    <div className={s.alternatesBlock}>
                      <button
                        type="button"
                        className={s.alternatesToggle}
                        aria-expanded={showAlternates}
                        onClick={() => setShowAlternates((v) => !v)}
                      >
                        {showAlternates ? 'Hide' : 'Show'} alternate connectors ({alternates.length})
                      </button>
                      {showAlternates ? (
                        <ul className={s.altList}>
                          {alternates.map((alt) => {
                            // An alternate can reach the investor through a
                            // different shape than the best path, so its code
                            // and its role badge come from its own kind.
                            const altKind = alt.relationKind ?? hopChain?.relationKind;
                            const derived = derivePathProximity(
                              alt.score,
                              hopCountFromRelationKind(altKind),
                              proximityFamilyFromRelationKind(altKind),
                            );
                            const proximityCode = alt.proximityCode ?? derived?.proximityCode ?? null;
                            const pct = alt.scorePercent ?? derived?.scorePercent ?? null;
                            const scoreBand = alt.scoreBand ?? derived?.scoreBand;
                            const altReason = Array.isArray(alt.reasons)
                              ? alt.reasons.map(reasonDescription).find(Boolean)
                              : null;
                            return (
                              <li key={alt.profileUid} className={s.pathItem}>
                                <div className={s.pathMeta}>
                                  <span className={c.joinGroup}>
                                    {proximityCode ? (
                                      <ProximityCodeBadge code={proximityCode} className={c.joinLeft} />
                                    ) : null}
                                    {pct != null ? (
                                      <ScorePercentPill
                                        scorePercent={pct}
                                        scoreBand={scoreBand}
                                        className={proximityCode ? c.joinRight : undefined}
                                      />
                                    ) : null}
                                  </span>
                                </div>
                                {altReason ? <div className={s.explanation}>{altReason}</div> : null}
                                <div className={`${s.chainRow} ${role.chainRowTight}`}>
                                  <PathHopRow
                                    hops={[
                                      {
                                        profileUid: alt.profileUid,
                                        name: alt.name,
                                        role: hopRoleFromRelationKind(altKind),
                                        memberUid: alt.memberUid,
                                        imageUrl: alt.imageUrl,
                                      },
                                      {
                                        profileUid: investor.profileUid,
                                        name: investor.name,
                                        role: 'investor',
                                        memberUid: investor.memberUid,
                                      },
                                    ]}
                                    imageByUid={imageByUid}
                                    onOpen={onOpenMasterProfile}
                                  />
                                </div>
                                {/* Alternates carry the same strip — the whole
                                    point is a per-path answer, and an alternate
                                    is often the one you'd actually use. */}
                                <PathActions
                                  key={`${bestPath.uid}:${alt.profileUid}`}
                                  pathKey={`${bestPath.uid}:${alt.profileUid}`}
                                  context={{
                                    nodes: [
                                      {
                                        profileUid: alt.profileUid,
                                        name: alt.name,
                                        imageUrl: imageByUid.get(alt.profileUid),
                                      },
                                      {
                                        profileUid: investor.profileUid,
                                        name: investor.name,
                                        imageUrl: imageByUid.get(investor.profileUid),
                                      },
                                    ],
                                    connectorName: alt.name,
                                    proximityCode,
                                    scorePercent: pct,
                                    scoreBand,
                                  }}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className={s.footer}>
            {affinityId ? (
              <a
                className={clsx(s.btn, s.btnPrimary)}
                href={affinityPersonUrl(affinityId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Affinity ↗
              </a>
            ) : null}
            {email ? (
              <CopyButton text={email} label="Copy email" className={s.btn} />
            ) : (
              <button type="button" className={s.btn} disabled>
                Copy email
              </button>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}
