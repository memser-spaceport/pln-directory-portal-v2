function parseEnvFlag(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  return undefined;
}

/** Prototypes are on in development unless `PROTOTYPES_ENABLED` overrides. */
export function isPrototypesEnabled(): boolean {
  const override = parseEnvFlag(process.env.PROTOTYPES_ENABLED);

  if (override !== undefined) {
    return override;
  }

  return process.env.NODE_ENV === 'development';
}
