export enum LabosAgentQueryKeys {
  ACCESS = 'labos-agent-access',
}

export const LABOS_AGENT_ENDPOINTS = {
  chat: '/v1/labos-agent/chat',
  access: '/v1/labos-agent/access',
} as const;

/** C1 request limits. */
export const LABOS_AGENT_MESSAGE_MAX = 2000;

/**
 * The feature gate. Off until decision D1 (who sees the agent) is made. Flip this to `true` in code when D1 lands;
 * the backend gate (`GET /v1/labos-agent/access`) still decides for each member.
 */
export const LABOS_AGENT_ENABLED_BY_DEFAULT = false;

/** Until the C1 backend is live, the panel talks to the mock client. */
export const LABOS_AGENT_MOCK_BY_DEFAULT = true;

/** localStorage key. The value `on` turns the gate on in this browser, for development and QA. */
export const LABOS_AGENT_GATE_STORAGE_KEY = 'labos-agent';

/** localStorage key. The value `live` sends chat to the real C1 endpoint; any other value keeps the mock. */
export const LABOS_AGENT_API_STORAGE_KEY = 'labos-agent-api';
