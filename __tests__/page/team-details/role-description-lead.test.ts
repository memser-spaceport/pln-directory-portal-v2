import { roleDescriptionLead } from '@/components/page/team-details/TeamApplicants/roleDescriptionLead';

describe('roleDescriptionLead', () => {
  it('returns an empty string for a posting with no body', () => {
    expect(roleDescriptionLead(null)).toBe('');
    expect(roleDescriptionLead('')).toBe('');
    expect(roleDescriptionLead('<p>  </p>')).toBe('');
  });

  it('skips an opening heading and returns the first paragraph that reads as prose', () => {
    const html = '<h2>About</h2><p>We build the open data layer for science, used by 40 labs.</p><p>Second.</p>';

    expect(roleDescriptionLead(html)).toBe('We build the open data layer for science, used by 40 labs.');
  });

  it('keeps a short paragraph that ends like a sentence', () => {
    expect(roleDescriptionLead('<h3>Role</h3><p>Join us.</p>')).toBe('Join us.');
  });

  it('falls back to the first paragraph when none reads as prose', () => {
    expect(roleDescriptionLead('<h2>About</h2><h3>Perks</h3>')).toBe('About');
  });

  it('flattens line breaks inside the paragraph into spaces', () => {
    expect(roleDescriptionLead('<p>Ship the new matching flow<br/>with the team in Lisbon and remote.</p>')).toBe(
      'Ship the new matching flow with the team in Lisbon and remote.',
    );
  });
});
