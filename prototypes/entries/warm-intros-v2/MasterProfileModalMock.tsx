'use client';

/**
 * Transcription of `MasterProfileModal` with `useMasterProfile` swapped for a
 * lookup in MOCK_MASTER_PROFILES. Section markup and class names are unchanged.
 *
 * Design changes on top of production:
 *   - modal chrome swapped to the shared content-modal pattern (SubmitDealModal
 *     styles + CloseIcon button + Modal's own dialog/scroll-lock/inert props),
 *     the same one the Gantry item modal uses, replacing a bespoke micro-label
 *     header and a text "✕"
 *   - LinkedIn / website render inline with the email as icons, not pills below
 *   - type tags (Investor, PL internal) sit next to the name
 */

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { CopyButton } from '@/components/ui/CopyButton';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { affinityPersonUrl } from '@/components/page/investors/WarmIntrosV2Workspace/parseWarmPathHopChain';
import {
  eventsFromProfile,
  parseCoInvestments,
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
} from '@/components/page/investors/WarmIntrosV2Workspace/masterProfileDisplay.util';
import s from '@/components/page/investors/WarmIntrosV2Workspace/MasterProfileModal.module.scss';
// Shared content-modal chrome — the same module the Gantry item modal imports.
import m from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import c from './ContactRow.module.scss';
import chrome from './ModalChrome.module.scss';
import { PlBackingMark, plBackingLabel } from './PlHistory';
import h from './PlHistory.module.scss';
import { MOCK_MASTER_PROFILES } from './mocks';

interface Props {
  profileUid: string | null;
  open: boolean;
  onClose: () => void;
}

export function MasterProfileModalMock({ profileUid, open, onClose }: Props) {
  const data = open && profileUid ? MOCK_MASTER_PROFILES[profileUid] : undefined;
  const isLoading = false;
  const isError = false;

  const emails = useMemo(() => unwrapSourcedArray(data?.emails), [data?.emails]);
  const phones = useMemo(() => unwrapSourcedArray(data?.phones), [data?.phones]);
  const socials = useMemo(() => unwrapSocials(data?.socials), [data?.socials]);
  const experience = useMemo(() => parseExperience(data?.experience), [data?.experience]);
  const education = useMemo(() => parseEducation(data?.education), [data?.education]);
  const orgs = useMemo(() => parseOrganizationLabels(data?.organizations), [data?.organizations]);
  const locations = useMemo(() => parseLocationLabels(data?.locations), [data?.locations]);
  const lists = useMemo(() => parseListMemberships(data?.listMemberships), [data?.listMemberships]);
  const investorFields = useMemo(() => parseInvestorMetaFields(data?.investorMeta), [data?.investorMeta]);
  const coInvestments = useMemo(() => parseCoInvestments(data?.coInvestments), [data?.coInvestments]);
  const projects = useMemo(() => (data ? projectsFromProfile(data) : []), [data]);
  const events = useMemo(() => (data ? eventsFromProfile(data) : []), [data]);
  const snapshots = useMemo(() => summarizeSourceSnapshots(data?.sourceSnapshots), [data?.sourceSnapshots]);

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
    <Modal
      isOpen={open}
      onClose={onClose}
      className={chrome.modal}
      closeOnEscape
      // Deliberate dismissal only — the close icon or Escape, never a stray
      // backdrop click. Nothing is at stake in a read-only profile, but two
      // modals opening off the same drawer with different dismissal rules is
      // worse than either rule on its own.
      closeOnBackdropClick={false}
      // Dialog semantics, scroll lock and background inerting come from Modal
      // itself rather than being hand-rolled on an inner div.
      ariaLabelledBy="wi2-master-profile-title"
      lockScroll
      inertBackground
    >
      <div className={clsx(m.root, chrome.root)}>
        <div className={clsx(m.header, chrome.header)}>
          <div className={m.headerText}>
            {/* One line only — the subtitle restated what the sections below
                already show, and cost the header a second row. */}
            <h2 id="wi2-master-profile-title" className={clsx(m.title, chrome.title)}>
              Master profile
            </h2>
          </div>
          <button type="button" className={m.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={clsx(m.content, chrome.stack)}>
          {isLoading && <div className={s.state}>Loading profile…</div>}

          {!isLoading && !isError && !data && <div className={s.state}>Profile not found.</div>}

          {!isLoading && !isError && data ? (
            <>
              <section className={s.hero}>
                {/* Investor / PL internal / Founder qualify the name, so they sit
                    inline with it rather than in their own row underneath. */}
                <div className={s.nameRow}>
                  <h3 className={s.name}>{name}</h3>
                  {types.map((t) => (
                    <span key={t} className={clsx(s.typePill, typePillClass(t))}>
                      {typeLabel(t)}
                    </span>
                  ))}
                </div>

                <div className={s.meta}>
                  {org ? <span>{org}</span> : null}
                  {org && title ? <span className={s.metaVDivider} aria-hidden /> : null}
                  {title ? <span>{title}</span> : null}
                  {!org && !title ? <span className={s.muted}>—</span> : null}
                </div>

                {(emails.length > 0 || phones.length > 0 || socials.length > 0) && (
                  <div className={s.channelsBox}>
                    {emails.map((email) => (
                      <div key={email} className={s.socialEmailGroup}>
                        <Image src={getContactLogoByProvider('email')} alt="" aria-hidden width={18} height={18} />
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

                    {/* Socials sit inline after the email/phone, icon-only, the way
                        v1 InvestorDrawer and member details render this row. */}
                    {socials.length > 0 && (emails.length > 0 || phones.length > 0) ? (
                      <span className={c.channelDivider} />
                    ) : null}
                    {socials.map(({ provider, url }) => (
                      <a
                        key={`${provider}-${url}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={c.contactIcon}
                        title={provider}
                      >
                        <Image src={getContactLogoByProvider(provider)} alt={provider} width={20} height={20} />
                      </a>
                    ))}
                  </div>
                )}

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

              {coInvestments.length > 0 || plBackingLabel(data.plBacking) ? (
                <section className={s.section}>
                  <h4 className={s.sectionTitle}>
                    {coInvestments.length > 0 ? 'Co-investments with PL' : 'Relationship with PL'}
                    {coInvestments.length > 0 ? <span className={s.count}>{coInvestments.length}</span> : null}
                    {/* Same pill as the row and the drawer — one fact, one look. */}
                    <PlBackingMark backing={data.plBacking} className={h.inline} />
                  </h4>
                  <ul className={s.itemList}>
                    {coInvestments.map((item) => {
                      const meta = [item.dealStage, item.dealDate, item.isLeadInvestor ? 'Lead' : null, item.dealAmount]
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <li key={item.teamUid || item.name} className={s.item}>
                          <div className={s.itemPrimary}>{item.name}</div>
                          {meta ? <div className={s.itemSecondary}>{meta}</div> : null}
                        </li>
                      );
                    })}
                  </ul>
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
                      <span key={list.slug} className={clsx(s.listPill, listPillClass(list.slug))}>
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
                      Enriched {typeof data.enrichedAt === 'string' ? data.enrichedAt : String(data.enrichedAt)}
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
