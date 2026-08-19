import { IUserInfo } from '@/types/shared.types';

/** Mocked member for the Settings › Contact details prototype. No API, no stores. */
export const MOCK_MEMBER = {
  email: 'a@plrs.xyz',
  linkedin: 'johndoe',
  telegram: '@johndoe',
  github: 'johndoe',
  twitter: '@johndoe',
  discord: 'johndoe',
  shareContacts: true,
};

/** Which OAuth/wallet logins the mocked member has linked, for Connected Accounts. */
export const LINKED_ACCOUNTS = ['google'];

/**
 * `EmailIdentityRow` is the shipped component, so it takes a real member identity. Analytics is
 * all it reads this for; the uid it would PATCH is this one, which no account matches.
 */
export const MOCK_MEMBER_UID = 'mock-member-uid';

export const MOCK_USER_INFO = {
  uid: MOCK_MEMBER_UID,
  email: MOCK_MEMBER.email,
  name: 'John Doe',
} as IUserInfo;
