import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';

import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { workplaceTypeDisplayLabel } from '@/utils/jobs.utils';
import { getJobByUid } from '@/services/jobs/getJobByUid';

import { fetchLogoPngDataUri } from '../../utils/fetchLogoPngDataUri';

// The 1.91:1 ratio every platform crops OG images to.
const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_SIZE = 72;

// Crawlers refetch the image far more often than a posting changes, and a
// reshared link unfurls again on every platform it lands on.
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

/** Per-role social card: the role title over the hiring team's identity, so a
 *  shared `/jobs?job=<uid>` link previews as that opening rather than as the
 *  board. Referenced by the jobs page's generateMetadata; kept out of `/api`'s
 *  robots.txt disallow (see app/robots.ts) because Twitterbot honours
 *  robots.txt when fetching images. */
export async function GET(_request: Request, context: { params: Promise<{ uid: string }> }) {
  const { uid } = await context.params;
  const job = await getJobByUid(uid);

  // The HTML and the image are separate crawls, minutes or days apart, so a
  // role can be filled and delisted between them.
  if (!job) {
    return NextResponse.redirect(SOCIAL_IMAGE_URL);
  }

  const { role, team } = job;
  const logo = await fetchLogoPngDataUri(team.logoUrl, LOGO_SIZE);

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
          <div style={{ fontSize: 38, color: '#f8fafc', fontWeight: 600 }}>{team.name}</div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: titleFontSize(role.roleTitle),
            lineHeight: 1.18,
            color: '#fff',
            fontWeight: 700,
          }}
        >
          {role.roleTitle}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: '#cbd5e1' }}>
          <span>Protocol Labs Directory</span>
          {footerFacts(role).map((fact) => (
            <div key={fact} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: '#475569' }}>·</span>
              <span>{fact}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, headers: { 'Cache-Control': CACHE_CONTROL } },
  );
}

/** Where the role is, for the footer line. Most roles carry only one of the two
 *  (of 89 dev roles, 63 have no `workMode` and 27 no `location`), and one role
 *  in the set has neither — hence a list rather than a fixed three-part line. */
function footerFacts(role: { workMode: string | null; location: string[] }): string[] {
  const facts: string[] = [];

  if (role.workMode) {
    facts.push(workplaceTypeDisplayLabel(role.workMode));
  }
  if (role.location.length) {
    facts.push(role.location.join(', '));
  }

  return facts;
}

// Satori has no text measurement to shrink-to-fit with, so step the size down
// by title length to keep a long role title inside the card. The longest on dev
// is 80 characters ("MD-Qualified Research & Development Specialist for…").
function titleFontSize(title: string): number {
  if (title.length > 70) {
    return 52;
  }
  if (title.length > 45) {
    return 62;
  }
  return 72;
}
