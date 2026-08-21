import {
  BLUESKY_URL_REGEX,
  CRUNCHBASE_URL_REGEX,
  GITHUB_URL_REGEX,
  LINKEDIN_URL_REGEX,
  TELEGRAM_URL_REGEX,
  TWITTER_URL_REGEX,
} from '@/utils/constants';

/**
 * Contact fields shared by the member and team profiles. Both forms accept the same shapes for
 * the same provider, so the rules live here rather than in either form's schema.
 */
export type SocialField =
  | 'website'
  | 'blog'
  | 'linkedin'
  | 'github'
  | 'crunchbase'
  | 'twitter'
  | 'telegram'
  | 'bluesky';

/** A URL with no provider to pin it to: optional scheme, a dotted host, optional port and path. */
const URL_SHAPE = /^(?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?::\d+)?(?:\/\S*)?$/i;

type Rule =
  /** Only a URL will do — there is no handle form for a website or a blog. */
  | { kind: 'url' }
  /**
   * A provider URL, or a handle. X, Telegram and Bluesky handles are always written with a
   * leading `@`; a LinkedIn, GitHub or Crunchbase slug never is — an `@` there would end up
   * inside the link. So the `@` is not optional either way, just required or refused.
   */
  | {
      kind: 'handle';
      label: string;
      urlExample: string;
      handleExample: string;
      urlRegex: RegExp;
      requiresAtPrefix: boolean;
    };

const RULES: Record<SocialField, Rule> = {
  website: { kind: 'url' },
  blog: { kind: 'url' },
  linkedin: {
    kind: 'handle',
    label: 'LinkedIn',
    urlExample: 'https://linkedin.com/in/johndoe',
    handleExample: 'johndoe',
    urlRegex: LINKEDIN_URL_REGEX,
    requiresAtPrefix: false,
  },
  github: {
    kind: 'handle',
    label: 'GitHub',
    urlExample: 'https://github.com/username',
    handleExample: 'username',
    urlRegex: GITHUB_URL_REGEX,
    requiresAtPrefix: false,
  },
  crunchbase: {
    kind: 'handle',
    label: 'Crunchbase',
    urlExample: 'https://www.crunchbase.com/organization/protocol-labs',
    handleExample: 'protocol-labs',
    urlRegex: CRUNCHBASE_URL_REGEX,
    requiresAtPrefix: false,
  },
  twitter: {
    kind: 'handle',
    label: 'X (Twitter)',
    urlExample: 'https://twitter.com/protocollabs',
    handleExample: '@protocollabs',
    urlRegex: TWITTER_URL_REGEX,
    requiresAtPrefix: true,
  },
  telegram: {
    kind: 'handle',
    label: 'Telegram',
    urlExample: 'https://t.me/username',
    handleExample: '@username',
    urlRegex: TELEGRAM_URL_REGEX,
    requiresAtPrefix: true,
  },
  bluesky: {
    kind: 'handle',
    label: 'Bluesky',
    urlExample: 'https://bsky.app/profile/protocol.ai',
    handleExample: '@protocol.ai',
    urlRegex: BLUESKY_URL_REGEX,
    requiresAtPrefix: true,
  },
};

export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.includes('/');
}

export function requiresAtPrefix(field: SocialField): boolean {
  const rule = RULES[field];

  return rule.kind === 'handle' && rule.requiresAtPrefix;
}

function matchesProviderUrl(value: string, urlRegex: RegExp): boolean {
  const withoutPrefix = value.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  const match = urlRegex.exec(withoutPrefix);

  return !!match && match.index === 0 && !!match[1];
}

export function validateSocialField(field: SocialField, value: string | null | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    return undefined;
  }

  const rule = RULES[field];

  if (rule.kind === 'url') {
    return URL_SHAPE.test(trimmed) ? undefined : 'Enter a valid URL, eg. https://protocol.ai';
  }

  if (/\s/.test(trimmed)) {
    return `Enter a ${rule.label} URL or handle, without spaces`;
  }

  if (looksLikeUrl(trimmed)) {
    return matchesProviderUrl(trimmed, rule.urlRegex)
      ? undefined
      : `Enter a valid ${rule.label} URL, eg. ${rule.urlExample}`;
  }

  // The "@" has to be present exactly when the provider's handles carry one.
  if (rule.requiresAtPrefix !== trimmed.startsWith('@')) {
    return rule.requiresAtPrefix
      ? `Enter a handle starting with "@", eg. ${rule.handleExample}, or a ${rule.label} URL`
      : `Enter a handle without the "@", eg. ${rule.handleExample}, or a ${rule.label} URL`;
  }

  // A lone "@" normalizes to an empty handle, which would render as a link to nothing.
  if (!trimmed.replace(/^@/, '')) {
    return `Enter a ${rule.label} handle, eg. ${rule.handleExample}`;
  }

  return undefined;
}
