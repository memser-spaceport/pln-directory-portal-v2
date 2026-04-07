import { IMember } from '@/types/members.types';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';

import { AuthSection } from '../AuthSection';

import { SignInIllustration } from './components/SignInIllustration';

import s from './UserNotLoggedForumView.module.scss';

interface Props {
  member: IMember;
  activeTab: ActiveTab;
}

export function UserNotLoggedForumView(props: Props) {
  const { member, activeTab } = props;

  const description = `See ${member.name}’s posts and comments on the PL Forum and follow discussions across the network.`;

  return (
    <div className={s.root}>
      <SignInIllustration />
      <div className={s.title}>Sign in to view forum activity</div>
      <div className={s.description}>{description}</div>

      <AuthSection memberUid={member.id} memberName={member.name} activeTab={activeTab} />
    </div>
  );
}
