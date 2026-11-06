'use client';

import Link from 'next/link';

import { AppLogo } from '@/components/core/navbar/components/icons';
import { DEMO_DAY_LINK, DIRECTORY_LINKS, FORUM_LINK, JOBS_LINK } from '@/components/core/navbar/constants/navLinks';
import { PL_CONTEXT, PL_ENTITIES } from '@/components/page/explore-pl-network/data/content';
import { useContactSupportStore } from '@/services/contact-support/store';

import { EVENTS_HREF } from './constants';
import s from './HomeV2.module.scss';

/** The directory's own destinations, titled as the navbar titles them. */
const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  { title: 'Directory', links: DIRECTORY_LINKS.map((l) => ({ label: l.title, href: l.href })) },
  {
    title: 'Network',
    links: [
      { label: JOBS_LINK.title, href: JOBS_LINK.href },
      { label: 'Events', href: EVENTS_HREF },
      { label: FORUM_LINK.title, href: FORUM_LINK.href },
      { label: DEMO_DAY_LINK.title, href: DEMO_DAY_LINK.href },
    ],
  },
  {
    title: 'Protocol Labs',
    links: PL_ENTITIES.slice(0, 4).map((e) => ({ label: e.name, href: e.href, external: true })),
  },
];

/**
 * The signed-out Home's footer (prototype `HomeFooter`, 2026-11-03): the logo and the mission on the left, link
 * columns of the directory's own destinations, then a hairline and the copyright row with Contact support. No legal
 * links until the directory has its own documents, and no SPV disclaimer.
 */
export function HomeFooter() {
  const openSupport = useContactSupportStore((st) => st.actions.openModal);

  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <div className={s.footerTop}>
          <div className={s.footerBrand}>
            <Link href="/home" className={s.footerLogo} aria-label="Protocol Labs directory home">
              <AppLogo />
            </Link>
            <p className={s.footerMission}>{PL_CONTEXT.mission}</p>
          </div>
          <nav className={s.footerCols} aria-label="Footer">
            {COLUMNS.map((col) => (
              <div key={col.title} className={s.footerCol}>
                <h2 className={s.footerColTitle}>{col.title}</h2>
                <ul className={s.footerLinks}>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.external ? (
                        <a href={l.href} className={s.footerLink} target="_blank" rel="noopener noreferrer">
                          {l.label}
                          <span aria-hidden> ↗</span>
                        </a>
                      ) : (
                        <Link href={l.href} className={s.footerLink}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className={s.footerBottom}>
          <span>© {new Date().getFullYear()} Protocol Labs. Team information is provided by the teams.</span>
          <button type="button" className={s.footerSupport} onClick={() => openSupport()}>
            Contact support
          </button>
        </div>
      </div>
    </footer>
  );
}
