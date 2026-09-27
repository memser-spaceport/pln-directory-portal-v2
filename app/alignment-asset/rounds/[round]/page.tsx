import { notFound, permanentRedirect } from 'next/navigation';

interface PastRoundPageProps {
  params: Promise<{ round: string }>;
}

/**
 * PLAA-95: round (snapshot) content lives only on the Leaderboard page now, so
 * every `/alignment-asset/rounds/:n` link — including the ones already out in
 * snapshot emails and cross-page deep links — is permanently redirected to the
 * Leaderboard with that round preselected. Covers rounds 1..N and any future
 * round; the Leaderboard itself decides whether the round actually exists.
 */
export default async function PastRoundPage({ params }: PastRoundPageProps) {
  const { round: roundParam } = await params;
  const roundNumber = parseInt(roundParam, 10);

  if (isNaN(roundNumber) || roundNumber < 1) notFound();

  permanentRedirect(`/alignment-asset/leaderboard?round=${roundNumber}`);
}
