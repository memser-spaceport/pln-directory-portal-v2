export const getColorObject = (groupName: string) => {
  switch (groupName) {
    case 'Team':
      return {
        color: '#156FF7',
        bgColor: '#156FF71A',
      };
    case 'Project':
      return {
        color: '#C050E6',
        bgColor: '#C050E61A',
      };
    default:
      return {
        color: '#156ff7',
        bgColor: '#f1f5f9',
      };
  }
};
