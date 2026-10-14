import { notFound, permanentRedirect } from 'next/navigation';

interface PastRoundPageProps {
  params: Promise<{ round: string }>;
}

export default async function PastRoundPage({ params }: PastRoundPageProps) {
  const { round: roundParam } = await params;
  const roundNumber = parseInt(roundParam, 10);

  if (isNaN(roundNumber) || roundNumber < 1) notFound();

  permanentRedirect(`/alignment-asset/leaderboard?round=${roundNumber}`);
}
