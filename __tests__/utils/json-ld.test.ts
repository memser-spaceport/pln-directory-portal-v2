import { serializeJsonLd } from '@/utils/json-ld';

describe('serializeJsonLd', () => {
  const data = {
    '@type': 'Event',
    name: 'Team </script><script>alert(1)</script> <!-- x -->',
    description: 'A & B > C\u2028line\u2029para',
  };

  it('escapes every character that can end the script element or start markup', () => {
    const out = serializeJsonLd(data);

    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
    expect(out).toContain('\\u003c/script\\u003e');
    expect(out).toContain('\\u003c!--');
    expect(out).toContain('\\u0026');
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
  });

  it('stays valid JSON that parses to the same object', () => {
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});
