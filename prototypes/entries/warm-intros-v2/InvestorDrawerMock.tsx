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
import {
  affinityPersonUrl,
  allReasonDescriptions,
  derivePathProximity,
  explanationFromHopChain,
  parseWarmPathHopChain,
  reasonDescription,
  type WarmPathV2HopNode,
} from '@/components/page/investors/WarmIntrosV2Workspace/parseWarmPathHopChain';
import s from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2InvestorDrawer.module.scss';
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
    <div className={s.chain}>
      {hops.map((hop, i) => (
        <span key={`${hop.profileUid}-${i}`} className={s.node}>
          {i > 0 && <span className={s.arrow}>→</span>}
          <PathProfileChip
            name={hop.name}
            profileUid={hop.profileUid}
            imageUrl={imageByUid.get(hop.profileUid)}
            onOpen={onOpen}
          />
        </span>
      ))}
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
                      {bestPath.proximityCode ? <ProximityCodeBadge code={bestPath.proximityCode} /> : null}
                      <ScorePercentPill scorePercent={bestPath.scorePercent} scoreBand={bestPath.scoreBand} />
                      <span className={s.warmth}>Best path</span>
                    </div>
                    <p className={s.warmthSubtitle}>How strong this intro route is</p>
                    {reasonLines.length > 0 ? (
                      <ul className={s.reasonList}>
                        {reasonLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : explanation ? (
                      <div className={s.explanation}>{explanation}</div>
                    ) : null}
                    <div className={s.chainRow}>
                      <PathHopRow hops={hops} imageByUid={imageByUid} onOpen={onOpenMasterProfile} />
                    </div>
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
                            const derived = derivePathProximity(alt.score, bestPath.hopCount ?? 1);
                            const proximityCode = alt.proximityCode ?? derived?.proximityCode ?? null;
                            const pct = alt.scorePercent ?? derived?.scorePercent ?? null;
                            const scoreBand = alt.scoreBand ?? derived?.scoreBand;
                            const altReason = Array.isArray(alt.reasons)
                              ? alt.reasons.map(reasonDescription).find(Boolean)
                              : null;
                            return (
                              <li key={alt.profileUid} className={s.pathItem}>
                                <div className={s.pathMeta}>
                                  {proximityCode ? <ProximityCodeBadge code={proximityCode} /> : null}
                                  {pct != null ? <ScorePercentPill scorePercent={pct} scoreBand={scoreBand} /> : null}
                                </div>
                                {altReason ? <div className={s.explanation}>{altReason}</div> : null}
                                <div className={s.chainRow}>
                                  <PathHopRow
                                    hops={[
                                      {
                                        profileUid: alt.profileUid,
                                        name: alt.name,
                                        role: 'pl_connector',
                                      },
                                      {
                                        profileUid: investor.profileUid,
                                        name: investor.name,
                                        role: 'investor',
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
