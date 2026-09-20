import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';

import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getTeamNewsItemByUid } from '@/services/team-news/team-news.service';

import { fetchLogoPngDataUri } from '../../utils/fetchLogoPngDataUri';

// The 1.91:1 ratio every platform crops OG images to.
const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_SIZE = 72;

// Crawlers refetch the image far more often than the article changes, and the
// feed fetch behind it is `no-store`. A day of CDN caching keeps a link that
// gets reshared from re-rendering the card on every unfurl.
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

/** Per-article social card: title over the team's identity, so every shared
 *  news permalink previews as itself rather than as the directory. Referenced
 *  by /home's generateMetadata; kept out of `/api`'s robots.txt disallow (see
 *  app/robots.ts) because Twitterbot honours robots.txt when fetching images. */
export async function GET(_request: Request, context: { params: Promise<{ uid: string }> }) {
  const { uid } = await context.params;
  const item = await getTeamNewsItemByUid(uid);

  // The HTML and the image are separate crawls, minutes or days apart, so the
  // article can age out of the feed window between them.
  if (!item) {
    return NextResponse.redirect(SOCIAL_IMAGE_URL);
  }

  const logo = await fetchLogoPngDataUri(item.teamLogoUrl, LOGO_SIZE);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {logo && (
            <img
              src={logo}
              width={LOGO_SIZE}
              height={LOGO_SIZE}
              style={{ borderRadius: 16, backgroundColor: '#fff' }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 38, color: '#f8fafc', fontWeight: 600 }}>{item.teamName}</div>
            {item.sourceDomain && <div style={{ fontSize: 26, color: '#94a3b8' }}>{item.sourceDomain}</div>}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: titleFontSize(item.title),
            lineHeight: 1.18,
            color: '#fff',
            fontWeight: 700,
          }}
        >
          {item.title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: '#cbd5e1' }}>
          <span>Protocol Labs Directory</span>
          <span style={{ color: '#475569' }}>·</span>
          <span>{formatEventDate(item.eventDate)}</span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, headers: { 'Cache-Control': CACHE_CONTROL } },
  );
}

// Satori has no text measurement to shrink-to-fit with, so step the size down
// by title length to keep a long headline inside the card.
function titleFontSize(title: string): number {
  if (title.length > 130) return 46;
  if (title.length > 80) return 56;
  return 68;
}

function formatEventDate(eventDate: string): string {
  return new Date(eventDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
