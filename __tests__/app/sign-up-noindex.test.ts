/**
 * LAB-2924: the sign-up flow stays out of Google. Search Console listed `/sign-up?returnTo=…` URLs as duplicates of
 * each other; the layout marks every sign-up page noindex, and links on them stay followable.
 */
import { metadata } from '@/app/sign-up/layout';

it('marks every sign-up page noindex, follow', () => {
  expect(metadata.robots).toEqual({ index: false, follow: true });
});
