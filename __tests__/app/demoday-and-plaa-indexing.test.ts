/**
 * @jest-environment node
 */
/**
 * LAB-2924: Search Console listed Demo Day "completed" pages as copies of each other, and found /alignment-asset with
 * no canonical. Pages under a Demo Day are dashboards (admins, founders, investors) and stay out of the index; the two
 * public ones, the event landing page and its completed view, are indexable under their own address.
 */
jest.mock('@/app/actions/demo-day.actions', () => ({ getDemoDayState: jest.fn(), getMemberInfo: jest.fn() }));
jest.mock('@/services/plaa/summary.service', () => ({ getPlaaSummary: jest.fn() }));

import { generateMetadata as demoDayLayoutMetadata } from '@/app/demoday/[demoDayId]/layout';
import { generateMetadata as demoDayLandingMetadata } from '@/app/demoday/[demoDayId]/page';
import { generateMetadata as demoDayCompletedMetadata } from '@/app/demoday/[demoDayId]/completed/page';

const params = { params: Promise.resolve({ demoDayId: 'plf25' }) };

beforeAll(() => {
  process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
});

it('keeps every page under a Demo Day out of the index by default, links still followed', async () => {
  expect((await demoDayLayoutMetadata(params)).robots).toEqual({ index: false, follow: true });
});

it.each([
  ['the event landing page', demoDayLandingMetadata, 'https://os.pl.xyz/demoday/plf25'],
  ['the completed view', demoDayCompletedMetadata, 'https://os.pl.xyz/demoday/plf25/completed'],
])('indexes %s under its own address', async (_name, generate, canonical) => {
  const metadata = await generate(params);
  expect(metadata.robots).toEqual({ index: true, follow: true });
  expect(metadata.alternates?.canonical).toBe(canonical);
});

it('gives /alignment-asset its own canonical address', () => {
  /* A static export, built when the module loads, so the base URL must be set before the module is loaded: CI has
     none, and the local env files do. */
  process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
  let canonical: unknown;
  jest.isolateModules(() => {
    canonical = require('@/app/alignment-asset/page').metadata.alternates?.canonical;
  });
  expect(canonical).toBe('https://os.pl.xyz/alignment-asset');
});
