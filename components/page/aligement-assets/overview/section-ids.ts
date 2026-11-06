/**
 * Anchors the four How It Works steps scroll to. Shared so a renamed section
 * cannot leave a step pointing at an id that no longer exists.
 */
export const OVERVIEW_SECTION_IDS = {
  whoItsFor: 'who-its-for',
  snapshotsAndPoints: 'snapshots-and-points',
  pointsToPlaa: 'points-to-plaa-conversion',
  redeemingPlaa: 'redeeming-plaa',
} as const;
