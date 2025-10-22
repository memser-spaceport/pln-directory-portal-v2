import capitalize from 'lodash/capitalize';

export const getGroupTitleByGroupName = (groupName: string) => {
  switch (groupName) {
    case 'members':
      return 'Members';
    case 'teams':
      return 'Teams';
    case 'projects':
      return 'Projects';
    case 'events':
      return 'Events';
    case 'forumThreads':
      return 'Forum';
    default:
      return capitalize(groupName);
  }
};
