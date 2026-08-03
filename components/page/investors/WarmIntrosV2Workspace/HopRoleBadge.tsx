import clsx from 'clsx';
import s from './HopRoleBadge.module.scss';

export type HopRole = 'pl_connector' | 'founder' | 'co_investor' | 'investor' | 'pl_org' | string;

const ROLE_LABEL: Record<string, string> = {
  pl_connector: 'PL Member',
  founder: 'Founder',
  co_investor: 'Co-investor',
  investor: 'Investor',
};

function roleClass(role: string): string | undefined {
  if (role === 'pl_connector') return s.pl;
  if (role === 'founder') return s.founder;
  if (role === 'co_investor') return s.coInvestor;
  if (role === 'investor') return s.investor;
  return undefined;
}

/** Small role pill beside path hop chips. Hidden for Protocol Labs org stub. */
export function HopRoleBadge({ role }: { role?: string | null }) {
  if (!role || role === 'pl_org') return null;
  const label = ROLE_LABEL[role] ?? role.replace(/_/g, ' ');
  return <span className={clsx(s.badge, roleClass(role))}>{label}</span>;
}

/** Map path relationKind → hop role for alternate connectors. */
export function hopRoleFromRelationKind(relationKind?: string | null): HopRole {
  if (relationKind === 'founder_bridge') return 'founder';
  if (relationKind === 'coinvestor_bridge') return 'co_investor';
  return 'pl_connector';
}
