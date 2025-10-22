export function isInvestor(accessLevel?: string) {
  return ['L5', 'L6'].includes(accessLevel || '');
}
