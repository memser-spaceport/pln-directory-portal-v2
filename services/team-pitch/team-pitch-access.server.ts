import type { TeamPitchAccess } from '@/services/team-pitch/hooks/useGetTeamPitchAccess';

export async function getTeamPitchAccessServer(slug: string): Promise<TeamPitchAccess | null> {
  const apiBase = process.env.DIRECTORY_API_URL;
  if (!apiBase || !slug) {
    return null;
  }

  try {
    const response = await fetch(`${apiBase}/v1/team-pitches/${encodeURIComponent(slug)}/access`, {
      method: 'GET',
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as TeamPitchAccess;
  } catch {
    return null;
  }
}
