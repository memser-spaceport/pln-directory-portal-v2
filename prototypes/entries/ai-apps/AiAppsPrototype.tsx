'use client';

import { useEffect, useMemo, useState } from 'react';

import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { AddAiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AddAiAppCard';

import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
import grid from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/AiAppsGrid.module.scss';

import { AiAppCard } from './AiAppCard';
import { AiAppDetail } from './AiAppDetail';
import { AiAppsFilterView } from './AiAppsFilterView';
import { AiAppsMobileFiltersView } from './AiAppsMobileFiltersView';
import { GiveFeedbackButton } from './GiveFeedbackButton';
import { CreateAiAppModal } from './CreateAiAppModal';
import { ManageAppModal } from './ManageAppModal';
import { DeploymentSettingsModal } from './DeploymentSettingsModal';
import { DeploymentLogsModal } from './DeploymentLogsModal';
import { DeleteAppDialog } from './DeleteAppDialog';
import { OnePagerViewer } from './OnePagerViewer';
import { AI_APPS_SORT, AI_APPS_SORT_OPTIONS, countAppliedFilters, useMockAiAppsFilterStore } from './mockAiAppsFilterStore';
import { mockAiApps, mockAppPreviews, mockPageCopy, type AiAppWithDoc } from './mocks';

import proto from './AiAppsPrototype.module.scss';

type ActionType = 'edit' | 'deployment' | 'logs' | 'delete';

/** Multi-value filter params arrive URL-encoded, the way the real store writes them. */
function decodeMulti(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(URL_QUERY_VALUE_SEPARATOR)
    .map((r) => r.trim().replaceAll(FILTER_VALUE_SEPARATOR_ENCODED, FILTER_VALUE_SEPARATOR))
    .filter(Boolean);
}

export default function AiAppsPrototype() {
  // The reused filter components are base-ui / react-hook-form / react-select
  // (client-only), the store is a useSyncExternalStore, and the update note
  // renders a locale date — gate on mount so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [apps, setApps] = useState<AiAppWithDoc[]>(mockAiApps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  // Which tile's ⋯ menu action is open, if any. All management lives on the
  // tile — the app (detail) page stays a clean preview.
  const [action, setAction] = useState<{ uid: string; type: ActionType } | null>(null);
  // The app whose 1-pager a visitor is previewing from the grid, if any.
  const [viewerUid, setViewerUid] = useState<string | null>(null);
  // Stand-in for auth: production gates editing on `app.canManage` (creator or
  // admin). The toggle lets us demo the creator (editable) vs. visitor
  // (view-only) experience of the same app.
  const [viewAs, setViewAs] = useState<'creator' | 'visitor'>('creator');

  const { params, setParam } = useMockAiAppsFilterStore();

  const selected = apps.find((a) => a.uid === selectedUid) ?? null;
  const actionApp = action ? apps.find((a) => a.uid === action.uid) ?? null : null;
  const viewerApp = viewerUid ? apps.find((a) => a.uid === viewerUid) ?? null : null;
  const isCreator = viewAs === 'creator';

  const updateApp = (updated: AiAppWithDoc) =>
    setApps((prev) => prev.map((a) => (a.uid === updated.uid ? updated : a)));

  const closeAction = () => setAction(null);

  const saveEdit = (updated: AiAppWithDoc) => {
    updateApp(updated);
    closeAction();
  };

  const deleteApp = (uid: string) => {
    setApps((prev) => prev.filter((a) => a.uid !== uid));
    closeAction();
  };

  /**
   * Submitting feedback bumps that app's counter, so the metric on the card is
   * the same number the dialog just added to rather than a decorative constant.
   * Feedback about the platform itself (the LabOS option) belongs to no app and
   * is dropped — dev routes it to contact-support, which this prototype has no
   * business faking.
   */
  const submitFeedback = (appUid: string) =>
    setApps((prev) =>
      prev.map((a) =>
        a.uid === appUid && a.activity ? { ...a, activity: { ...a.activity, feedback: a.activity.feedback + 1 } } : a,
      ),
    );

  const filterCount = countAppliedFilters(params);

  const visibleApps = useMemo(() => {
    const q = (params.get('search') || '').trim().toLowerCase();
    const creators = decodeMulti(params.get('createdBy'));
    const sort = params.get('sort') || AI_APPS_SORT.UPDATED;

    const rows = apps.filter((app) => {
      // Multi-select is OR within a facet, the way every rail in the product
      // reads: ticking two creators widens the set, it doesn't empty it.
      if (creators.length && !creators.includes(app.member.name)) return false;
      if (
        q &&
        !(
          app.name.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q) ||
          app.member.name.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });

    switch (sort) {
      case AI_APPS_SORT.NAME:
        rows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case AI_APPS_SORT.CREATED:
        rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case AI_APPS_SORT.VIEWS:
        rows.sort((a, b) => (b.activity?.views ?? 0) - (a.activity?.views ?? 0));
        break;
      default:
        // Apps that have never shipped carry no update, so they sort last
        // rather than claiming the top of a "recently updated" list.
        rows.sort((a, b) => (a.lastUpdate?.minutesAgo ?? Infinity) - (b.lastUpdate?.minutesAgo ?? Infinity));
    }

    return rows;
  }, [apps, params]);

  /**
   * Prototype-only creator/visitor switch.
   *
   * It joins whatever action row the page already has instead of sitting in a
   * band of its own above the layout. That band was costing 56px at the top of
   * every page — and on the grid it was doing real damage: DashboardPagesLayout
   * pins the rail with `top: var(--app-header-height)` and sizes it
   * `calc(100vh - 80px)`, so starting it 24px lower than production pushed the
   * bottom of the rail — the last facet at the time — off the viewport until
   * you scrolled. (The panel's Clear filters / Apply footer was never in that
   * picture: `FiltersSidePanel` hides it at ≥1024, it belongs to the mobile
   * bottom sheet.)
   *
   * `standalone` keeps the old floating band for the detail view, which has no
   * masthead to join and no rail to squash.
   */
  const renderRoleToggle = (standalone = false) => (
    <div className={standalone ? `${proto.roleToggle} ${proto.roleToggleStandalone}` : proto.roleToggle}>
      <span className={proto.roleLabel}>View as</span>
      <div className={proto.segmented}>
        <button
          type="button"
          data-active={isCreator}
          aria-pressed={isCreator}
          onClick={() => setViewAs('creator')}
        >
          Creator
        </button>
        <button
          type="button"
          data-active={!isCreator}
          aria-pressed={!isCreator}
          onClick={() => setViewAs('visitor')}
        >
          Visitor
        </button>
      </div>
    </div>
  );

  // Management surfaces (edit / deployment / delete / 1-pager) — rendered on
  // both the grid and the detail page so the detail-page ⋯ menu can open them.
  const actionSurfaces = (
    <>
      {actionApp && action?.type === 'edit' && (
        <ManageAppModal isOpen app={actionApp} onClose={closeAction} onSave={saveEdit} />
      )}
      {actionApp && action?.type === 'deployment' && (
        <DeploymentSettingsModal
          isOpen
          app={actionApp}
          onClose={closeAction}
          onRedeploy={updateApp}
          onViewLogs={() => setAction({ uid: actionApp.uid, type: 'logs' })}
        />
      )}
      {actionApp && action?.type === 'logs' && (
        <DeploymentLogsModal
          isOpen
          app={actionApp}
          onClose={closeAction}
          // "Retry deploy" hands off to the deployment-settings flow (fix limits/
          // secrets, then redeploy) rather than blindly re-running the same deploy.
          onRetry={() => setAction({ uid: actionApp.uid, type: 'deployment' })}
        />
      )}
      <DeleteAppDialog
        isOpen={!!actionApp && action?.type === 'delete'}
        appName={actionApp?.name ?? ''}
        onClose={closeAction}
        onConfirm={() => action && deleteApp(action.uid)}
      />
      {viewerApp?.onePager && (
        <OnePagerViewer isOpen onePager={viewerApp.onePager} onClose={() => setViewerUid(null)} />
      )}
    </>
  );

  if (!mounted) return <div className={proto.shell} />;

  if (selected) {
    return (
      <div className={proto.shell}>
        {renderRoleToggle(true)}
        <AiAppDetail
          app={selected}
          previewSrcDoc={mockAppPreviews[selected.uid]}
          onBack={() => setSelectedUid(null)}
          canManage={isCreator}
          onEdit={() => setAction({ uid: selected.uid, type: 'edit' })}
          onDeployment={() => setAction({ uid: selected.uid, type: 'deployment' })}
          onLogs={() => setAction({ uid: selected.uid, type: 'logs' })}
          onDelete={() => setAction({ uid: selected.uid, type: 'delete' })}
          onViewOnePager={() => setViewerUid(selected.uid)}
          apps={apps}
          onSubmitFeedback={submitFeedback}
        />
        {actionSurfaces}
      </div>
    );
  }

  const content = (
    <div className={`${page.content} ${proto.column}`}>
      {/*
        Masthead. Composed the way Deals does it — the one production page that
        has both an identity block and a filter rail: title + description on the
        left, the list control and the page action on the right.

        "Give feedback" sits here rather than as dev's floating pill. Two
        reasons beyond the ask: a FAB and a header button are two doors into one
        dialog once both exist, and a control pinned to the viewport corner is
        the only thing on the page that isn't part of the page. Same button as
        the detail bar — bordered/neutral, comment glyph, same label — one size
        up, because a 24px control beside a 28px title reads as an afterthought.

        The count rides the title at 14px/400, which is exactly how Teams and
        Members pair theirs (their .title is the same 28px/700/40 as this one).
      */}
      <div className={page.header}>
        <div className={page.titleBlock}>
          <div className={proto.titleRow}>
            <h1 className={page.title}>{mockPageCopy.title}</h1>
            <span className={proto.count}>({visibleApps.length})</span>
          </div>
          <p className={page.description}>{mockPageCopy.description}</p>
        </div>

        <div className={proto.headerActions}>
          {renderRoleToggle()}
          {/* Wrapped rather than hidden through `className`: SortDropdown puts
              that class on its trigger, so hiding the trigger on mobile leaves
              a stranded "Sort by:" label behind it. */}
          <div className={proto.sortSlot}>
            <SortDropdown
              sortByLabel="Sort by:"
              options={AI_APPS_SORT_OPTIONS}
              currentSort={params.get('sort') || AI_APPS_SORT.UPDATED}
              onSortChange={(v) => setParam('sort', v)}
            />
          </div>
          <GiveFeedbackButton apps={apps} onSubmit={submitFeedback} />
        </div>
      </div>

      {/* Mobile-only "⊕ Filters" pill + sort menu (the wrapper hides itself at ≥1024). */}
      <div className={proto.mobileFilters}>
        <AiAppsMobileFiltersView apps={apps} filterCount={filterCount} />
      </div>

      {visibleApps.length === 0 ? (
        <div className={grid.state}>No apps match your filters. Try clearing some.</div>
      ) : (
        <div className={`${grid.grid} ${proto.gridEqual}`}>
          {/* The "create" tile is part of the page, not part of a result set —
              so it leads the grid at rest and steps out once the grid is
              answering a filter. */}
          {filterCount === 0 && <AddAiAppCard onClick={() => setIsModalOpen(true)} />}
          {visibleApps.map((app) => (
            <AiAppCard
              key={app.uid}
              app={app}
              canManage={isCreator}
              onSelect={() => setSelectedUid(app.uid)}
              onEdit={() => setAction({ uid: app.uid, type: 'edit' })}
              onDeployment={() => setAction({ uid: app.uid, type: 'deployment' })}
              onLogs={() => setAction({ uid: app.uid, type: 'logs' })}
              onDelete={() => setAction({ uid: app.uid, type: 'delete' })}
              onViewOnePager={() => setViewerUid(app.uid)}
            />
          ))}
        </div>
      )}

      <CreateAiAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {actionSurfaces}
    </div>
  );

  return (
    <div className={proto.shell}>
      <DashboardPagesLayout
        filters={<AiAppsFilterView apps={apps} />}
        content={content}
      />
    </div>
  );
}
