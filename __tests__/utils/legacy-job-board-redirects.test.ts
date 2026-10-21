import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { LEGACY_JOB_BOARD_REDIRECTS } from '@/utils/legacy-job-board-redirects';

/** Resolves a pathname through the redirect list the way Next.js does: first matching source wins. Every
    destination is the plain `/jobs`, so there are no params to fill in. */
const redirectFor = (pathname: string) => {
  const rule = LEGACY_JOB_BOARD_REDIRECTS.find(({ source }) =>
    getPathMatch(source, { removeUnnamedParams: true })(pathname),
  );
  return rule ? { destination: rule.destination, permanent: rule.permanent } : null;
};

describe('LAB-2887: old Getro job board URLs redirect to the job board', () => {
  it.each([
    // The URL Anuj found in Google: jobs.protocol.ai/companies/protocol-labs/jobs, forwarded by Getro's 301.
    '/jobs/companies/protocol-labs/jobs',
    '/jobs/companies',
    '/jobs/companies/protocol-labs',
    '/jobs/companies/filecoin-foundation/jobs/41234567-senior-engineer',
    '/jobs/jobs',
    '/jobs/jobs/41234567-senior-engineer',
    '/jobs/talent-network',
    '/jobs/talent-network/join',
    '/jobs/job-alerts',
    // LAB-2924, from Search Console's crawl stats: Getro's own pages, and its links without the /jobs prefix.
    '/jobs/cookie-policy',
    '/companies/toku-2/jobs/37650942-payroll-manager',
    '/companies/harvard-university',
  ])('%s redirects permanently to /jobs', (from) => {
    expect(redirectFor(from)).toEqual({ destination: '/jobs', permanent: true });
  });

  it.each([
    '/jobs',
    '/jobs/openings/cmosjis1401oeos4g57qwryxs',
    '/jobs/head-of-engineering',
    '/jobs/redirect',
    '/jobs/unsubscribed',
    /* Root `/companies/…` used to be left alone here, on the belief that Getro forwards everything under `/jobs/`.
       Search Console's crawl stats show Google requesting root `/companies/…` Getro links (LAB-2924), so they redirect
       too; these are the real routes beside them that must not. */
    '/teams/cldvnt643004ju21kuruu5gx5',
    '/projects',
    '/company',
  ])('leaves %s alone', (pathname) => {
    expect(redirectFor(pathname)).toBeNull();
  });
});
