import { Tabs, TabsProps } from '@/components/common/Tabs';
import { useGetTabs } from './hooks/useGetTabs';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  postsCount: number;
  commentsCount: number;
  tabProps?: Partial<Omit<TabsProps, 'tabs' | 'value' | 'onValueChange'>>;
}

export function ForumActivityTabs(props: Props) {
  const { activeTab, setActiveTab, postsCount, commentsCount, tabProps } = props;

  const tabs = useGetTabs({
    activeTab,
    postsCount,
    commentsCount,
  });

  return <Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab as (v: string) => {}} {...tabProps} />;
}
