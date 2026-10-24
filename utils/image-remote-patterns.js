/**
 * The hosts that the Next.js image optimizer (`/_next/image`) fetches from, LAB-2978.
 * A host that is not on this list is refused, so the optimizer cannot be used to fetch arbitrary URLs.
 * To show images from a new host, add it here.
 * CommonJS so both `next.config.mjs` and Jest can load it.
 */
const IMAGE_HOSTS = [
  'pl-directory-images-prod.s3.us-west-1.amazonaws.com',
  'pl-directory-images-dev.s3.us-west-1.amazonaws.com',
  'plabs-assets.s3.us-west-1.amazonaws.com',
  'pl-directory-uploads-prod.s3.us-west-1.amazonaws.com',
  'xmwhmjwf0rjrrlhw.public.blob.vercel-storage.com',
];

const IMAGE_REMOTE_PATTERNS = IMAGE_HOSTS.map((hostname) => ({ protocol: 'https', hostname }));

module.exports = { IMAGE_REMOTE_PATTERNS };
