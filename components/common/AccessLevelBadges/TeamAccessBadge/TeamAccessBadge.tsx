import { TEAM_LEVEL_BADGES } from '../constants/accessBadges';

import { AccessBadge } from '../components/AccessBadge';

interface Props {
  accessLevel?: string | null;
  className?: string;
}

export function TeamAccessBadge(props: Props) {
  const { accessLevel, className } = props;
  const badge = accessLevel && TEAM_LEVEL_BADGES[accessLevel];

  if (!badge) {
    return null;
  }

  return <AccessBadge badge={badge} className={className} />;
}
