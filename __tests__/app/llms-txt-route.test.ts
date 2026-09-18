/**
 * @jest-environment node
 */

import { GET } from '@/app/llms.txt/route';

describe('llms.txt', () => {
  const original = process.env.APPLICATION_BASE_URL;

  afterEach(() => {
    process.env.APPLICATION_BASE_URL = original;
  });

  it('identifies the current host and lists jobs first', async () => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
    const response = await GET();
    const body = await response.text();

    expect(body).toContain('Host: https://os.pl.xyz');
    expect(body).not.toContain('directory.plnetwork.io');
    expect(body.indexOf('Job Board')).toBeLessThan(body.indexOf('[Teams]'));
  });
});
