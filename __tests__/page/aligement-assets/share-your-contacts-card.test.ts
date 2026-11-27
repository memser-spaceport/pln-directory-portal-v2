import { activitiesData, canSeeActivity } from '@/components/page/aligement-assets/activities/data';

const shareYourContacts = activitiesData.activities.find((activity) => activity.id === 'share-your-contacts')!;

describe('Share Your Contacts with the Network', () => {
  test('is visible to members outside PL Infra', () => {
    expect(canSeeActivity(shareYourContacts, false)).toBe(true);
  });

  test('tells members to download their LinkedIn connections before November 30', () => {
    expect(shareYourContacts.popupContent.rules.join(' ')).toMatch(/LinkedIn.*before November 30/);
  });
});
