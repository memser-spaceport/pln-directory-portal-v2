import { JOBS_BOARD_TITLE, jobRoleSeoTitle } from '@/services/jobs/jobSeoTitles';

/* LAB-2889: the titles name the search people make, "Protocol Labs jobs". */
describe('job board and role page titles', () => {
  it('titles the board "Protocol Labs Jobs"', () => {
    expect(JOBS_BOARD_TITLE).toBe('Protocol Labs Jobs | LabOS');
  });

  it('titles a role "<role> at <team> (<location>) | Protocol Labs Jobs", keeping the place people search by', () => {
    expect(
      jobRoleSeoTitle({ roleTitle: 'Rust Engineer', location: ['San Francisco', 'Remote'] }, { name: 'PL Neuro' }),
    ).toBe('Rust Engineer at PL Neuro (San Francisco, Remote) | Protocol Labs Jobs');
  });

  it('drops the brackets when the role has no location', () => {
    expect(jobRoleSeoTitle({ roleTitle: 'Rust Engineer', location: [] }, { name: 'PL Neuro' })).toBe(
      'Rust Engineer at PL Neuro | Protocol Labs Jobs',
    );
  });
});
