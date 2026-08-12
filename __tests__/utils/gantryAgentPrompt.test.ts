import {
  buildAgentPrompt,
  AGENT_PROMPT_MAX_LENGTH,
} from '@/utils/gantryAgentPrompt';

describe('buildAgentPrompt', () => {
  it('joins the title and the stripped description', () => {
    const result = buildAgentPrompt('Add dark mode', '<p>Users keep asking.</p><p>Follow the tokens.</p>');

    expect(result.prompt).toBe('Add dark mode\n\nUsers keep asking.\n\nFollow the tokens.');
    expect(result.isTruncated).toBe(false);
    expect(result.isTooShort).toBe(false);
  });

  it('falls back to title-only when Quill reports an empty body', () => {
    // Quill serialises an empty editor as <p><br></p>, which is truthy.
    const result = buildAgentPrompt('Add dark mode', '<p><br></p>');

    expect(result.prompt).toBe('Add dark mode');
    expect(result.isTooShort).toBe(false);
  });

  it('handles a missing description', () => {
    expect(buildAgentPrompt('Add dark mode', null).prompt).toBe('Add dark mode');
    expect(buildAgentPrompt('Add dark mode', undefined).prompt).toBe('Add dark mode');
  });

  it('flags a prompt too short for the backend minimum', () => {
    expect(buildAgentPrompt('ab', '<p><br></p>').isTooShort).toBe(true);
    expect(buildAgentPrompt('', '').isTooShort).toBe(true);
  });

  it('truncates past the backend maximum at a word boundary', () => {
    const longBody = `<p>${'word '.repeat(6000)}</p>`;
    const result = buildAgentPrompt('Long item', longBody);

    expect(result.isTruncated).toBe(true);
    expect(result.prompt.length).toBeLessThanOrEqual(AGENT_PROMPT_MAX_LENGTH);
    expect(result.prompt.endsWith('word')).toBe(true);
  });

  it('does not truncate a body that fits', () => {
    const result = buildAgentPrompt('Item', `<p>${'a'.repeat(100)}</p>`);
    expect(result.isTruncated).toBe(false);
  });
});
