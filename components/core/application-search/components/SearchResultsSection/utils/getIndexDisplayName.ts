// Helper function to get display name for index
export const getIndexDisplayName = (index: string) => {
  switch (index) {
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
      return index.charAt(0).toUpperCase() + index.slice(1);
  }
};
