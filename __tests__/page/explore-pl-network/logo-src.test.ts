import { logoSrc } from '@/components/page/explore-pl-network/data/logoSrc';

describe('logoSrc', () => {
  it('routes a logo through the Next image endpoint at its own 128px size', () => {
    const url = 'https://pl-directory-images-prod.s3.us-west-1.amazonaws.com/9bb7aea917c8bd9d.webp';
    expect(logoSrc(url)).toBe(
      '/_next/image?url=https%3A%2F%2Fpl-directory-images-prod.s3.us-west-1.amazonaws.com%2F9bb7aea917c8bd9d.webp&w=128&q=75',
    );
  });

  it('encodes query characters so they stay part of the logo URL', () => {
    expect(logoSrc('https://cdn.example/logo.webp?v=2&x=1')).toBe(
      '/_next/image?url=https%3A%2F%2Fcdn.example%2Flogo.webp%3Fv%3D2%26x%3D1&w=128&q=75',
    );
  });

  it('serves an SVG logo from its own host, since the image endpoint refuses SVGs', () => {
    const url = 'https://cdn.example/Open%20Source%20Observer%20-%20White.svg';
    expect(logoSrc(url)).toBe(url);
    expect(logoSrc('https://cdn.example/logo.SVG?v=2')).toBe('https://cdn.example/logo.SVG?v=2');
  });
});
