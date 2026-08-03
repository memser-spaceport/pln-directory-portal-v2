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
 * Stand-in for the backend's "this address is already linked to another LabOS
 * account" rejection, so the failure copy can be reviewed without a server.
 * Production surfaces this today as a bare `toast.error('Email Update Failed')`.
 */
export const ALREADY_TAKEN_EMAIL = 'taken@gmail.com';
