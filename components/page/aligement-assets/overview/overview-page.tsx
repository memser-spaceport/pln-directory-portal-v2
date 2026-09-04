import ActiveMemberOverview, { ActiveMemberOverviewProps } from './active-member-overview';

// RBAC (Active Member vs. Prospective Visitor) isn't wired up yet, so this
// always renders the Active Member experience. Once a role signal exists,
// branch on it here — ActiveMemberOverview stays self-contained so it can
// be dropped into that branch without changes.
export default function OverviewPage(props: ActiveMemberOverviewProps) {
  return <ActiveMemberOverview {...props} />;
}
