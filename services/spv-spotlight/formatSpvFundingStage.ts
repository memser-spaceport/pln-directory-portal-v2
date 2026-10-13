/**
 * The team's stage as a word for "…leading an SPV into the {Team} {stage}
 * round", or null to leave it out. The directory's stage is free text, so only
 * stages that read as a round name pass: "pre-seed", "seed", "Series A".
 * Anything else ("Series D and later", "Not Applicable", blank) is dropped
 * rather than printed into the sentence.
 */
export function formatSpvFundingStage(stage?: string | null): string | null {
  const value = stage?.trim() ?? '';
  if (/^pre-?seed$/i.test(value)) return 'pre-seed';
  if (/^seed$/i.test(value)) return 'seed';
  const series = value.match(/^series ([a-z])$/i);
  if (series) return `Series ${series[1].toUpperCase()}`;
  return null;
}
