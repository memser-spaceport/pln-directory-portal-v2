import { Tabs, TabsProps } from '@/components/common/Tabs';
import { useGetTabs } from './hooks/useGetTabs';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';
import { useForumAnalytics } from '@/analytics/forum.analytics';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  postsCount: number;
  commentsCount: number;
  memberUid?: string;
  memberName?: string;
  location?: 'section' | 'modal';
  tabProps?: Partial<Omit<TabsProps, 'tabs' | 'value' | 'onValueChange'>>;
}

export function ForumActivityTabs(props: Props) {
  const { activeTab, setActiveTab, postsCount, commentsCount, memberUid, memberName, location, tabProps } = props;
  const { onMemberProfileForumActivityTabClicked } = useForumAnalytics();

  const tabs = useGetTabs({
    activeTab,
    postsCount,
    commentsCount,
  });

  const handleTabChange = (newTab: string) => {
    if (memberUid && memberName && newTab !== activeTab) {
      onMemberProfileForumActivityTabClicked({
        memberUid,
        memberName,
        tab: newTab as ActiveTab,
        previousTab: activeTab,
        postsCount,
        commentsCount,
        location,
      });
    }
    setActiveTab(newTab as ActiveTab);
  };

  return <Tabs tabs={tabs} value={activeTab} onValueChange={handleTabChange} {...tabProps} />;
}
