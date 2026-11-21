import { isLabosAgentGateOn, isLabosAgentMock } from '@/services/labos-agent/labos-agent.config';

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

describe('LAB-3344: local feature gate', () => {
  beforeEach(() => window.localStorage.clear());

  it('is on by default, so GET /access decides for each member', () => {
    expect(isLabosAgentGateOn()).toBe(true);
  });

  it("is off when localStorage['labos-agent'] is 'off'", () => {
    window.localStorage.setItem('labos-agent', 'off');
    expect(isLabosAgentGateOn()).toBe(false);
  });

  it("stays on for 'on' and for other values", () => {
    window.localStorage.setItem('labos-agent', 'on');
    expect(isLabosAgentGateOn()).toBe(true);
    window.localStorage.setItem('labos-agent', 'yes');
    expect(isLabosAgentGateOn()).toBe(true);
  });
});
