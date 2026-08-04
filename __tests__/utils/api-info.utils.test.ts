describe('getApiInfo', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_ENV;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_APP_ENV;
    } else {
      process.env.NEXT_PUBLIC_APP_ENV = originalEnv;
    }
    jest.resetModules();
    jest.useRealTimers();
  });

  const loadUtils = () => require('@/utils/api-info.utils');

  it('returns the static service and feature identifiers', () => {
    const { getApiInfo } = loadUtils();

    const info = getApiInfo();

    expect(info.service).toBe('directory-portal-frontend');
    expect(info.feature).toBe('agent-demo');
  });

  it('reads the environment from NEXT_PUBLIC_APP_ENV', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    const { getApiInfo } = loadUtils();

    expect(getApiInfo().environment).toBe('staging');
  });

  it('falls back to development when NEXT_PUBLIC_APP_ENV is missing or blank', () => {
    delete process.env.NEXT_PUBLIC_APP_ENV;
    expect(loadUtils().getApiInfo().environment).toBe('development');

    jest.resetModules();
    process.env.NEXT_PUBLIC_APP_ENV = '   ';
    expect(loadUtils().getApiInfo().environment).toBe('development');
  });

  it('reads the version from package.json', () => {
    jest.resetModules();
    jest.doMock('@/package.json', () => ({ version: '9.9.9' }));

    expect(loadUtils().getApiInfo().version).toBe('9.9.9');

    jest.dontMock('@/package.json');
  });

  it('falls back to unknown when package.json has no version', () => {
    jest.resetModules();
    jest.doMock('@/package.json', () => ({}));

    expect(loadUtils().getApiInfo().version).toBe('unknown');

    jest.dontMock('@/package.json');
  });

  it('returns the current time as a UTC ISO-8601 timestamp', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-06T07:08:09.010Z'));
    const { getApiInfo } = loadUtils();

    expect(getApiInfo().timestamp).toBe('2024-05-06T07:08:09.010Z');
  });
});
