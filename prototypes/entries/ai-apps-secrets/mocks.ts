// Mock apps mirroring the production `AiApp` fields the setup card uses
// (services/ai-apps/ai-apps.service.ts) — no API calls in the prototype.

export type MockAppStatus = 'DRAFT' | 'DEPLOYING' | 'ERROR';

export interface MockSecretsApp {
  key: string;
  label: string;
  caption: string;
  name: string;
  description: string;
  status: MockAppStatus;
  notes: string | null;
  requiredEnvVars: string[];
  providedEnvVars: string[];
}

export const secretScenarios: MockSecretsApp[] = [
  {
    key: 'first-deploy',
    label: 'First deploy',
    caption: 'Draft app, nothing stored yet — a plain required field and a Deploy button.',
    name: 'News Summarizer',
    description: 'Summarize recent news on any topic, powered by Perplexity.',
    status: 'DRAFT',
    notes: null,
    requiredEnvVars: ['PERPLEXITY_API_KEY'],
    providedEnvVars: [],
  },
  {
    key: 'value-stored',
    label: 'Value stored',
    caption: 'The key is already stored: the field is locked with an Edit action, and the button becomes Re-deploy.',
    name: 'News Summarizer',
    description: 'Summarize recent news on any topic, powered by Perplexity.',
    status: 'DEPLOYING',
    notes: null,
    requiredEnvVars: ['PERPLEXITY_API_KEY'],
    providedEnvVars: ['PERPLEXITY_API_KEY'],
  },
  {
    key: 'new-key-required',
    label: 'New key required',
    caption: 'A failed deploy after the app started requiring a second key — locked row and required input side by side.',
    name: 'News Summarizer',
    description: 'Summarize recent news on any topic, powered by Perplexity.',
    status: 'ERROR',
    notes: 'Missing required environment variable NEWS_FEED_TOKEN.',
    requiredEnvVars: ['PERPLEXITY_API_KEY', 'NEWS_FEED_TOKEN'],
    providedEnvVars: ['PERPLEXITY_API_KEY'],
  },
];
