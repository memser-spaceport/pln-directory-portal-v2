'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useMcpAnalytics } from '@/analytics/mcp.analytics';
import { Button } from '@/components/common/Button/Button';
import { toast } from '@/components/core/ToastContainer';
import mcp from '@/components/page/connected-accounts/McpSection.module.scss';
// The Settings tab frame and title, as on Email & Accounts and in the prototype (heading above the card).
import tabCss from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';
import { useMcpAccessRequest } from '@/services/mcp/hooks/useMcpAccessRequest';
import { useMcpConnections } from '@/services/mcp/hooks/useMcpConnections';
import { useRevokeMcpConnection } from '@/services/mcp/hooks/useRevokeMcpConnection';
import { useUpdateMcpScopes } from '@/services/mcp/hooks/useUpdateMcpScopes';
import type { McpConnection, McpLevels } from '@/services/mcp/types';
import { useMcpAccess } from '@/services/rbac/hooks/useMcpAccess';
import { triggerLoader } from '@/utils/common.utils';
import { useOneTimeCallout } from '@/hooks/useOneTimeCallout';
import { MCP_CONNECTIONS_NEW_FLAG } from '@/utils/mcp';

import { McpConnectGuide } from './McpConnectGuide';
import { McpConnectionCard } from './McpConnectionCard';
import { McpPermissionsDrawer, type McpDrawerRequest } from './McpPermissionsDrawer';
import { levelAtLeast, levelChanges, levelsOf } from './mcpPermissions';
import s from './McpConnections.module.scss';

const PHONE_QUERY = '(max-width: 639px)';

type Editing = { uid: string; preset?: McpLevels; request?: McpDrawerRequest };

/** Why a request link didn't open a drawer. */
type RequestNotice = 'resolved' | 'expired' | 'unavailable' | 'locked';

const REQUEST_NOTICE: Record<RequestNotice, string> = {
  resolved: 'This access request was already allowed.',
  expired: 'This access request has expired. If the agent still needs access, it will ask again.',
  unavailable: 'This access request isn’t available. It may belong to a connection that was revoked.',
  locked: 'The agent asked for access that LabOS admins have turned off.',
};

