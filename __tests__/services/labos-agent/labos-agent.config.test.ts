import { isLabosAgentMock } from '@/services/labos-agent/labos-agent.config';

describe('LAB-3298: mock switch', () => {
  beforeEach(() => window.localStorage.clear());

  it('uses the live client by default', () => {
    expect(isLabosAgentMock()).toBe(false);
  });

  it("uses the mock when localStorage['labos-agent-api'] is 'mock'", () => {
    window.localStorage.setItem('labos-agent-api', 'mock');
    expect(isLabosAgentMock()).toBe(true);
  });

  it('ignores other values', () => {
    window.localStorage.setItem('labos-agent-api', 'live');
    expect(isLabosAgentMock()).toBe(false);
  });
});
