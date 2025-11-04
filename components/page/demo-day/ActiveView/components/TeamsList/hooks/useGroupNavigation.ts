import { useEffect, useRef, useState } from 'react';
import { GroupedTeams, GroupWithCount } from './useTeamsSorting';

export const useGroupNavigation = (groupedTeams: GroupedTeams[], allGroupsWithCounts: GroupWithCount[]) => {
  const [activeGroup, setActiveGroup] = useState<string>('');
  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to specific group (group top at middle of viewport)
  const scrollToGroup = (stageGroup: string) => {
    const element = groupRefs.current.get(stageGroup);
    if (element) {
      const elementPosition = element.offsetTop;

      // Calculate position to place group top at middle of viewport
      const offsetPosition = elementPosition - 80;

      document.body.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Track which group enters the viewport from bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.body.scrollTop;
      const viewportBottom = scrollTop + window.innerHeight;

      // Find the last group that has entered the viewport (from bottom)
      let lastVisibleGroup = null;

      for (const group of groupedTeams) {
        const element = groupRefs.current.get(group.stageGroup);
        if (element) {
          const { offsetTop } = element;
          const groupTop = offsetTop;

          // Check if group top has entered the viewport
          if (groupTop < viewportBottom) {
            lastVisibleGroup = group.stageGroup;
          }
        }
      }

      if (lastVisibleGroup) {
        setActiveGroup(lastVisibleGroup);
      } else if (allGroupsWithCounts.length > 0) {
        // Fallback to first group if none have entered
        setActiveGroup(allGroupsWithCounts[0].stageGroup);
      }
    };

    document.body.addEventListener('scroll', handleScroll);
    handleScroll(); // Set initial active group

    return () => document.body.removeEventListener('scroll', handleScroll);
  }, [groupedTeams, allGroupsWithCounts]);

  return {
    activeGroup,
    groupRefs,
    scrollToGroup,
  };
};
