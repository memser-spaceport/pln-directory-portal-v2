import { IUserInfo } from '@/types/shared.types';
import { isAdminUser } from '@/utils/user/isAdminUser';

/**
 * Whitelisted user emails that can access the Deals page.
 * Add emails here to grant access. Admins always have access.
 */
const DEALS_WHITELISTED_EMAILS: string[] = [
  // Add whitelisted user emails here, e.g.:
  // 'user@example.com',
];

/**
 * Checks if a user has access to the Deals page.
 * Access is granted to:
 * - Directory admins (DIRECTORYADMIN role)
 * - Users whose email is in the whitelist
 */
export function hasDealsAccess(userInfo?: IUserInfo | null): boolean {
  if (!userInfo) return false;
  if (isAdminUser(userInfo)) return true;
  if (userInfo.email && DEALS_WHITELISTED_EMAILS.includes(userInfo.email)) return true;
  return false;
}
