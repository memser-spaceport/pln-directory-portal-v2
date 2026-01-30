import Link from 'next/link';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { Button } from '@/components/common/Button';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';
import { hasForumAccess } from '@/components/page/member-details/ForumActivity/utils/hasForumAccess';
import { useForumAnalytics } from '@/analytics/forum.analytics';

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
  const { onMemberProfileForumActivityStartDiscussionClicked, onMemberProfileForumActivityBrowseDiscussionsClicked } =
    useForumAnalytics();

  const isLoggedOut = !userInfo;
  const isPostsTab = activeTab === 'posts';
  const hasAccess = hasForumAccess(userInfo.accessLevel);

  const { title, description } = getLabels({
    hasAccess,
    isPostsTab,
    isLoggedOut,
    member,
  });

  const handleStartDiscussionClick = () => {
    onMemberProfileForumActivityStartDiscussionClicked({
      memberUid: member.id,
      memberName: member.name,
      activeTab,
    });
  };

  const handleBrowseDiscussionsClick = () => {
    onMemberProfileForumActivityBrowseDiscussionsClicked({
      memberUid: member.id,
      memberName: member.name,
      activeTab,
    });
  };

  return (
    <div className={s.root}>
      <EmptyIllustration />
      <div className={s.title}>{title}</div>
      <div className={s.description}>{description}</div>
      {isOwner && (
        <Link
          href="/forum"
          className={s.link}
          onClick={isPostsTab ? handleStartDiscussionClick : handleBrowseDiscussionsClick}
        >
          <Button style="border">{isPostsTab ? 'Start a discussion' : 'Browse forum discussions'}</Button>
        </Link>
      )}
      {isLoggedOut && <AuthSection memberUid={member.id} memberName={member.name} activeTab={activeTab} />}
    </div>
  );
}
