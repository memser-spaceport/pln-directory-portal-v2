/**
 * The two text-wrap positions an image can take. Anything else — including the
 * absence of a wrap — is the ordinary in-flow image.
 */
export const IMAGE_FLOATS = ['left', 'right'] as const;

export type ImageFloat = (typeof IMAGE_FLOATS)[number];