/** Settings → MCP connections (LAB-2995 / LAB-2997), ported from the LAB-2948 prototype. */
export function McpConnectionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestUid = searchParams.get('request');
  const analytics = useMcpAnalytics();

  const { canConnect, isFetched: accessChecked } = useMcpAccess();
  const connections = useMcpConnections(canConnect);
  const accessRequest = useMcpAccessRequest(requestUid, canConnect);
  const updateScopes = useUpdateMcpScopes();
  const revoke = useRevokeMcpConnection();

  const [editing, setEditing] = useState<Editing | null>(null);
  const [requestNotice, setRequestNotice] = useState<RequestNotice | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const { open: isNew, dismiss: dismissNew } = useOneTimeCallout(MCP_CONNECTIONS_NEW_FLAG);
  const [isPhone, setIsPhone] = useState(false);
  const handledRequestRef = useRef<string | null>(null);
  const trackedViewRef = useRef(false);

  const items = useMemo(() => connections.data ?? [], [connections.data]);

  useEffect(() => {
    triggerLoader(false);
    function handleNavigate(e: any) {
      triggerLoader(true);
      router.push(e.detail.url);
      router.refresh();
    }
    document.addEventListener('settings-navigate', handleNavigate);
    return () => document.removeEventListener('settings-navigate', handleNavigate);
  }, [router]);

  useEffect(() => {
    const phone = window.matchMedia(PHONE_QUERY);
    const sync = () => setIsPhone(phone.matches);
    sync();
    phone.addEventListener('change', sync);
    return () => phone.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (trackedViewRef.current || !connections.isSuccess) return;
    trackedViewRef.current = true;
    analytics.onConnectionsPageViewed({ connectionCount: items.length, fromRequest: !!requestUid });
  }, [connections.isSuccess, items.length, requestUid, analytics]);

  // Opening the page retires the menu's "New" badge (prototype: it stays until the member opens the tab once).
  useEffect(() => {
    if (isNew) dismissNew();
  }, [isNew, dismissNew]);

  // `?request=<id>`: open that connection's drawer with the requested scope preset, once both have loaded.
  useEffect(() => {
    if (!requestUid || handledRequestRef.current === requestUid) return;
    if (!connections.isSuccess || accessRequest.isLoading) return;
    handledRequestRef.current = requestUid;

    const request = accessRequest.data;
    const connection = request ? items.find((item) => item.uid === request.authorizationUid) : undefined;
    const scope = connection?.scopes.find((item) => item.key === request?.scope);
    let notice: RequestNotice | null = null;
    if (!request || accessRequest.isError || !connection || !scope) notice = 'unavailable';
    else if (request.status !== 'open') notice = request.status;
    else if (!levelAtLeast(scope.maxLevel, request.level)) notice = 'locked';

    analytics.onAccessRequestOpened({
      status: notice === 'locked' || notice === null ? 'open' : notice,
      scope: request?.scope,
    });
    if (notice || !request || !connection || !scope) {
      setRequestNotice(notice);
      return;
    }
    setEditing({
      uid: connection.uid,
      preset: { [scope.key]: request.level },
      request: { uid: request.uid, scopeLabel: scope.label, level: request.level, toolName: request.toolName },
    });
    analytics.onPermissionsDrawerOpened({
      authorizationUid: connection.uid,
      clientName: connection.clientName,
      source: 'request',
    });
  }, [
    requestUid,
    connections.isSuccess,
    accessRequest.isLoading,
    accessRequest.data,
    accessRequest.isError,
    items,
    analytics,
  ]);

  const editingConnection = editing ? (items.find((item) => item.uid === editing.uid) ?? null) : null;

  const closeDrawer = () => {
    setEditing(null);
    updateScopes.reset();
    if (requestUid) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('request');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  };

  const openDrawer = (connection: McpConnection, source: 'card' | 'more') => {
    updateScopes.reset();
    setEditing({ uid: connection.uid });
    analytics.onPermissionsDrawerOpened({
      authorizationUid: connection.uid,
      clientName: connection.clientName,
      source,
    });
  };

  const save = (uid: string, draft: McpLevels) => {
    const connection = items.find((item) => item.uid === uid);
    if (!connection) return;
    const viaRequest = !!editing?.request;
    updateScopes.mutate(
      { uid, levels: draft, requestUid: editing?.request?.uid },
      {
        onSuccess: () => {
          analytics.onScopeLevelsSaved({
            authorizationUid: uid,
            clientName: connection.clientName,
            changes: levelChanges(levelsOf(connection), draft, connection.scopes),
            viaRequest,
          });
          closeDrawer();
        },
        onError: () => analytics.onScopeLevelsSaveFailed({ authorizationUid: uid, viaRequest }),
      },
    );
  };

  const onRevoke = (connection: McpConnection) => {
    revoke.mutate(connection.uid, {
      onSuccess: () =>
        analytics.onAuthorizationRevoked({ authorizationUid: connection.uid, clientName: connection.clientName }),
      onError: () => {
        analytics.onAuthorizationRevokeFailed({ authorizationUid: connection.uid });
        toast.error(`Couldn’t revoke ${connection.clientName}. Please try again.`);
      },
    });
  };

  const connected = items.length > 0;

  return (
    <div className={tabCss.root}>
      <h5 className={tabCss.title}>MCP connections</h5>
      <section className={mcp.root}>
        <div className={mcp.header}>Connections</div>
        <div className={mcp.content}>
          <div className={mcp.desc}>
            <p className={s.useCasesLead}>Use LabOS from your AI sessions in Claude, Codex or any MCP client:</p>
            <ul className={s.useCases}>
              <li>Search members, teams, projects and events, and read the forum</li>
              <li>Look up investors and your warm-intro paths</li>
              <li>Go through feedback on your AI Apps</li>
            </ul>
            <p className={s.useCasesLead}>
              Each connection acts as you, within its own access. New connections start read only.
            </p>
          </div>

          {requestNotice && (
            <p className={s.requestNone} role="status">
              {REQUEST_NOTICE[requestNotice]}
            </p>
          )}

          {/* Not "unavailable" until the access check has run: right after sign-in the client may not see the session yet. */}
          {!accessChecked || (canConnect && connections.isLoading) ? (
            <p className={mcp.status}>Loading…</p>
          ) : !canConnect ? (
            <p className={mcp.status}>MCP connections aren’t available for your account yet.</p>
          ) : connections.isError ? (
            <div className={s.loadError} role="alert">
              <p className={mcp.status}>Couldn’t load your connections.</p>
              <Button
                size="s"
                variant="secondary"
                style="border"
                className={s.btn}
                onClick={() => connections.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              {connected && (
                <ul className={mcp.list}>
                  {items.map((connection) => (
                    <McpConnectionCard
                      key={connection.uid}
                      connection={connection}
                      isRevoking={revoke.isPending && revoke.variables === connection.uid}
                      onEdit={(source) => openDrawer(connection, source)}
                      onRevoke={() => onRevoke(connection)}
                    />
                  ))}
                </ul>
              )}

              {connected && !guideOpen && (
                <Button
                  size="s"
                  variant="secondary"
                  style="border"
                  className={s.btn}
                  onClick={() => setGuideOpen(true)}
                >
                  Add another connection
                </Button>
              )}

              {(!connected || guideOpen) && (
                <McpConnectGuide connected={connected} onClose={() => setGuideOpen(false)} />
              )}
            </>
          )}
        </div>

        <McpPermissionsDrawer
          key={editing ? `${editing.uid}-${editing.request?.uid ?? ''}` : 'closed'}
          connection={editingConnection}
          preset={editing?.preset}
          request={editing?.request}
          fullScreen={isPhone}
          isSaving={updateScopes.isPending}
          saveError={updateScopes.isError}
          onSave={save}
          onClose={closeDrawer}
        />
      </section>
    </div>
  );
}
