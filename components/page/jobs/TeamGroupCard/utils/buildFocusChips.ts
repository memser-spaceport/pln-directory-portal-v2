type FocusChip = {
  title: string;
  kind: 'focus' | 'sub';
};

type Output = {
  shown: FocusChip[];
  hidden: FocusChip[];
  moreCount: number;
};

export function buildFocusChips(focusAreas: string[], subFocusAreas: string[], max: number): Output {
  const dedupedSub = subFocusAreas.filter((t) => !focusAreas.includes(t));

  const all: FocusChip[] = [
    ...focusAreas.map((title): FocusChip => ({ kind: 'focus', title })),
    ...dedupedSub.map((title): FocusChip => ({ kind: 'sub', title })),
  ];

  const shown = all.slice(0, max);
  const hidden = all.slice(max);
  const moreCount = hidden.length;

  return { shown, hidden, moreCount };
}
