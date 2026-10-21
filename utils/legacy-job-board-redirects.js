/**
 * Permanent redirects from the old Getro job board's paths to the LabOS job board, LAB-2887.
 *
 * `jobs.protocol.ai` (the old Getro board) 301-redirects every path to `os.pl.xyz/jobs/<same path>`, so Google's
 * indexed Getro URLs and old shared links arrive here as `/jobs/companies/protocol-labs/jobs`, `/jobs/jobs?...`
 * and so on — paths no route serves (single segments fall into the PDF route's 404). Getro company slugs and job
 * ids don't map onto our team uids or role uids, so every one of them lands on the board itself.
 *
 * Only Getro's own top-level sections are listed: `/jobs/openings/<uid>` (role pages) and `/jobs/<pdf-slug>`
 * (job description PDFs) must keep working. CommonJS so both `next.config.mjs` and Jest can load it.
 */
const GETRO_SECTIONS = ['companies', 'jobs', 'talent-network', 'job-alerts', 'cookie-policy'];

// `:path*` matches zero segments too, so one rule covers both `/jobs/companies` and everything under it.
const LEGACY_JOB_BOARD_REDIRECTS = [
  ...GETRO_SECTIONS.map((section) => ({
    source: `/jobs/${section}/:path*`,
    destination: '/jobs',
    permanent: true,
  })),
  /* Getro links without the `/jobs` prefix: `os.pl.xyz/companies/<company>/jobs/<id>` (LAB-2924). Google still crawls
     them, and 47 of the 999 sampled 404s in Search Console's crawl stats were these. No route here serves `/companies`. */
  { source: '/companies/:path*', destination: '/jobs', permanent: true },
];

module.exports = { LEGACY_JOB_BOARD_REDIRECTS };
