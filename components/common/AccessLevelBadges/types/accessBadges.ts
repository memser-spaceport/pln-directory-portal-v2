import type { IMember } from '@/types/members.types';
import type { BadgeProps } from '@/components/common/Badge';

export type MemberState = IMember['rbac']['status'];

export interface AccessBadgeContent {
  label: string;
  description: string;
  variant: BadgeProps['variant'];
}
