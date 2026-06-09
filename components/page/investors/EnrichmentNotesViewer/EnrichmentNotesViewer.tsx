import { ENRICHMENT_NOTE_PREFIXES } from '@/services/investors/constants';
import s from './EnrichmentNotesViewer.module.scss';

interface Props {
  notes: string;
}

interface ParsedNote {
  prefix: string;
  label: string;
  body: string;
}

function parse(notes: string): ParsedNote[] {
  if (!notes) return [];
  return notes
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((token) => {
      const colonIdx = token.indexOf(':');
      const prefix = colonIdx === -1 ? token : token.slice(0, colonIdx);
      const body = colonIdx === -1 ? '' : token.slice(colonIdx + 1);
      const known = ENRICHMENT_NOTE_PREFIXES.find((p) => p.prefix === prefix);
      return {
        prefix,
        label: known ? known.label : prefix,
        body,
      };
    });
}

export function EnrichmentNotesViewer({ notes }: Props) {
  const parsed = parse(notes);
  if (parsed.length === 0) {
    return <span className={s.empty}>No enrichment notes</span>;
  }
  return (
    <ul className={s.list}>
      {parsed.map((p, i) => (
        <li key={i} className={s.item}>
          <span className={s.label}>{p.label}</span>
          {p.body && <span className={s.body}>{p.body}</span>}
        </li>
      ))}
    </ul>
  );
}
