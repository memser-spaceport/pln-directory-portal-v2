export type LeaderboardType = 'CURRENT_SNAPSHOT' | 'CUMULATIVE' | 'PAST_ROUND';

export interface ApiLeaderboardEntry {
  id: string;
  roundId: string;
  type: LeaderboardType;
  rank: number;
  name: string;
  activities: string | null;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardApiResponse {
  roundId: string;
  roundNumber: number;
  isCurrentRound: boolean;
  month: string | null;
  year: number | null;
  entries: ApiLeaderboardEntry[];
}

export interface MappedLeaderboardEntry {
  rank: number;
  name: string;
  activities: string;
  points: number;
}

export const mapEntries = (entries: ApiLeaderboardEntry[]): MappedLeaderboardEntry[] =>
  entries.map((e) => ({
    rank: e.rank,
    name: e.name,
    activities: e.activities ?? '',
    points: e.points,
  }));

/** CURRENT_SNAPSHOT = current round; CUMULATIVE = all-time */
export const splitLeaderboardEntries = (entries: ApiLeaderboardEntry[]) => ({
  currentSnapshotData: mapEntries(entries.filter((e) => e.type === 'CURRENT_SNAPSHOT')),
  cumulativeData: mapEntries(entries.filter((e) => e.type === 'CUMULATIVE')),
});

/** Past rounds use PAST_ROUND; fall back to CURRENT_SNAPSHOT when present */
export const getPastRoundLeaderboardEntries = (entries: ApiLeaderboardEntry[]): MappedLeaderboardEntry[] =>
  mapEntries(entries.filter((e) => e.type === 'PAST_ROUND' || e.type === 'CURRENT_SNAPSHOT'));
