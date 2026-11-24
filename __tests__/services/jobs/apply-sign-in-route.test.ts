import {
  applySignUpReturnPath,
  stripApplySignInMarkersFromUrl,
  withApplySignIn,
} from '@/services/jobs/job-apply-resume';

const OK = '/jobs/openings/role1?applySignUp=role1';

it('writes the marker, keeps other params, and clears it with no role', () => {
  expect(withApplySignIn('?a=1', 'role1')).toBe('?a=1&applySignIn=role1');
  expect(withApplySignIn('?applySignIn=old&a=1', undefined)).toBe('?a=1');
});

it.each([
  '/jobs?roleCategory=X&prefillEmail=a%40b.c&applySignIn=role1',
  '/jobs/openings/role1?utm_source=x&applySignIn=role1',
])('sends %s to the role page with the uid only', (returnTo) => expect(applySignUpReturnPath(returnTo)).toBe(OK));

it.each([
  '/jobs?roleCategory=X',
  '/teams/t1?applySignIn=role1',
  '/jobs/openings/role2?applySignIn=role1',
  '//evil.example/jobs?applySignIn=role1',
  '/\\evil.example/jobs?applySignIn=role1',
  '/x/../jobs?applySignIn=role1',
  '/jobs/openings/role%31?applySignIn=role1',
  '/jobs#x?applySignIn=role1',
  '/jobs?applySignIn=role1%2F..',
])('rejects %s', (returnTo) => expect(applySignUpReturnPath(returnTo)).toBeNull());

it('strips both markers and keeps applyTo and the hash', () => {
  window.history.replaceState({}, '', '/jobs?applySignIn=a&applySignUp=a&applyTo=a#x');
  stripApplySignInMarkersFromUrl();
  expect(`${window.location.search}${window.location.hash}`).toBe('?applyTo=a#x');
});
