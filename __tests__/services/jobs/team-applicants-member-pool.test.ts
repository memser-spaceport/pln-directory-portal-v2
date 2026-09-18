/**
 * The cast the mock borrows from the directory, and the two ways it silently
 * wasn't one.
 *
 * Its own file because the pool is memoised at module scope, and the sibling
 * suite deliberately makes `getMembers` REJECT so it can exercise the invented
 * fallback. That is exactly why both bugs below shipped: the real-member path —
 * the one every dev actually sees — had no test at all.
 *
 * Both were found by opening the screen in a browser, and both presented as
 * something other than what they were.
 */

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));
jest.mock('@/services/jobs/jobs.service', () => ({ fetchJobsList: jest.fn() }));

/**
 * A member as `parseMemberDetails` hands it back — which is NOT the API's shape.
 * It renames `uid` to `id`, and passes `location` through as the object the
 * `select` asked for (`location.city,location.country`).
 *
 * Written inside the factory because jest hoists `jest.mock` above every `const`
 * in the file; the tests read it back off the mock so there is still one copy.
 */
jest.mock('@/services/members.service', () => ({
  getMembers: jest.fn().mockResolvedValue({
    data: {
      formattedData: [
        {
          id: 'cldvnzpol027xu21k0ohe84vi',
          name: 'Alex Myyrann',
          profile: 'https://example.com/alex.jpg',
          skills: [{ title: 'Rust' }, { title: 'Go' }],
          location: { city: 'Berlin', country: 'Germany' },
          mainTeam: { name: 'Lattice Compute', role: 'Protocol Engineer' },
          teams: [{ name: 'Lattice Compute', role: 'Protocol Engineer' }],
          email: 'alex@example.com',
        },
      ],
    },
  }),
}));

import { getMembers } from '@/services/members.service';
import { fetchRoleApplicants } from '@/services/jobs/team-applicants.service';

/** The same object the factory above returns — read back, not re-typed. */
const borrowed = async () => (await (getMembers as jest.Mock)({}, '', 1, 24, true)).data.formattedData[0];

/* Deterministic: this uid hashes to 4 applications and 2 interests. */
const ROLE = 'role-1';

describe('the borrowed member pool', () => {
  /**
   * The pane beside the list fetches whoever the row names. The pool filtered on
   * `uid`, which formatted members do not have, so every borrowed member was
   * dropped and every row named an invented `mock-member-###` — and the profile
   * pane answered "This member's profile could not be loaded." on every single
   * applicant, in every environment.
   */
  it('names real members, so the pane has someone it can actually fetch', async () => {
    const { applications, interests } = await fetchRoleApplicants('team-1', ROLE);

    expect(applications.length + interests.length).toBeGreaterThan(0);
    for (const row of [...applications, ...interests]) {
      expect(row.memberUid).toBe((await borrowed()).id);
      expect(row.memberUid).not.toMatch(/^mock-member-/);
    }
  });

  /**
   * And the row has to survive its own schema. `location` is an object on a
   * formatted member and `string | null` in the contract, so passing it through
   * made every row fail the parse — which the service rejects on, React Query
   * retries, and the list renders as a "Loading…" that never resolves. A wrong
   * type three layers up arrived as a spinner.
   */
  it('flattens the location object the schema will not take', async () => {
    /* Resolving IS the assertion. The service parses every row through
       `roleApplicantsResponseSchema` before it returns, so a `location` object
       rejected there comes back as a rejected promise — which React Query
       retries, and the list renders as a "Loading…" that never resolves. A wrong
       type three layers up arrived as a spinner.

       Not re-parsed here: what comes back carries `kind`, added after the wire
       parse, and the schema is strict. */
    const result = await fetchRoleApplicants('team-1', ROLE);

    expect(result.applications[0].location).toBe('Berlin, Germany');
    expect(typeof result.interests[0].location).toBe('string');
  });

  it('carries the rest of the borrowed person through', async () => {
    const { applications } = await fetchRoleApplicants('team-1', ROLE);

    expect(applications[0].name).toBe((await borrowed()).name);
    expect(applications[0].headline).toBe('Protocol Engineer');
    expect(applications[0].currentCompany).toBe('Lattice Compute');
    expect(applications[0].tags).toEqual(['Rust', 'Go']);
  });
});
