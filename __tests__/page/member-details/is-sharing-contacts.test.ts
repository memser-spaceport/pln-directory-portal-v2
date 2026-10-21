import { isSharingContacts } from '@/components/page/member-details/ContactDetails/components/EditContactForm/utils/isSharingContacts';
import { IMemberPreferences } from '@/types/members.types';

const sharedContacts = {
  showBluesky: true,
  showDiscord: true,
  showEmail: true,
  showGithub: true,
  showGithubHandle: true,
  showGithubProjects: true,
  showLinkedin: true,
  showTelegram: true,
  showTwitter: true,
};

describe('isSharingContacts', () => {
  it('is on when every contact is shown', () => {
    expect(isSharingContacts(sharedContacts)).toBe(true);
  });

  it('ignores dismissed one-time dialogs and banners stored alongside the contact settings', () => {
    const preferences = {
      ...sharedContacts,
      showOfficeHoursDialog: false,
      showForumBanner: false,
      showDemoDayConnectDialog: false,
      showDemoDayInvestDialog: false,
    } as IMemberPreferences;

    expect(isSharingContacts(preferences)).toBe(true);
  });

  it('is off when any contact is hidden', () => {
    expect(isSharingContacts({ ...sharedContacts, showTelegram: false })).toBe(false);
  });

  it('treats a contact key that was never saved as shown', () => {
    const { showBluesky, showGithub, ...olderPreferences } = sharedContacts;

    expect(isSharingContacts(olderPreferences)).toBe(true);
  });

  it('is on for a member without preferences', () => {
    expect(isSharingContacts(undefined)).toBe(true);
  });
});
