'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { Modal } from '@/components/common/Modal';
import { CopyButton } from '@/components/ui/CopyButton';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { useMasterProfile } from '@/services/investors/hooks/useMasterProfile';
import { affinityPersonUrl } from './parseWarmPathHopChain';
import {
  eventsFromProfile,
  parseEducation,
  parseExperience,
  parseInvestorMetaFields,
  parseListMemberships,
  parseLocationLabels,
  parseOrganizationLabels,
  projectsFromProfile,
  summarizeSourceSnapshots,
  typeLabel,
  unwrapSocials,
  unwrapSourcedArray,
} from './masterProfileDisplay.util';
import s from './MasterProfileModal.module.scss';

interface Props {
  profileUid: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Warm Intros v2 MasterProfile detail modal (S3-T6).
 * Opened from table name / drawer chips / “View full profile”.
 */
export function MasterProfileModal({ profileUid, open, onClose }: Props) {
  const { data, isLoading, isError, error } = useMasterProfile(profileUid, {
    enabled: open && !!profileUid,
  });

  const emails = useMemo(() => unwrapSourcedArray(data?.emails), [data?.emails]);
  const phones = useMemo(() => unwrapSourcedArray(data?.phones), [data?.phones]);
  const socials = useMemo(() => unwrapSocials(data?.socials), [data?.socials]);
  const experience = useMemo(() => parseExperience(data?.experience), [data?.experience]);
  const education = useMemo(() => parseEducation(data?.education), [data?.education]);
  const orgs = useMemo(() => parseOrganizationLabels(data?.organizations), [data?.organizations]);
  const locations = useMemo(() => parseLocationLabels(data?.locations), [data?.locations]);
  const lists = useMemo(() => parseListMemberships(data?.listMemberships), [data?.listMemberships]);
  const investorFields = useMemo(
    () => parseInvestorMetaFields(data?.investorMeta),
    [data?.investorMeta],
  );
  const projects = useMemo(() => (data ? projectsFromProfile(data) : []), [data]);
  const events = useMemo(() => (data ? eventsFromProfile(data) : []), [data]);
  const snapshots = useMemo(
    () => summarizeSourceSnapshots(data?.sourceSnapshots),
    [data?.sourceSnapshots],
  );

  const name = data?.canonicalName?.trim() || profileUid || 'Profile';
  const types = Array.isArray(data?.types) ? data.types.filter((t): t is string => !!t) : [];
  const org = data?.currentOrg?.trim() || null;
  const title = data?.currentTitle?.trim() || null;
  const bio = typeof data?.bio === 'string' && data.bio.trim() ? data.bio.trim() : null;
  const memberUid = data?.memberUid?.trim() || null;
  const affinityId = data?.affinityPersonId?.trim() || null;
  const hasProjectsOrEvents = projects.length > 0 || events.length > 0;
  const hasProvenance = snapshots.length > 0 || !!data?.raw || !!data?.enrichedAt;

  return (
    <Modal isOpen={open} onClose={onClose} className={s.modal} closeOnEscape closeOnBackdropClick>
      <div className={s.content} role="dialog" aria-modal="true" aria-labelledby="wi2-master-profile-title">
        <header className={s.header}>
          <h2 className={s.headerTitle}>Master profile</h2>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className={s.body}>
          {isLoading && <div className={s.state}>Loading profile…</div>}

          {isError && (
            <div className={s.stateError}>
              Failed to load profile
              {error instanceof Error && error.message ? `: ${error.message}` : ''}.
            </div>
          )}

          {!isLoading && !isError && !data && (
            <div className={s.state}>Profile not found.</div>
          )}

          {!isLoading && !isError && data ? (
            <>
              <section className={s.hero}>
                <div className={s.nameRow}>
                  <h3 id="wi2-master-profile-title" className={s.name}>
                    {name}
                  </h3>
                </div>

                {types.length > 0 ? (
                  <div className={s.pillRow}>
                    {types.map((t) => (
                      <span key={t} className={clsx(s.typePill, typePillClass(t))}>
                        {typeLabel(t)}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className={s.meta}>
                  {org ? <span>{org}</span> : null}
                  {org && title ? <span className={s.metaVDivider} aria-hidden /> : null}
                  {title ? <span>{title}</span> : null}
                  {!org && !title ? <span className={s.muted}>—</span> : null}
                </div>

                {(emails.length > 0 || phones.length > 0) && (
                  <div className={s.channelsBox}>
                    {emails.map((email) => (
                      <div key={email} className={s.socialEmailGroup}>
                        <Image
                          src={getContactLogoByProvider('email')}
                          alt=""
                          aria-hidden
                          width={18}
                          height={18}
                        />
                        <a href={`mailto:${email}`} className={s.socialEmailAddr}>
                          {email}
                        </a>
                        <CopyButton text={email} className={s.contactIconCopy} />
                      </div>
                    ))}
                    {phones.map((phone) => (
                      <div key={phone} className={s.socialEmailGroup}>
                        <span className={s.phoneLabel}>Phone</span>
                        <a href={`tel:${phone}`} className={s.socialEmailAddr}>
                          {phone}
                        </a>
                        <CopyButton text={phone} className={s.contactIconCopy} />
                      </div>
                    ))}
                  </div>
                )}

                {socials.length > 0 ? (
                  <div className={s.socialRow}>
                    {socials.map(({ provider, url }) => (
                      <a
                        key={`${provider}-${url}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.socialLink}
                        title={provider}
                      >
                        <Image
                          src={getContactLogoByProvider(provider)}
                          alt=""
                          aria-hidden
                          width={18}
                          height={18}
                        />
                        <span>{provider}</span>
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className={s.extLinks}>
                  {memberUid ? (
                    <Link
                      href={`/members/${encodeURIComponent(memberUid)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={s.extLink}
                    >
                      Directory member ↗
                    </Link>
                  ) : null}
                  {affinityId ? (
                    <a
                      href={affinityPersonUrl(affinityId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={s.extLink}
                    >
                      Open in Affinity ↗
                    </a>
                  ) : null}
                </div>
              </section>

              {bio ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>Bio</h4>
                  <p className={s.bio}>{bio}</p>
                </section>
              ) : null}

              {investorFields.length > 0 ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>Investor profile</h4>
                  <dl className={s.kv}>
                    {investorFields.map((f) => (
                      <div key={f.label} className={s.kvRow}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              {experience.length > 0 ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>
                    Experience <span className={s.count}>{experience.length}</span>
                  </h4>
                  <ul className={s.itemList}>
                    {experience.map((item, i) => (
                      <li key={`${item.company}-${item.title}-${i}`} className={s.item}>
                        <div className={s.itemPrimary}>
                          {item.title || <span className={s.muted}>Role</span>}
                          {item.company ? (
                            <>
                              <span className={s.itemSep}>·</span>
                              <span>{item.company}</span>
                            </>
                          ) : null}
                        </div>
                        {item.years ? <div className={s.itemSecondary}>{item.years}</div> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {education.length > 0 ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>
                    Education <span className={s.count}>{education.length}</span>
                  </h4>
                  <ul className={s.itemList}>
                    {education.map((item, i) => (
                      <li key={`${item.school}-${item.degree}-${i}`} className={s.item}>
                        <div className={s.itemPrimary}>
                          {item.school || <span className={s.muted}>School</span>}
                          {item.degree ? (
                            <>
                              <span className={s.itemSep}>·</span>
                              <span>{item.degree}</span>
                            </>
                          ) : null}
                        </div>
                        {item.year ? <div className={s.itemSecondary}>{item.year}</div> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {orgs.length > 0 ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>Organizations</h4>
                  <div className={s.pillRow}>
                    {orgs.map((o) => (
                      <span key={o} className={s.tag}>
                        {o}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {locations.length > 0 ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>Locations</h4>
                  <div className={s.pillRow}>
                    {locations.map((loc) => (
                      <span key={loc} className={s.tag}>
                        {loc}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {lists.length > 0 ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>Lists</h4>
                  <div className={s.pillRow}>
                    {lists.map((list) => (
                      <span
                        key={list.slug}
                        className={clsx(s.listPill, listPillClass(list.slug))}
                      >
                        {list.label}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {hasProjectsOrEvents ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>Projects / events</h4>
                  {projects.length > 0 ? (
                    <div className={s.subBlock}>
                      <div className={s.subLabel}>Projects</div>
                      <div className={s.pillRow}>
                        {projects.map((p) => (
                          <span key={p} className={s.tag}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {events.length > 0 ? (
                    <div className={s.subBlock}>
                      <div className={s.subLabel}>Events</div>
                      <div className={s.pillRow}>
                        {events.map((e) => (
                          <span key={e} className={s.tag}>
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {hasProvenance ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>Provenance / sources</h4>
                  {data.enrichedAt ? (
                    <div className={s.metaSub}>
                      Enriched{' '}
                      {typeof data.enrichedAt === 'string'
                        ? data.enrichedAt
                        : String(data.enrichedAt)}
                    </div>
                  ) : null}
                  {snapshots.length > 0 ? (
                    <ul className={s.snapshotList}>
                      {snapshots.map((snap) => (
                        <li key={snap.key}>
                          <code className={s.code}>{snap.key}</code>
                          {snap.type ? <span className={s.muted}> · {snap.type}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {data.raw ? (
                    <details className={s.details}>
                      <summary>Show raw JSON</summary>
                      <pre className={s.rawJson}>{safeJson(data.raw)}</pre>
                    </details>
                  ) : null}
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function typePillClass(type: string): string | undefined {
  if (type === 'pl_internal') return s.typePl;
  if (type === 'investor') return s.typeInvestor;
  if (type === 'founder') return s.typeFounder;
  return undefined;
}

function listPillClass(slug: string): string | undefined {
  if (slug === 'neuro-fund-i') return s.listNeuro;
  if (slug === 'gold-co-investors') return s.listGold;
  return undefined;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
