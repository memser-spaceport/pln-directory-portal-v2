export function hasForumAccess(accessLevel: string = '') {
  return ['L2', 'L3', 'L4', 'L6'].includes(accessLevel);
}
