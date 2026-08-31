import { toReferralRecipient } from '@/prototypes/entries/job-board/components/ReferModal/utils/toReferralRecipient';
import type { RecipientOption } from '@/prototypes/entries/job-board/components/ReferModal/types';

const option = (overrides: Partial<RecipientOption> = {}): RecipientOption => ({
  label: 'Mira Chen',
  value: 'member-1',
  ...overrides,
});

describe('toReferralRecipient', () => {
  it('sends a picked member as a uid, so the browser never holds their address', () => {
    expect(toReferralRecipient(option())).toEqual({ memberUid: 'member-1', name: 'Mira Chen' });
  });

  it('sends a typed address as an email', () => {
    const typed = option({ label: 'mira@example.com', value: 'mira@example.com', isEmail: true });

    expect(toReferralRecipient(typed)).toEqual({ email: 'mira@example.com' });
  });

  it('treats an address-shaped value as an email even when the flag is missing', () => {
    const unflagged = option({ label: 'mira@example.com', value: 'mira@example.com' });

    expect(toReferralRecipient(unflagged)).toEqual({ email: 'mira@example.com' });
  });

  it('trusts the isEmail flag over the value shape', () => {
    const flagged = option({ label: 'not-an-address', value: 'not-an-address', isEmail: true });

    expect(toReferralRecipient(flagged)).toEqual({ email: 'not-an-address' });
  });

  it('drops the picker-only fields — description, image, isTeamLead never reach the API', () => {
    const decorated = option({
      description: 'Engineer · Protocol Labs',
      image: '/avatar.png',
      isTeamLead: true,
      __isNew__: false,
    });

    expect(Object.keys(toReferralRecipient(decorated)).sort()).toEqual(['memberUid', 'name']);
  });

  it('carries the member name through so the API can address the note', () => {
    expect(toReferralRecipient(option({ label: 'Ada Lovelace', value: 'member-9' }))).toEqual({
      memberUid: 'member-9',
      name: 'Ada Lovelace',
    });
  });

  it('never emits both a uid and an email for one recipient', () => {
    [option(), option({ value: 'mira@example.com', isEmail: true })].forEach((opt) => {
      const recipient = toReferralRecipient(opt);
      expect('email' in recipient && 'memberUid' in recipient).toBe(false);
    });
  });
});
