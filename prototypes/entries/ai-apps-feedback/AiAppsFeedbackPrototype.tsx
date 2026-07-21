'use client';

import { useMemo, useState } from 'react';

import { AddAiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AddAiAppCard';
import { CreateAiAppModal } from '@/components/page/ai-apps/AiAppsPage/components/CreateAiAppModal';
import { AiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/components/AiAppCard';
import { Button } from '@/components/common/Button/Button';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
import grid from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/AiAppsGrid.module.scss';

import { FeedbackPage } from './FeedbackPage';
import { FeedbackFab } from './FeedbackFab';
import { FeedbackHeaderButton } from './FeedbackHeaderButton';
import { NewBadge } from './NewBadge';
import {
  currentUser,
  mockAiApps,
  mockAppPreviews,
  mockFeedback,
  mockPageCopy,
  type DemoRole,
  type FeedbackEntry,
} from './mocks';
import s from './feedback.module.scss';

const ROLES: { value: DemoRole; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'author', label: 'App author' },
  { value: 'admin', label: 'Directory admin' },
];

const ROLE_HINT: Record<DemoRole, string> = {
  member: 'Can browse apps and leave feedback on any of them.',
  author: 'Also sees a Feedback view — scoped to the apps they build (here: Warm Intro Matcher).',
  admin: 'Sees the Feedback view across every app, and can export it all.',
};

const PLACEMENTS: { value: FeedbackPlacement; label: string }[] = [
  { value: 'fab', label: 'Floating' },
  { value: 'header', label: 'In header' },
];

type FeedbackPlacement = 'fab' | 'header';

export default function AiAppsFeedbackPrototype() {
  const [role, setRole] = useState<DemoRole>('member');
  const [placement, setPlacement] = useState<FeedbackPlacement>('fab');
  const [apps] = useState<AiApp[]>(mockAiApps);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>(mockFeedback);

  const [view, setView] = useState<'grid' | 'feedback'>('grid');
  const [openAppUid, setOpenAppUid] = useState<string | null>(null); // detail view
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Full feedback table is its own page (replaces the grid, with a back button).
  const [feedbackFilter, setFeedbackFilter] = useState<string | null>(null);
  // "New" = received feedback not yet looked at this session. Signals novelty,
  // not a running total; clears once the viewer opens Received or the full view.
  const [receivedSeen, setReceivedSeen] = useState(false);

  const openApp = apps.find((a) => a.uid === openAppUid) ?? null;

  const openFullView = (appUid: string | null) => {
    setFeedbackFilter(appUid);
    setReceivedSeen(true);
    setOpenAppUid(null);
    setView('feedback');
  };

  // Apps this viewer is responsible for (author → own; admin → all).
  const scopedApps = useMemo(
    () => (role === 'admin' ? apps : apps.filter((a) => a.memberUid === currentUser.uid)),
    [role, apps],
  );
  const scopedFeedback = useMemo(() => {
    if (role === 'admin') return feedback;
    const ownUids = new Set(scopedApps.map((a) => a.uid));
    return feedback.filter((f) => ownUids.has(f.appUid));
  }, [role, feedback, scopedApps]);

  const canSeeAdmin = role === 'author' || role === 'admin';

  const handleSubmitFeedback = (appUid: string, text: string) => {
    const app = apps.find((a) => a.uid === appUid);
    if (!app) return;
    setFeedback((prev) => [
      {
        id: `fb-local-${prev.length + 1}`,
        appUid,
        appName: app.name,
        authorUid: currentUser.uid,
        authorName: currentUser.name,
        text,
        type: 'feature',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const demoBar = (
    <div className={s.demoBar}>
      <span className={s.demoBarLabel}>Preview as</span>
      <div className={s.roleSwitch}>
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            className={`${s.roleButton} ${role === r.value ? s.roleButtonActive : ''}`}
            onClick={() => {
              setRole(r.value);
              setOpenAppUid(null);
              setView('grid');
              setReceivedSeen(false);
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <span className={s.demoBarLabel}>Give feedback</span>
      <div className={s.roleSwitch}>
        {PLACEMENTS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`${s.roleButton} ${placement === p.value ? s.roleButtonActive : ''}`}
            onClick={() => setPlacement(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <span className={s.demoHint}>{ROLE_HINT[role]}</span>
    </div>
  );

  // ---- Feedback (full page) view ----
  // Full-bleed so the DashboardPagesLayout filter rail can sit flush at the page
  // edge like dev; the demo chrome rides above the two-column layout.
  if (view === 'feedback') {
    return (
      <>
        <div className={s.feedbackChrome}>{demoBar}</div>
        <FeedbackPage
          scopedApps={scopedApps}
          feedback={scopedFeedback}
          isAdmin={role === 'admin'}
          initialAppFilter={feedbackFilter}
          onBack={() => setView('grid')}
        />
      </>
    );
  }

  // ---- Detail (embedded app) view ----
  if (openApp) {
    return (
      <div className={s.detailRoot}>
        <iframe
          className={s.detailIframe}
          srcDoc={mockAppPreviews[openApp.uid]}
          title={openApp.name}
          allow="fullscreen"
        />
        <FeedbackFab
          apps={apps}
          initialAppUid={openApp.uid}
          currentUserName={currentUser.name}
          onSubmit={handleSubmitFeedback}
        />
      </div>
    );
  }

  // ---- Landing grid view ----
  const totalForBadge = scopedFeedback.length;

  return (
    <div className={page.pageFrame} style={{ paddingTop: 16, paddingBottom: 16 }}>
      <div className={page.content}>
        {demoBar}

        <div className={s.headerRow}>
          <div className={`${page.titleBlock} ${s.headerTitle}`}>
            <h1 className={page.title}>{mockPageCopy.title}</h1>
            <p className={page.description}>{mockPageCopy.description}</p>
          </div>
          {/* Secondary (View) inboard, primary (Give) hugging the right edge. */}
          <div className={s.headerActions}>
            {canSeeAdmin && (
              <Button
                size="s"
                style="border"
                variant="neutral"
                className={s.iconLabelButton}
                onClick={() => openFullView(null)}
              >
                View feedback
                {!receivedSeen && totalForBadge > 0 && <NewBadge count={totalForBadge} />}
              </Button>
            )}
            {placement === 'header' && (
              <FeedbackHeaderButton apps={apps} currentUserName={currentUser.name} onSubmit={handleSubmitFeedback} />
            )}
          </div>
        </div>

        <div className={grid.grid}>
          <AddAiAppCard onClick={() => setIsCreateOpen(true)} />
          {apps.map((app) => (
            <AiAppCard key={app.uid} app={app} onSelect={() => setOpenAppUid(app.uid)} />
          ))}
        </div>

        <CreateAiAppModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </div>

      {placement === 'fab' && (
        <FeedbackFab
          apps={apps}
          initialAppUid={null}
          currentUserName={currentUser.name}
          onSubmit={handleSubmitFeedback}
          alignToContent
        />
      )}
    </div>
  );
}
