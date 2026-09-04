import ActiveMemberOverview, { ActiveMemberOverviewProps } from './active-member-overview';
import ProspectiveVisitorOverview from './prospective-visitor-overview';

interface OverviewPageProps extends ActiveMemberOverviewProps {
  /**
   * Query-param preview only (?persona=prospect on /alignment-asset/overview)
   * — there's no backend RBAC role signal yet. Once one exists, branch on
   * that instead of this flag.
   */
  isProspectiveVisitor?: boolean;
}

// RBAC (Active Member vs. Prospective Visitor) isn't wired up yet, so this
// branches on a `?persona=prospect` query param for local/preview purposes.
// Once a real role signal exists, branch on that here instead — both
// persona components stay self-contained so they can be dropped into that
// branch without changes.
export default function OverviewPage({ isProspectiveVisitor, ...props }: OverviewPageProps) {
  if (isProspectiveVisitor) {
    return <ProspectiveVisitorOverview trustHoldings={props.trustHoldings} />;
  }
  return <ActiveMemberOverview {...props} />;
}
