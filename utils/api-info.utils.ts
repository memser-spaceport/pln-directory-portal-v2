import packageJson from '@/package.json';

export const API_INFO_SERVICE_NAME = 'directory-portal-frontend';
export const API_INFO_FEATURE = 'agent-demo';
export const API_INFO_DEFAULT_ENVIRONMENT = 'development';
export const API_INFO_DEFAULT_VERSION = 'unknown';

export interface IApiInfo {
  service: string;
  environment: string;
  version: string;
  feature: string;
  timestamp: string;
}

/**
 * Builds the public service metadata exposed on the `/api-info` page.
 *
 * - `environment` comes from `NEXT_PUBLIC_APP_ENV`, falling back to `development`
 * - `version` comes from `package.json`, falling back to `unknown`
 * - `timestamp` is the current time as a UTC ISO-8601 string
 */
export const getApiInfo = (): IApiInfo => {
  const environment = process.env.NEXT_PUBLIC_APP_ENV?.trim();
  const version = (packageJson as { version?: string })?.version?.trim();

  return {
    service: API_INFO_SERVICE_NAME,
    environment: environment || API_INFO_DEFAULT_ENVIRONMENT,
    version: version || API_INFO_DEFAULT_VERSION,
    feature: API_INFO_FEATURE,
    timestamp: new Date().toISOString(),
  };
};
