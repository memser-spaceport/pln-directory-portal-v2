import { KindGlyph } from '../home-refactor-b/KindGlyph';
import { EnvelopeGlyph } from '../intro-shared/EnvelopeGlyph';

import { AGENT_TOPIC_LABEL, type AgentTopic } from './agentScript';
import s from './AgentPanel.module.scss';

/** Stroked on the 16px grid at KindGlyph's 1.4 weight; the DS UsersThreeIcon is a filled outline that thins to ~1px here. */
const strokes = { stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function TopicGlyph({ topic }: { topic: AgentTopic }) {
  switch (topic) {
    case 'intro':
      return <EnvelopeGlyph />;
    case 'team':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8.75" r="2.25" {...strokes} />
          <path d="M4.25 13.75a4.4 4.4 0 0 1 7.5 0" {...strokes} />
          <path d="M3.9 7.5a1.9 1.9 0 1 1 1.85-2.35M1.25 9.75A3.6 3.6 0 0 1 3.9 7.5" {...strokes} />
          <path d="M12.1 7.5a1.9 1.9 0 1 0-1.85-2.35M14.75 9.75A3.6 3.6 0 0 0 12.1 7.5" {...strokes} />
        </svg>
      );
    case 'profile':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="5.5" r="3" {...strokes} />
          <path d="M2.5 13.5a6.35 6.35 0 0 1 11 0" {...strokes} />
        </svg>
      );
    default:
      return <KindGlyph kind={topic} />;
  }
}

/** The line above a suggested question: home-refactor-b's "Start with a question" card label. */
export function AgentTopicLabel({ topic }: { topic: AgentTopic }) {
  return (
    <span className={s.promptTopic}>
      <TopicGlyph topic={topic} />
      {AGENT_TOPIC_LABEL[topic]}
    </span>
  );
}
