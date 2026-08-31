import { PERMISSIONS } from '@/services/rbac/constants';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { canViewAgentSessions } from '@/services/rbac/utils/agentSessions/canViewAgentSessions';
import { canViewFounderDb } from '@/services/rbac/utils/founderDb/canViewFounderDb';
import { canViewFounderGuide } from '@/services/rbac/utils/founderGuide/canViewFounderGuide';
import { canViewGantry } from '@/services/rbac/utils/gantry/canViewGantry';
import { canViewInvestorDb } from '@/services/rbac/utils/investorDb/canViewInvestorDb';
import { FOUNDER_DB_ENABLED } from '@/services/founders/constants';

const perms = (...codes: string[]) => new Set(codes);
const NONE = perms();
/** A member with every other area's access, to prove each check reads only its own code. */
const EVERYTHING_ELSE = perms(
  'roadmap.view',
  'investor_db.view',
  'ai_apps.read',
  'code_agent_sessions.view',
  'founder_db.view',
  'founder_guides.view',
);

describe('canViewAiApps', () => {
  it('grants on the read permission', () => {
    expect(canViewAiApps(perms(PERMISSIONS.AI_APPS.PERM_VIEW))).toBe(true);
  });

  it('denies a member with no permissions at all', () => {
    expect(canViewAiApps(NONE)).toBe(false);
  });

  it('denies a member holding every other area but this one', () => {
    const others = new Set(EVERYTHING_ELSE);
    others.delete(PERMISSIONS.AI_APPS.PERM_VIEW);

    expect(canViewAiApps(others)).toBe(false);
  });
});

describe('canViewInvestorDb', () => {
  it('grants on view; edit alone is not a view grant', () => {
    expect(canViewInvestorDb(perms(PERMISSIONS.INVESTOR_DB.PERM_VIEW))).toBe(true);
    expect(canViewInvestorDb(perms(PERMISSIONS.INVESTOR_DB.PERM_EDIT))).toBe(false);
  });

  it('denies an empty permission set', () => {
    expect(canViewInvestorDb(NONE)).toBe(false);
  });
});

describe('canViewGantry', () => {
  it('grants on either the viewer or the admin permission', () => {
    expect(canViewGantry(perms(PERMISSIONS.GANTRY.PERM_VIEW))).toBe(true);
    expect(canViewGantry(perms(PERMISSIONS.GANTRY.PERM_ADMIN))).toBe(true);
    expect(canViewGantry(perms(PERMISSIONS.GANTRY.PERM_VIEW, PERMISSIONS.GANTRY.PERM_ADMIN))).toBe(true);
  });

  it('does not grant on the lesser roadmap permissions', () => {
    expect(canViewGantry(perms(PERMISSIONS.GANTRY.PERM_UPVOTE))).toBe(false);
    expect(canViewGantry(perms(PERMISSIONS.GANTRY.PERM_CREATE))).toBe(false);
  });

  it('denies an empty permission set', () => {
    expect(canViewGantry(NONE)).toBe(false);
  });
});

describe('canViewAgentSessions', () => {
  it('grants on either the viewer or the admin permission', () => {
    expect(canViewAgentSessions(perms(PERMISSIONS.AGENT_SESSIONS.PERM_VIEW))).toBe(true);
    expect(canViewAgentSessions(perms(PERMISSIONS.AGENT_SESSIONS.PERM_ADMIN))).toBe(true);
  });

  it('denies an empty permission set', () => {
    expect(canViewAgentSessions(NONE)).toBe(false);
  });
});

describe('canViewFounderDb — gated by a kill switch as well as a permission', () => {
  it('follows the flag: nobody gets in while it is off, permission or not', () => {
    const withView = perms(PERMISSIONS.FOUNDER_DB.PERM_VIEW);
    const withEdit = perms(PERMISSIONS.FOUNDER_DB.PERM_EDIT);

    expect(canViewFounderDb(withView)).toBe(FOUNDER_DB_ENABLED);
    expect(canViewFounderDb(withEdit)).toBe(FOUNDER_DB_ENABLED);
  });

  it('denies an unpermitted member regardless of the flag', () => {
    expect(canViewFounderDb(NONE)).toBe(false);
  });
});

describe('canViewFounderGuide — takes a list, not a set', () => {
  it('grants on the founder-guides permission', () => {
    expect(canViewFounderGuide([PERMISSIONS.FOUNDER_GUIDE.PERM_VIEW])).toBe(true);
  });

  it('grants on a scoped variant, since it matches by prefix', () => {
    expect(canViewFounderGuide([`${PERMISSIONS.FOUNDER_GUIDE.PERM_VIEW}.beta`])).toBe(true);
  });

  it('denies an empty list', () => {
    expect(canViewFounderGuide([])).toBe(false);
  });

  it('denies a member holding only other areas', () => {
    expect(canViewFounderGuide(['roadmap.view', 'ai_apps.read', 'investor_db.view'])).toBe(false);
  });

  it('finds the permission wherever it sits in the list', () => {
    expect(canViewFounderGuide(['roadmap.view', PERMISSIONS.FOUNDER_GUIDE.PERM_VIEW, 'ai_apps.read'])).toBe(true);
  });
});

describe('the checks do not leak into each other', () => {
  it('a member with everything passes every check the flags allow', () => {
    expect(canViewAiApps(EVERYTHING_ELSE)).toBe(true);
    expect(canViewInvestorDb(EVERYTHING_ELSE)).toBe(true);
    expect(canViewGantry(EVERYTHING_ELSE)).toBe(true);
    expect(canViewAgentSessions(EVERYTHING_ELSE)).toBe(true);
    expect(canViewFounderDb(EVERYTHING_ELSE)).toBe(FOUNDER_DB_ENABLED);
  });

  it('a member with nothing passes none of them', () => {
    expect(canViewAiApps(NONE)).toBe(false);
    expect(canViewInvestorDb(NONE)).toBe(false);
    expect(canViewGantry(NONE)).toBe(false);
    expect(canViewAgentSessions(NONE)).toBe(false);
    expect(canViewFounderDb(NONE)).toBe(false);
    expect(canViewFounderGuide([])).toBe(false);
  });
});
