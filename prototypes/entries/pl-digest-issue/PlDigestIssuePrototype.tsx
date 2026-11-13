'use client';

import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSyncExternalStore } from 'react';

// Review-switch chrome, imported: the pill switch every prototype review band wears.
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';

import { DigestEmail } from './DigestEmail';
import { DigestIssuePage } from './DigestIssuePage';
import s from './PlDigestIssue.module.scss';

type Surface = 'email' | 'page';
type Width = 'desktop' | 'phone';

const SURFACES: { value: Surface; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'page', label: 'LabOS page' },
];
const WIDTHS: { value: Width; label: string }[] = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'phone', label: 'Phone' },
];

// Mount gate without a set-state-in-effect: false on the server and the
// hydration pass, true on the client.
const noopSubscribe = () => () => undefined;
const isClient = () => true;
const isServer = () => false;

/**
 * PL Network Digest No. 07: one issue for founders and investors, on its two
 * surfaces. The email is the teaser; the LabOS page is the issue. A review band
 * switches surface and width; Phone renders the same route at 390px in a frame,
 * so the phone layout is the real one, not a squeezed desktop.
 *
 * URL: `?view=email|page`, `?width=desktop|phone`. `embed=1` is the framed copy
 * (no review band).
 */
export default function PlDigestIssuePrototype() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(noopSubscribe, isClient, isServer);

  const view: Surface = params.get('view') === 'page' ? 'page' : 'email';
  const width: Width = params.get('width') === 'phone' ? 'phone' : 'desktop';
  const embed = params.get('embed') === '1';

  const setParam = (key: 'view' | 'width', value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Mount gate: the intro modal portals, the share action reads window, and the
  // shared follow/intro stores read sessionStorage.
  if (!mounted) return <div className={s.root} />;

  const surface = view === 'page' ? <DigestIssuePage /> : <DigestEmail />;

  if (embed) {
    return (
      <div className={clsx(s.root, s.embed)} data-digest-embed="">
        {view === 'page' && (
          <>
            <PrototypeNavBar hasUnreadNews={false} />
            <PrototypeMobileNav hasUnreadNews={false} />
          </>
        )}
        {surface}
      </div>
    );
  }

  const framed = width === 'phone';

  return (
    <div className={s.root}>
      {view === 'page' && !framed && <PrototypeNavBar hasUnreadNews={false} />}

      <div className={s.reviewBand}>
        <div className={s.reviewRow}>
          <div className={v0.switchBar}>
            <span className={v0.switchLabel}>Surface</span>
            <div className={v0.switch} role="group" aria-label="Surface">
              {SURFACES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={clsx(v0.switchBtn, view === opt.value && v0.switchBtnActive)}
                  aria-pressed={view === opt.value}
                  onClick={() => setParam('view', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className={clsx(v0.switchNote, s.reviewNote)}>
              {view === 'email'
                ? 'The teaser in the inbox. Every link opens the LabOS page.'
                : 'The full issue a reader lands on from the email.'}
            </span>
          </div>
          <div className={clsx(v0.switchBar, s.widthSwitch)}>
            <span className={v0.switchLabel}>Width</span>
            <div className={v0.switch} role="group" aria-label="Width">
              {WIDTHS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={clsx(v0.switchBtn, width === opt.value && v0.switchBtnActive)}
                  aria-pressed={width === opt.value}
                  onClick={() => setParam('width', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {framed ? (
        <div className={s.phoneStage}>
          <iframe
            key={view}
            className={s.phoneFrame}
            src={`${pathname}?view=${view}&embed=1`}
            title={`${view === 'page' ? 'LabOS page' : 'Email'} at 390px`}
          />
        </div>
      ) : (
        <>
          {surface}
          {view === 'page' && <PrototypeMobileNav hasUnreadNews={false} />}
        </>
      )}
    </div>
  );
}
