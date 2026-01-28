import Link from 'next/link';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { Button } from '@/components/common/Button';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';
import { hasForumAccess } from '@/components/page/member-details/ForumActivity/utils/hasForumAccess';

import { getLabels } from './utils/getLabels';

import { AuthSection } from './components/AuthSection';
import { EmptyIllustration } from './components/EmptyIllustration';

import s from './NoForumActivity.module.scss';

interface Props {
  member: IMember;
  isOwner: boolean;
  userInfo: IUserInfo;
  activeTab: ActiveTab;
}

export function NoForumActivity(props: Props) {
  const { isOwner, userInfo, activeTab, member } = props;

  const isLoggedOut = !userInfo;
  const isPostsTab = activeTab === 'posts';
  const hasAccess = hasForumAccess(userInfo.accessLevel);

  const { title, description } = getLabels({
    hasAccess,
    isPostsTab,
    isLoggedOut,
    member,
  });

  return (
    <div className={s.root}>
      <EmptyIllustration />
      <div className={s.title}>{title}</div>
      <div className={s.description}>{description}</div>
      {isOwner && (
        <Link href="/forum" className={s.link}>
          <Button style="border">{isPostsTab ? 'Start a discussion' : 'Browse forum discussions'}</Button>
        </Link>
      )}
      {isLoggedOut && <AuthSection />}
    </div>
  );
}
