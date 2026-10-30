import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { SettingsMenu } from '@/components/page/settings/SettingsMenu';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { McpConnectionsPage } from '@/components/page/settings/mcp';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { SHOW_MCP_CONNECTIONS_PAGE } from '@/utils/mcp';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import styles from './page.module.css';

/** Settings → MCP connections (LAB-2995). Agents' refusals link here as `/settings/mcp?request=<id>`. */
async function McpSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  if (!SHOW_MCP_CONNECTIONS_PAGE) notFound();

  const [{ isLoggedIn, userInfo }, resolvedSearchParams] = await Promise.all([getCookiesFromHeaders(), searchParams]);
  const params = new URLSearchParams(resolvedSearchParams).toString();

  if (!isLoggedIn) {
    // Straight to /home: `/` 308s to /home and drops the query, which would lose `returnTo` and the agent's `request`.
    redirect(`/home?${params ? `${params}&` : ''}returnTo=settings-mcp#login`);
  }

  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const isTeamLead = (userInfo.leadingTeams ?? []).length > 0;

  return (
    <div className={styles.privacy}>
      <div className={styles.privacy__backbtn}>
        <SettingsBackButton title="MCP connections" />
      </div>
      <div className={styles.privacy__main}>
        <aside className={styles.privacy__main__aside}>
          <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} userInfo={userInfo} />
        </aside>
        <div className={styles.privacy__main__content}>
          <McpConnectionsPage />
        </div>
      </div>
    </div>
  );
}

export default McpSettingsPage;

export const metadata: Metadata = {
  title: 'MCP connections | Protocol Labs Directory',
  description: 'Connect AI agents to LabOS and choose what each connection can do.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};
