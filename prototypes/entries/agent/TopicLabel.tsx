import { AgentTopicLabel } from '../home-v2-b/AgentTopicLabel';
import p from '../home-v2-b/AgentPanel.module.scss';
import { CommentGlyph } from '../nav-shared/icons';

import type { Topic } from './script';
import s from './Agent.module.scss';

/** home-v2-b's topic line, plus Feedback (the comment glyph the old Feedback tab wore). */
export function TopicLabel({ topic }: { topic: Topic }) {
  if (topic !== 'feedback') return <AgentTopicLabel topic={topic} />;
  return (
    <span className={`${p.promptTopic} ${s.topicGlyph16}`}>
      <CommentGlyph />
      Feedback
    </span>
  );
}
