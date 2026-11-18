import type {
  LabosAgentChatRequest,
  LabosAgentChatResponse,
  LabosAgentClient,
  LabosAgentStreamOptions,
} from '@/types/labos-agent.types';

import { LabosAgentError, LABOS_AGENT_STALL_MARKER } from './labos-agent.errors';

/**
 * The mock C1 client. Scripted answers, no network, no member data. It streams like the real endpoint: steps first,
 * then the content a few words at a time, then sources and follow-ups.
 *
 * Test words in the message:
 * - "error": the connection breaks after the first step (hard error).
 * - "stall": the answer ends with the backend's stalled notice.
 * - "web": the answer uses web search and shows web sources.
 */

const STEP_MS = 400;
const TICK_MS = 30;
const WORDS_PER_TICK = 3;

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

export function mockChatBody(request: LabosAgentChatRequest): LabosAgentChatResponse {
  const q = request.message.toLowerCase();
  const onStory = request.context?.page === 'news-story';
  const newsUid = request.context?.page === 'news-story' ? request.context.newsUid : undefined;
  const useWeb = /web|latest|internet/.test(q);

  const steps = [
    'Understanding the question',
    onStory ? 'Reading the news story' : 'Searching LabOS news',
    ...(useWeb ? ['Searching the web'] : []),
    'Writing the answer',
  ];

  const lead = onStory
    ? 'This is a mock answer. The live agent will read this news story and answer your question about it.'
    : 'This is a mock answer. The live agent will search LabOS news and answer your question.';

  const content = [
    lead,
    '',
    `You asked: "${request.message.trim()}"`,
    '',
    useWeb
      ? 'LabOS has no data on this, so the live agent will search the web and list the pages it used below.'
      : '- The answer will cite the LabOS stories it used.\n- When LabOS has no data, the agent will search the web.',
  ].join('\n');

  return {
    steps,
    content: /stall/.test(q) ? `${content}\n\n_${LABOS_AGENT_STALL_MARKER}. Please try again._` : content,
    sources: useWeb ? ['https://example.com/mock-web-source'] : [],
    sourceRefs: onStory && newsUid ? [{ type: 'news', uid: newsUid, title: 'This news story (mock)' }] : [],
    followUpQuestions: onStory
      ? ['Which other teams work on this?', 'What happened before this?']
      : ['What else happened this week?'],
    actions: [],
    proposals: [],
  };
}

async function chat(
  request: LabosAgentChatRequest,
  { signal, onUpdate }: LabosAgentStreamOptions = {},
): Promise<LabosAgentChatResponse> {
  const full = mockChatBody(request);
  const fail = /error/.test(request.message.toLowerCase());

  for (let i = 1; i <= full.steps.length; i++) {
    await wait(STEP_MS, signal);
    onUpdate?.({ steps: full.steps.slice(0, i) });
    if (fail) throw new LabosAgentError(200, 'STREAM_FAILED', 'The connection to the agent broke.');
  }

  const words = full.content.split(' ');
  for (let n = WORDS_PER_TICK; n < words.length + WORDS_PER_TICK; n += WORDS_PER_TICK) {
    await wait(TICK_MS, signal);
    onUpdate?.({ steps: full.steps, content: words.slice(0, n).join(' ') });
  }

  onUpdate?.(full);
  return full;
}

export const mockLabosAgentClient: LabosAgentClient = {
  chat,
  getAccess: async () => ({ enabled: true }),
};
