import { classifyAnchor } from '@/utils/html';

function anchor(html: string): HTMLAnchorElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.querySelector('a')!;
}

describe('classifyAnchor', () => {
  it('reads a mention off its class and data-uid', () => {
    const a = anchor('<a class="ql-mention" href="/members/m_7fa2" data-uid="m_7fa2">@Jane Doe</a>');
    expect(classifyAnchor(a)).toEqual({ kind: 'mention', memberUid: 'm_7fa2' });
  });

  it('checks mentions BEFORE links — their href points at our own domain', () => {
    // Classified generically, every mention would count as a link to us.
    const a = anchor('<a class="ql-mention" href="/members/m_1" data-uid="m_1">@A</a>');
    expect(classifyAnchor(a).kind).toBe('mention');
  });

  it('treats an ordinary /members link as a link, not a mention', () => {
    const a = anchor('<a href="/members/m_1">someone’s profile</a>');
    expect(classifyAnchor(a)).toEqual({ kind: 'link', linkType: 'http', host: 'localhost' });
  });

  it('reports the host and nothing else for a web link', () => {
    const a = anchor('<a href="https://docs.example.com/private/doc?token=secret123">doc</a>');
    const result = classifyAnchor(a);

    // A pasted URL's path or query can carry a share token or a private id.
    expect(result).toEqual({ kind: 'link', linkType: 'http', host: 'docs.example.com' });
    expect(JSON.stringify(result)).not.toContain('secret123');
    expect(JSON.stringify(result)).not.toContain('private');
  });

  it('reports a mailto with NO host — the host would be the address', () => {
    const a = anchor('<a href="mailto:jane.doe@example.com">email</a>');
    const result = classifyAnchor(a);

    expect(result).toEqual({ kind: 'link', linkType: 'mailto' });
    expect(JSON.stringify(result)).not.toContain('jane.doe');
  });

  it('skips an anchor whose href the sanitizer stripped', () => {
    // DOMPurify drops hrefs outside its allowlist — NodeBB's /topic/123 among
    // them — leaving a bare anchor. Resolving that invents an internal link.
    expect(classifyAnchor(anchor('<a>bare</a>')).kind).toBe('skip');
  });

  it('skips a non-web scheme rather than reporting it as a link', () => {
    // The sanitizer already refuses these; this is the second lock.
    expect(classifyAnchor(anchor('<a href="javascript:alert(1)">x</a>')).kind).toBe('skip');
    expect(classifyAnchor(anchor('<a href="data:text/html,hi">x</a>')).kind).toBe('skip');
  });

  it('does not throw on a href that will not parse', () => {
    // Resolved against an origin almost anything parses, so this asserts the
    // guard holds rather than a particular verdict.
    expect(() => classifyAnchor(anchor('<a href="http://[::bad::]">x</a>'))).not.toThrow();
    expect(() => classifyAnchor(anchor('<a href="%%%">x</a>'))).not.toThrow();
  });

  it('skips a mention anchor that lost its data-uid', () => {
    expect(classifyAnchor(anchor('<a class="ql-mention">@Ghost</a>')).kind).toBe('skip');
  });
});
