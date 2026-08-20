/**
 * Renders `Team.teamSize` for the profile header. The column is free text on the API — a bare
 * count (`"50"`), a range label (`"11-50"`), or an open-ended one (`"500+"`) — and all of them
 * read as "<size> people". Range dashes are normalised to an en dash to match the design.
 */
export function formatTeamSize(teamSize: string | number | null | undefined): string | undefined {
  if (teamSize === null || teamSize === undefined) {
    return undefined;
  }

  const size = String(teamSize)
    .trim()
    .replace(/\s*[-–—]\s*/g, '–');
  if (!size) {
    return undefined;
  }

  return `${size} people`;
}
