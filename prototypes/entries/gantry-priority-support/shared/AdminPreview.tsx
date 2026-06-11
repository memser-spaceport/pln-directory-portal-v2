import type { MockGantryItem, MockPriority } from '../mocks';
import { PRIORITY_LABELS } from '../mocks';

interface Props {
  readonly item: MockGantryItem;
  readonly viewerPriority?: MockPriority | null;
  readonly viewerNote?: string | null;
  readonly extra?: string;
}

export function AdminPreview({ item, viewerPriority, viewerNote, extra }: Props) {
  const dist = item.priorityDistribution;
  const avg = item.avgPriority?.toFixed(1) ?? '—';

  return (
    <>
      <div>
        {item.upvoteCount} supporters · avg priority {avg} · {dist.high} High · {dist.medium} Med · {dist.low} Low
      </div>
      {viewerPriority && (
        <div>
          You: {PRIORITY_LABELS[viewerPriority]}
          {viewerNote ? ` — “${viewerNote.slice(0, 60)}${viewerNote.length > 60 ? '…' : ''}”` : ''}
        </div>
      )}
      {extra && <div>{extra}</div>}
    </>
  );
}
