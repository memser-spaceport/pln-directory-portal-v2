// Stage group order for sorting
export const STAGE_GROUP_ORDER_ASC = ['pre-seed', 'seed', 'series', 'fund', 'other'];
export const STAGE_GROUP_ORDER_DESC = ['fund', 'series', 'seed', 'pre-seed', 'other'];

// Helper function to determine stage group
export const getStageGroup = (fundingStage: string): string => {
  const stageLower = fundingStage.toLowerCase();

  if (stageLower.includes('pre-seed') || stageLower.includes('preseed')) {
    return 'pre-seed';
  } else if (stageLower.includes('seed') && !stageLower.includes('pre')) {
    return 'seed';
  } else if (stageLower.includes('fund')) {
    return 'fund';
  } else if (
    stageLower.includes('series a') ||
    stageLower.includes('series b') ||
    stageLower.includes('series c') ||
    stageLower.includes('series d') ||
    stageLower.includes('series')
  ) {
    return 'series';
  }

  // All other stages go to "Other" group
  return 'other';
};

// Helper function to get label for stage group
export const getStageGroupLabel = (stageGroup: string): string => {
  switch (stageGroup) {
    case 'pre-seed':
      return 'Pre-seed';
    case 'seed':
      return 'Seed';
    case 'series':
      return 'Series A/B';
    case 'fund':
      return 'Fund';
    case 'other':
      return 'Other';
    default:
      return '';
  }
};

