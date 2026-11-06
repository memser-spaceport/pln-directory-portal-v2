import { clientKeyFromName } from '@/components/page/settings/mcp/ClientLogo';

describe('clientKeyFromName', () => {
  it.each([
    ['Claude Code', 'claude-code'],
    ['Claude.ai', 'claude-ai'],
    // The Claude apps (web and desktop connector) register as plain "Claude" (seen on the lab-2995 env, LAB-3033).
    ['Claude', 'claude-ai'],
    ['claude', 'claude-ai'],
    ['Codex', 'codex'],
    ['LAB-2995 env test', 'other'],
  ])('maps %s to %s', (name, key) => {
    expect(clientKeyFromName(name)).toBe(key);
  });
});
