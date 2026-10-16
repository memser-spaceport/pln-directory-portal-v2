'use client';

/**
 * LAB-2886: the feedback icon and drawer on every LabOS page (LAB-2880, option 4).
 *
 * Demo switches (not part of the design): signed in or out, the page under the
 * header (Members or the AI Apps list), and "Replay page load" to see the
 * "Give feedback" label again. Mock data only.
 */

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';

import { FeedbackHeader } from './FeedbackHeader';
import { FeedbackDrawer, type DrawerMode } from './FeedbackDrawer';
import { MOCK_APPS, MOCK_MEMBERS, type MenuAction } from './mocks';
import s from './FrontendPrototypeOfTheFeedPrototype.module.scss';

type Page = 'members' | 'ai-apps';

export default function FrontendPrototypeOfTheFeedPrototype() {
  const [signedIn, setSignedIn] = useState(true);
  const [page, setPage] = useState<Page>('members');
  // A new key remounts the header: a full page load, so the label shows again.
  const [loadKey, setLoadKey] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<DrawerMode>('feedback');
  const [supportTopic, setSupportTopic] = useState<string | null>(null);

  const openDrawer = useCallback((m: DrawerMode) => {
    setSupportTopic(null);
    setMode(m);
    setDrawerOpen(true);
  }, []);

  const onAction = (action: MenuAction, topic: string) => {
    if (action === 'support') {
      setDrawerOpen(false);
      setSupportTopic(topic);
    } else {
      openDrawer(action);
    }
  };

  // Alt+F (Option+F on Mac) opens "Give feedback" on every page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyF') {
        e.preventDefault();
        openDrawer('feedback');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openDrawer]);

  return (
    <div className={s.page}>
      <FeedbackHeader key={loadKey} signedIn={signedIn} onAction={onAction} />

      {/* Demo only. Under the header, so the header and the drawer sit where they do in LabOS. */}
      <div className={s.demoBar}>
        <span className={s.demoTitle}>Demo</span>
        <span className={s.demoGroup}>
          <span className={s.demoNote}>Visitor</span>
          <Segmented
            value={signedIn ? 'in' : 'out'}
            options={[
              ['in', 'Signed in'],
              ['out', 'Signed out'],
            ]}
            onChange={(v) => setSignedIn(v === 'in')}
          />
        </span>
        <span className={s.demoGroup}>
          <span className={s.demoNote}>Page</span>
          <Segmented
            value={page}
            options={[
              ['members', 'Members'],
              ['ai-apps', 'AI Apps list'],
            ]}
            onChange={(v) => setPage(v as Page)}
          />
        </span>
        <button type="button" className={s.demoButton} onClick={() => setLoadKey((k) => k + 1)}>
          Replay page load
        </button>
        <span className={s.demoNote}>Click the chat icon, hover it, or press Alt+F.</span>
      </div>

      <main className={s.main}>
        {page === 'members' ? (
          <>
            <h1 className={s.h1}>Members</h1>
            <div className={s.grid}>
              {MOCK_MEMBERS.map((m) => (
                <div key={m.name} className={s.card}>
                  <span className={s.cardAvatar}>{m.name.charAt(0)}</span>
                  <span className={s.cardTitle}>{m.name}</span>
                  <span className={s.cardText}>
                    {m.role}, {m.team}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className={s.h1}>AI Apps</h1>
            <p className={s.note}>
              The list page has no floating feedback button. The header icon opens the drawer with the app picker on “AI
              Apps”. The page of one app keeps its floating button.
            </p>
            <div className={s.grid}>
              {MOCK_APPS.map((a) => (
                <div key={a.name} className={s.card}>
                  <span className={s.cardTitle}>{a.name}</span>
                  <span className={s.cardText}>{a.text}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {drawerOpen && (
        <FeedbackDrawer
          open
          mode={mode}
          onModeChange={setMode}
          onClose={() => setDrawerOpen(false)}
          signedIn={signedIn}
          aiAppsList={page === 'ai-apps'}
          pagePath={page === 'members' ? '/members' : '/ai-apps'}
        />
      )}

      {supportTopic && (
        <div className={s.modalScrim} onClick={() => setSupportTopic(null)}>
          <div className={s.modal} role="dialog" aria-label={supportTopic} onClick={(e) => e.stopPropagation()}>
            <h2 className={s.modalTitle}>{supportTopic}</h2>
            <p className={s.note}>
              The support form opens here on this topic, as it does today from the “?” menu. It does not change.
            </p>
            <button type="button" className={s.demoButton} onClick={() => setSupportTopic(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <span className={s.switch}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          className={clsx(s.switchBtn, value === v && s.switchBtnActive)}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </span>
  );
}
