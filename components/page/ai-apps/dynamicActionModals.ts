import dynamic from 'next/dynamic';

// The modals (and the markdown pipeline inside the details viewer) must not
// ride in either the list route's or the detail route's initial chunk — they
// load on first open. Shared by AiAppsGrid and AiAppDetailPage, the two
// surfaces that manage an app's edit/deployment/delete/details actions.
export const EditAiAppModal = dynamic(
  () => import('@/components/page/ai-apps/AiAppsPage/components/EditAiAppModal').then((m) => m.EditAiAppModal),
  { ssr: false },
);
export const DeploymentSettingsModal = dynamic(
  () =>
    import('@/components/page/ai-apps/AiAppsPage/components/DeploymentSettingsModal').then(
      (m) => m.DeploymentSettingsModal,
    ),
  { ssr: false },
);
export const DeploymentLogsModal = dynamic(
  () =>
    import('@/components/page/ai-apps/AiAppsPage/components/DeploymentLogsModal').then((m) => m.DeploymentLogsModal),
  { ssr: false },
);
export const DeleteAiAppDialog = dynamic(
  () => import('@/components/page/ai-apps/AiAppsPage/components/DeleteAiAppDialog').then((m) => m.DeleteAiAppDialog),
  { ssr: false },
);
export const AiAppDetailsModal = dynamic(
  () => import('@/components/page/ai-apps/components/AiAppDetailsModal').then((m) => m.AiAppDetailsModal),
  { ssr: false },
);
