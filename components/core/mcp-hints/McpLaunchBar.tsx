'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useMcpAnalytics } from '@/analytics/mcp.analytics';
import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';
import { CloseIcon } from '@/components/icons';
import { useOneTimeCallout } from '@/hooks/useOneTimeCallout';
import { MCP_CONNECTIONS_NEW_FLAG, MCP_LAUNCH_BAR_FLAG } from '@/utils/mcp';

import { useMcpHintAudience } from './useMcpHintAudience';

import s from './McpLaunchBar.module.scss';

/**
 * The MCP launch announcement in SiteHeader (LAB-3033), ported from the LAB-2948 prototype's `LaunchBanner`.
 * Shown to members who can connect an agent and have none yet, until they open MCP connections (which clears
 * that page's "New" flag) or close the bar. The contextual hints carry discovery after that.
 */
export function McpLaunchBar() {
  const router = useRouter();
  const analytics = useMcpAnalytics();
  const { ready, connectedClient } = useMcpHintAudience();
  const closed = useOneTimeCallout(MCP_LAUNCH_BAR_FLAG);
  const pageNotOpened = useOneTimeCallout(MCP_CONNECTIONS_NEW_FLAG);

  const visible = ready && !connectedClient && closed.open && pageNotOpened.open;

  const reported = useRef(false);
  useEffect(() => {
    if (!visible || reported.current) return;
    reported.current = true;
    analytics.onHintShown({ context: 'launch_bar', connected: false });
  }, [visible, analytics]);

  if (!visible) return null;

  return (
    <HighlightsBar>
      <div className={s.launch}>
        <div className={s.launchMain}>
          <span className={s.launchNew}>New</span>
          <span className={s.launchText}>
            Search teams and members, post news or reply in the forum right from your AI session. LabOS now works with
            AI agents.
          </span>
          <button
            type="button"
            className={s.launchCta}
            onClick={() => {
              analytics.onHintConnectClicked({ context: 'launch_bar' });
              router.push('/settings/mcp');
            }}
          >
            Set up now
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2.5 6h7M6.5 3l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <button
          type="button"
          className={s.launchClose}
          aria-label="Close"
          onClick={() => {
            analytics.onHintDismissed({ context: 'launch_bar' });
            closed.dismiss();
          }}
        >
          <CloseIcon />
        </button>
      </div>
    </HighlightsBar>
  );
}
