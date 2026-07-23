export type ShareIntentNetwork = 'linkedin' | 'x';

/** Builds the web share-intent URL for a network.
 *
 *  Both `text` and `url` are percent-encoded HERE, unconditionally — a story
 *  title containing `&url=https://attacker.example` would otherwise override
 *  the shared link inside the X intent (titles come from the AI enrichment
 *  pipeline; treat them as untrusted).
 *
 *  LinkedIn accepts only `url` — its composer ignores text params entirely and
 *  builds the preview card from the target page's Open Graph tags.
 *  X: x.com/intent/post is the 2026 canonical (twitter.com/intent/tweet is a
 *  redirecting legacy alias). */
export function buildShareIntentUrl(network: ShareIntentNetwork, url: string, text: string): string {
  const encodedUrl = encodeURIComponent(url);
  return network === 'linkedin'
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    : `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodedUrl}`;
}
