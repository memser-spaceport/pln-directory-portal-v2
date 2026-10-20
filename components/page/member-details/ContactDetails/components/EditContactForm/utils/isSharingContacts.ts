import { IMemberPreferences } from '@/types/members.types';

import { CONTACT_VISIBILITY_KEYS } from '../constants/contactVisibilityKeys';

// Only the contact keys count: the same preferences object holds one-time UI flags
// (`showOfficeHoursDialog`, `showForumBanner`, ...) that are set to false when dismissed.
export function isSharingContacts(preferences?: IMemberPreferences) {
  return CONTACT_VISIBILITY_KEYS.every((key) => preferences?.[key] ?? true);
}
