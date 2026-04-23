// RBAC V1.1 Prototype — Static Mock Data
// No API calls — all data is self-contained for design review

export type MemberLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';
export type ApprovalState = 'pending' | 'verified' | 'approved' | 'rejected';

export interface ModuleAccess {
  module: string;
  access: string[];
  note?: string;
}

export interface RBACPolicy {
  id: string;
  name: string;
  role: string;
  group: string;
  description: string;
  typicalFor: string;
  modules: ModuleAccess[];
  permissions: string[];
  memberCount: number;
}

export interface DirectPermission {
  id: string;
  /** Internal permission string (e.g. founder_guides.admin) */
  permission: string;
  /** @deprecated Use module + level for display; kept for older mock rows */
  label: string;
  addedBy: string;
  addedAt: string;
  reason: string;
  /** Product module (e.g. "Founder Guides") */
  module?: string;
  /** Human access level (e.g. "Admin", "View") */
  level?: string;
  /** Optional ISO or display timestamp; falls back to addedAt */
  createdAt?: string;
}

export interface RBACMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  team: string;
  role: string;
  level: MemberLevel;
  approvalState: ApprovalState;
  assignedPolicyIds: string[];
  directPermissions: DirectPermission[];
}

// ── Policies ─────────────────────────────────────────────────────────────────
// Source: Policy Access Matrix v1 coverage

export const RBAC_POLICIES: RBACPolicy[] = [
  // ── PL Internal ─────────────────────────────────────────────────────────────
  {
    id: 'policy-directory-admin',
    name: 'Directory Admin — PL Internal',
    role: 'Directory Admin',
    group: 'PL Internal',
    description: 'Full admin access across all modules including the admin tool. Covers team data, member search on left nav, and all admin operations. AKA Product/Programs team.',
    typicalFor: 'PL Product/Programs team — Directory Admins',
    modules: [
      { module: 'All modules', access: ['Read', 'Write', 'Admin'], note: 'Includes admin tool' },
      { module: 'Members', access: ['Search', 'Admin'], note: 'Left nav member search' },
      { module: 'Teams', access: ['Priority data', 'Admin'] },
    ],
    permissions: ['*.read', '*.write', '*.admin', 'admin_tool.access', 'members.search', 'teams.priority_data'],
    memberCount: 6,
  },
  {
    id: 'policy-infra-team',
    name: 'Infra Team — PL Internal',
    role: 'Infra Team',
    group: 'PL Internal',
    description: 'Full read+write across all modules except the admin tool. Includes team priority data and membership source data. Key permissions: OH, Forum, Deals, FG.ALL.',
    typicalFor: 'PL infrastructure engineers managing the platform',
    modules: [
      { module: 'Office Hours', access: ['Read', 'Write'] },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'Deals', access: ['Read', 'Write'] },
      { module: 'Founder Guides', access: ['Read', 'Write'], note: 'All content (FG.ALL)' },
      { module: 'All other modules', access: ['Read', 'Write'], note: 'Excludes admin tool' },
    ],
    permissions: ['oh.read', 'oh.write', 'forum.read', 'forum.write', 'deals.read', 'deals.write', 'founder_guides.view.all', 'founder_guides.write', 'teams.priority_data', 'members.source_data'],
    memberCount: 4,
  },
  {
    id: 'policy-demoday-admin',
    name: 'Demo Day Admin — PL Internal',
    role: 'Demo Day Admin',
    group: 'PL Internal',
    description: 'Full Demo Day administration for PL and Partner Demo Days. Includes prep, showcase, active phase, and stats.',
    typicalFor: 'PL internal team members running Demo Day operations',
    modules: [
      { module: 'Demo Day', access: ['Prep R+W', 'Showcase R+W', 'Active R+W', 'Stats R'], note: 'PL Demo Days + Partner Demo Days' },
    ],
    permissions: ['demoday.prep.read', 'demoday.prep.write', 'demoday.showcase.read', 'demoday.showcase.write', 'demoday.active.read', 'demoday.active.write', 'demoday.stats.read'],
    memberCount: 5,
  },
  {
    id: 'policy-demoday-stakeholder',
    name: 'Demo Day Stakeholder — PL Internal',
    role: 'Demo Day Stakeholder',
    group: 'PL Internal',
    description: 'Read-only access to PL and Partner Demo Days. Suitable for leadership and stakeholders who need full visibility without write access.',
    typicalFor: 'PL leadership and stakeholders reviewing Demo Day submissions',
    modules: [
      { module: 'Demo Day', access: ['Prep R', 'Showcase R', 'Active R', 'Stats R'], note: 'PL Demo Days + Partner Demo Days' },
    ],
    permissions: ['demoday.prep.read', 'demoday.showcase.read', 'demoday.active.read', 'demoday.stats.read'],
    memberCount: 8,
  },

  // ── PL Partner ───────────────────────────────────────────────────────────────
  {
    id: 'policy-demoday-admin-partner',
    name: 'Demo Day Admin — PL Partner',
    role: 'Demo Day Admin',
    group: 'PL Partner',
    description: 'Full Demo Day administration scoped to Partner Demo Days only. Includes prep, showcase, active phase, and stats.',
    typicalFor: 'PL Partner team members managing the partner-track Demo Day',
    modules: [
      { module: 'Demo Day', access: ['Prep R+W', 'Showcase R+W', 'Active R+W', 'Stats R'], note: 'Partner Demo Days only' },
    ],
    permissions: ['demoday.partner.prep.read', 'demoday.partner.prep.write', 'demoday.partner.showcase.read', 'demoday.partner.showcase.write', 'demoday.partner.active.read', 'demoday.partner.active.write', 'demoday.partner.stats.read'],
    memberCount: 3,
  },
  {
    id: 'policy-demoday-stakeholder-partner',
    name: 'Demo Day Stakeholder — PL Partner',
    role: 'Demo Day Stakeholder',
    group: 'PL Partner',
    description: 'Read-only access to Partner Demo Days. For PL Partner stakeholders who need visibility without write privileges.',
    typicalFor: 'PL Partner stakeholders reviewing partner Demo Day submissions',
    modules: [
      { module: 'Demo Day', access: ['Prep R', 'Showcase R', 'Active R', 'Stats R'], note: 'Partner Demo Days only' },
    ],
    permissions: ['demoday.partner.prep.read', 'demoday.partner.showcase.read', 'demoday.partner.active.read', 'demoday.partner.stats.read'],
    memberCount: 6,
  },
  {
    id: 'policy-investor-partner',
    name: 'Investor — PL Partner',
    role: 'Investor',
    group: 'PL Partner',
    description: 'Investor access for PL Partners. Includes Office Hours (demand/booking), Demo Day (investor view, approval-based), and member contacts. IRL not included at this level.',
    typicalFor: 'Strategic investors and PL Partners',
    modules: [
      { module: 'Office Hours', access: ['Demand'], note: 'v1 — book sessions' },
      { module: 'Demo Day', access: ['Active R'], note: 'Investor view, approval-based' },
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
    ],
    permissions: ['oh.demand_read', 'demoday.active.read', 'members.contacts_view'],
    memberCount: 14,
  },

  // ── PLC PLVS ─────────────────────────────────────────────────────────────────
  {
    id: 'policy-founder-plvs',
    name: 'Founder — PLC PLVS',
    role: 'Founder',
    group: 'PLC PLVS',
    description: 'Full founder access for PLVS cohort members. Includes Deals, Founder Guides (PLVS scope), PL Advisors (whitelist), Demo Day (own team, approval-based), OH supply+demand, Forum, and IRL.',
    typicalFor: 'Founders accepted into the PLC PLVS accelerator cohort',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
      { module: 'Deals', access: ['Read'] },
      { module: 'Founder Guides', access: ['Read'], note: 'PLVS content (FG_Read.PLVS)' },
      { module: 'PL Advisors', access: ['View'], note: 'Whitelist required' },
      { module: 'Demo Day', access: ['Active R+W', 'Prep R+W'], note: 'Founder view, own team, approval-based' },
    ],
    permissions: ['deals.read', 'founder_guides.view.plvs', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going', 'demoday.active.read', 'demoday.active.write', 'demoday.prep.read', 'demoday.prep.write'],
    memberCount: 24,
  },

  // ── PLC Crypto ───────────────────────────────────────────────────────────────
  {
    id: 'policy-founder-plcc',
    name: 'Founder — PLC Crypto',
    role: 'Founder',
    group: 'PLC Crypto',
    description: 'Full founder access for PLC Crypto cohort members. Same as PLVS but Founder Guides scoped to PLCC content (FG_Read.PLCC).',
    typicalFor: 'Founders accepted into the PLC Crypto cohort',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
      { module: 'Deals', access: ['Read'] },
      { module: 'Founder Guides', access: ['Read'], note: 'PLCC content (FG_Read.PLCC)' },
      { module: 'PL Advisors', access: ['View'], note: 'Whitelist required' },
      { module: 'Demo Day', access: ['Active R+W', 'Prep R+W'], note: 'Founder view, own team, approval-based' },
    ],
    permissions: ['deals.read', 'founder_guides.view.plcc', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going', 'demoday.active.read', 'demoday.active.write', 'demoday.prep.read', 'demoday.prep.write'],
    memberCount: 18,
  },

  // ── PLC Founder Forge ────────────────────────────────────────────────────────
  {
    id: 'policy-founder-forge',
    name: 'Founder — PLC Founder Forge',
    role: 'Founder',
    group: 'PLC Founder Forge',
    description: 'Founder access for PLC Founder Forge cohort. Includes Deals, OH supply+demand, Forum, and IRL. No Founder Guides or Demo Day access in this policy.',
    typicalFor: 'Founders in the PLC Founder Forge program',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
      { module: 'Deals', access: ['Read'] },
    ],
    permissions: ['deals.read', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going'],
    memberCount: 12,
  },

  // ── PLC Neuro ────────────────────────────────────────────────────────────────
  {
    id: 'policy-founder-neuro',
    name: 'Founder — PLC Neuro',
    role: 'Founder',
    group: 'PLC Neuro',
    description: 'Founder access for PLC Neuro cohort. Includes Demo Day (own team, approval-based), OH supply+demand, Forum, and IRL. No Founder Guides or Deals in this policy.',
    typicalFor: 'Founders accepted into the PLC Neuro cohort',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
      { module: 'Demo Day', access: ['Active R+W', 'Prep R+W'], note: 'Founder view, own team, approval-based' },
    ],
    permissions: ['oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going', 'demoday.active.read', 'demoday.active.write', 'demoday.prep.read', 'demoday.prep.write'],
    memberCount: 9,
  },

  // ── PLN Close Contributor ────────────────────────────────────────────────────
  {
    id: 'policy-founder-pln-cc',
    name: 'Founder — PLN Close Contributor',
    role: 'Founder',
    group: 'PLN Close Contributor',
    description: 'Founder access for PLN Close Contributor members. Includes OH supply+demand, Forum, IRL Going, and Deals (coming soon). This group is being separated from the L4 PortCos bucket into its own distinct group.',
    typicalFor: 'Close Contributors in the PLN ecosystem — proposed split from L4 PortCos',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
      { module: 'Deals', access: ['Read'], note: 'Coming soon' },
    ],
    permissions: ['oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going', 'deals.read'],
    memberCount: 7,
  },

  // ── PLC Other ────────────────────────────────────────────────────────────────
  {
    id: 'policy-founder-plc-other',
    name: 'Founder — PLC Other',
    role: 'Founder',
    group: 'PLC Other',
    description: 'Founder access for PLC Other members (combined L2+L3). Includes OH supply+demand, Forum, IRL Going, and Deals (coming soon). Proposal: combine L2 and L3 into one group as they share the same access.',
    typicalFor: 'PLC cohort members currently under L2/L3 without a more specific cohort group',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
      { module: 'Deals', access: ['Read'], note: 'Coming soon' },
    ],
    permissions: ['oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going', 'deals.read'],
    memberCount: 31,
  },

  // ── PLN Other ────────────────────────────────────────────────────────────────
  {
    id: 'policy-founder-pln-other',
    name: 'Founder — PLN Other',
    role: 'Founder',
    group: 'PLN Other',
    description: 'Founder access for PLN Other members. Includes OH supply+demand, Forum, IRL Going, and Deals (coming soon).',
    typicalFor: 'PLN members not covered by a more specific cohort group',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
      { module: 'Deals', access: ['Read'], note: 'Coming soon' },
    ],
    permissions: ['oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going', 'deals.read'],
    memberCount: 19,
  },

  // ── PL ───────────────────────────────────────────────────────────────────────
  {
    id: 'policy-investor-pl',
    name: 'Investor — PL',
    role: 'Investor',
    group: 'PL',
    description: 'Standard investor access. Includes Office Hours (demand/booking), Demo Day (investor view, approval-based), member contacts, and IRL Going.',
    typicalFor: 'Investors with a relationship to Protocol Labs',
    modules: [
      { module: 'Office Hours', access: ['Demand'], note: 'v1 — book sessions' },
      { module: 'Demo Day', access: ['Active R'], note: 'Investor view, approval-based' },
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['oh.demand_read', 'demoday.active.read', 'members.contacts_view', 'irl.going_read'],
    memberCount: 37,
  },

  // ── Unassigned ───────────────────────────────────────────────────────────────
  {
    id: 'policy-unassigned-plvs',
    name: 'Unassigned — PLC PLVS',
    role: 'Unassigned',
    group: 'PLC PLVS',
    description: 'Base access for unassigned PLC PLVS members. Provides member contacts view, IRL Going, OH supply+demand, and Forum. Assigned before a full Founder policy is granted.',
    typicalFor: 'PLC PLVS members pending role assignment or in early onboarding',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going'],
    memberCount: 5,
  },
  {
    id: 'policy-unassigned-plcc',
    name: 'Unassigned — PLC Crypto',
    role: 'Unassigned',
    group: 'PLC Crypto',
    description: 'Base access for unassigned PLC Crypto members. Provides member contacts view, IRL Going, OH supply+demand, and Forum.',
    typicalFor: 'PLC Crypto members pending role assignment or in early onboarding',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going'],
    memberCount: 4,
  },
  {
    id: 'policy-unassigned-forge',
    name: 'Unassigned — PLC Founder Forge',
    role: 'Unassigned',
    group: 'PLC Founder Forge',
    description: 'Base access for unassigned PLC Founder Forge members. Provides member contacts view, IRL Going, OH supply+demand, and Forum.',
    typicalFor: 'PLC Founder Forge members pending role assignment',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going'],
    memberCount: 3,
  },
  {
    id: 'policy-unassigned-neuro',
    name: 'Unassigned — PLC Neuro',
    role: 'Unassigned',
    group: 'PLC Neuro',
    description: 'Base access for unassigned PLC Neuro members. Provides member contacts view, IRL Going, OH supply+demand, and Forum.',
    typicalFor: 'PLC Neuro members pending role assignment',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going'],
    memberCount: 2,
  },
  {
    id: 'policy-unassigned-pln-cc',
    name: 'Unassigned — PLN Close Contributor',
    role: 'Unassigned',
    group: 'PLN Close Contributor',
    description: 'Base access for unassigned PLN Close Contributor members. Provides member contacts view, IRL Going, OH supply+demand, and Forum.',
    typicalFor: 'PLN Close Contributors pending role assignment',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going'],
    memberCount: 6,
  },
  {
    id: 'policy-unassigned-pln-other',
    name: 'Unassigned — PLN Other',
    role: 'Unassigned',
    group: 'PLN Other',
    description: 'Minimal base access for unassigned PLN Other members (currently L2). Provides member contacts view, IRL Going, and OH supply+demand. No Forum access at this level.',
    typicalFor: 'PLN Other members currently under L2 — minimal access tier',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'irl.going'],
    memberCount: 11,
  },
  {
    id: 'policy-unassigned-plc-other',
    name: 'Unassigned — PLC Other',
    role: 'Unassigned',
    group: 'PLC Other',
    description: 'Minimal base access for unassigned PLC Other members (currently L2). Provides member contacts view, IRL Going, and OH supply+demand. No Forum access at this level.',
    typicalFor: 'PLC Other members currently under L2 — minimal access tier',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'irl.going'],
    memberCount: 8,
  },

  // ── Advisor ───────────────────────────────────────────────────────────────────
  {
    id: 'policy-advisor-pl-internal',
    name: 'Advisor — PL Internal',
    role: 'Advisor',
    group: 'PL Internal',
    description: 'Advisory access for PL Internal advisors. Read access to Members, Office Hours, Forum, and IRL. Scoped to advisory and mentorship activities.',
    typicalFor: 'PL Internal advisors and mentors',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1 — advisory sessions' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going'],
    memberCount: 4,
  },
  {
    id: 'policy-advisor-pl-partner',
    name: 'Advisor — PL Partner',
    role: 'Advisor',
    group: 'PL Partner',
    description: 'Advisory access for PL Partner advisors. Read access to Members, Office Hours, Demo Day (investor view), and IRL.',
    typicalFor: 'PL Partner advisors and strategic consultants',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Demand'], note: 'v1 — book sessions' },
      { module: 'Demo Day', access: ['Active R'], note: 'Advisor view, approval-based' },
      { module: 'IRL', access: ['Going'] },
    ],
    permissions: ['members.contacts_view', 'oh.demand_read', 'demoday.active.read', 'irl.going_read'],
    memberCount: 6,
  },
  {
    id: 'policy-advisor-plvs',
    name: 'Advisor — PLC PLVS',
    role: 'Advisor',
    group: 'PLC PLVS',
    description: 'Advisory access for PLVS cohort advisors. Includes Office Hours supply+demand, Forum, IRL, and Founder Guides (PLVS scope).',
    typicalFor: 'Mentors and advisors working with the PLC PLVS cohort',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
      { module: 'Founder Guides', access: ['Read'], note: 'PLVS content (FG_Read.PLVS)' },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going', 'founder_guides.view.plvs'],
    memberCount: 5,
  },
  {
    id: 'policy-advisor-plcc',
    name: 'Advisor — PLC Crypto',
    role: 'Advisor',
    group: 'PLC Crypto',
    description: 'Advisory access for PLC Crypto cohort advisors. Includes Office Hours, Forum, IRL, and Founder Guides (PLCC scope).',
    typicalFor: 'Mentors and advisors working with the PLC Crypto cohort',
    modules: [
      { module: 'Members', access: ['View contacts'], note: 'Auth view' },
      { module: 'Office Hours', access: ['Supply', 'Demand'], note: 'v1' },
      { module: 'Forum', access: ['Read', 'Write'] },
      { module: 'IRL', access: ['Going'] },
      { module: 'Founder Guides', access: ['Read'], note: 'PLCC content (FG_Read.PLCC)' },
    ],
    permissions: ['members.contacts_view', 'oh.supply_read', 'oh.supply_write', 'oh.demand_read', 'forum.read', 'forum.write', 'irl.going', 'founder_guides.view.plcc'],
    memberCount: 3,
  },
];

// ── Members ───────────────────────────────────────────────────────────────────

export const RBAC_MEMBERS: RBACMember[] = [
  {
    id: 'm-jordan',
    name: 'Jordan Kasparov',
    email: 'jordan@newstartup.xyz',
    avatar: 'https://i.pravatar.cc/150?img=31',
    team: '—',
    role: 'Co-Founder',
    level: 'L0',
    approvalState: 'pending',
    assignedPolicyIds: [],
    directPermissions: [],
  },
  {
    id: 'm-maya',
    name: 'Maya Osei',
    email: 'maya@afrotech.io',
    avatar: 'https://i.pravatar.cc/150?img=32',
    team: 'AfroTech Ventures',
    role: 'CEO',
    level: 'L1',
    approvalState: 'verified',
    assignedPolicyIds: [],
    directPermissions: [],
  },
  {
    id: 'm-santiago',
    name: 'Santiago Navarro',
    email: 'santiago@plvs-labs.io',
    avatar: 'https://i.pravatar.cc/150?img=33',
    team: 'PLVS Labs',
    role: 'CTO',
    level: 'L3',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-founder-plvs'],
    directPermissions: [],
  },
  {
    id: 'm-aiko',
    name: 'Aiko Tanaka',
    email: 'aiko@tanaka.ventures',
    avatar: 'https://i.pravatar.cc/150?img=44',
    team: 'PLC Crypto',
    role: 'Founder & CEO',
    level: 'L4',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-founder-plvs', 'policy-founder-plcc'],
    directPermissions: [],
  },
  {
    id: 'm-priya',
    name: 'Priya Reddy',
    email: 'priya@protocol-core.io',
    avatar: 'https://i.pravatar.cc/150?img=45',
    team: 'Protocol Labs',
    role: 'Research Lead',
    level: 'L3',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-founder-plvs'],
    directPermissions: [
      {
        id: 'dp-001',
        permission: 'founder_guides.admin',
        label: 'Founder Guides — Admin',
        module: 'Founder Guides',
        level: 'Admin',
        addedBy: 'Amara Diallo',
        addedAt: 'Apr 12, 2026',
        createdAt: '2026-04-12T14:00:00.000Z',
        reason: 'Granted temporary admin access to co-author PLVS content during onboarding sprint.',
      },
    ],
  },
  {
    id: 'm-thomas',
    name: 'Thomas Beckmann',
    email: 'thomas@plpartners.vc',
    avatar: 'https://i.pravatar.cc/150?img=52',
    team: 'PL Partners',
    role: 'Managing Partner',
    level: 'L4',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-investor-partner'],
    directPermissions: [],
  },
  {
    id: 'm-amara',
    name: 'Amara Diallo',
    email: 'amara@protocol.ai',
    avatar: 'https://i.pravatar.cc/150?img=53',
    team: 'Protocol Labs',
    role: 'Directory Lead',
    level: 'L5',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-directory-admin', 'policy-demoday-stakeholder'],
    directPermissions: [],
  },
  {
    id: 'm-lin',
    name: 'Lin Chen',
    email: 'lin@protocol.ai',
    avatar: 'https://i.pravatar.cc/150?img=54',
    team: 'Protocol Labs',
    role: 'Platform Engineer',
    level: 'L6',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-infra-team'],
    directPermissions: [],
  },
  // ── Members covering remaining policies ──────────────────────────────────────

  // Demo Day Admin — PL Internal
  {
    id: 'm-felix',
    name: 'Felix Hartmann',
    email: 'felix@protocol.ai',
    avatar: 'https://i.pravatar.cc/150?img=11',
    team: 'Protocol Labs',
    role: 'Events Lead',
    level: 'L4',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-demoday-admin'],
    directPermissions: [],
  },

  // Demo Day Admin — PL Partner
  {
    id: 'm-diana',
    name: 'Diana Moreau',
    email: 'diana@plpartners.vc',
    avatar: 'https://i.pravatar.cc/150?img=22',
    team: 'PL Partners',
    role: 'Program Manager',
    level: 'L4',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-demoday-admin-partner'],
    directPermissions: [],
  },

  // Demo Day Stakeholder — PL Partner
  {
    id: 'm-carlos',
    name: 'Carlos Reyes',
    email: 'carlos@plpartners.vc',
    avatar: 'https://i.pravatar.cc/150?img=15',
    team: 'PL Partners',
    role: 'VP Strategy',
    level: 'L4',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-demoday-stakeholder-partner'],
    directPermissions: [],
  },

  // Founder — PLC Founder Forge
  {
    id: 'm-hassan',
    name: 'Hassan Al-Rashid',
    email: 'hassan@forgeventures.io',
    avatar: 'https://i.pravatar.cc/150?img=14',
    team: 'Forge Ventures',
    role: 'Founder',
    level: 'L3',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-founder-forge'],
    directPermissions: [],
  },

  // Founder — PLC Neuro
  {
    id: 'm-yuki',
    name: 'Yuki Nakamura',
    email: 'yuki@neurospark.ai',
    avatar: 'https://i.pravatar.cc/150?img=16',
    team: 'NeuroSpark AI',
    role: 'CEO',
    level: 'L3',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-founder-neuro'],
    directPermissions: [],
  },

  // Investor — PL
  {
    id: 'm-claire',
    name: 'Claire Dubois',
    email: 'claire@clairevc.com',
    avatar: 'https://i.pravatar.cc/150?img=25',
    team: 'Claire Ventures',
    role: 'Managing Director',
    level: 'L4',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-investor-pl'],
    directPermissions: [],
  },

  // Founder — PLN Close Contributor
  {
    id: 'm-ben',
    name: 'Ben Okafor',
    email: 'ben@webzero.xyz',
    avatar: 'https://i.pravatar.cc/150?img=13',
    team: 'Web Zero',
    role: 'Co-Founder',
    level: 'L4',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-founder-pln-cc'],
    directPermissions: [],
  },

  // Founder — PLC Other
  {
    id: 'm-sofia',
    name: 'Sofia Andersen',
    email: 'sofia@nordic-protocol.io',
    avatar: 'https://i.pravatar.cc/150?img=28',
    team: 'Nordic Protocol',
    role: 'Founder',
    level: 'L3',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-founder-plc-other'],
    directPermissions: [],
  },

  // Founder — PLN Other
  {
    id: 'm-marcus',
    name: 'Marcus Webb',
    email: 'marcus@devlabs.io',
    avatar: 'https://i.pravatar.cc/150?img=7',
    team: 'DevLabs',
    role: 'Founder',
    level: 'L3',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-founder-pln-other'],
    directPermissions: [],
  },

  // Unassigned — PLC PLVS
  {
    id: 'm-zoe',
    name: 'Zoe Mitchell',
    email: 'zoe@plvs-early.io',
    avatar: 'https://i.pravatar.cc/150?img=26',
    team: 'PLVS Early',
    role: 'Founder',
    level: 'L2',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-unassigned-plvs'],
    directPermissions: [],
  },

  // Unassigned — PLC Crypto
  {
    id: 'm-alex',
    name: 'Alex Kim',
    email: 'alex@cryptobase.io',
    avatar: 'https://i.pravatar.cc/150?img=8',
    team: 'CryptoBase',
    role: 'Engineer',
    level: 'L2',
    approvalState: 'pending',
    assignedPolicyIds: ['policy-unassigned-plcc'],
    directPermissions: [],
  },

  // Unassigned — PLC Founder Forge
  {
    id: 'm-raj',
    name: 'Raj Patel',
    email: 'raj@buildlabs.io',
    avatar: 'https://i.pravatar.cc/150?img=12',
    team: 'Build Labs',
    role: 'Co-Founder',
    level: 'L2',
    approvalState: 'verified',
    assignedPolicyIds: ['policy-unassigned-forge'],
    directPermissions: [],
  },

  // Unassigned — PLC Neuro
  {
    id: 'm-lucia',
    name: 'Lucia Fernandez',
    email: 'lucia@neuron-labs.ai',
    avatar: 'https://i.pravatar.cc/150?img=27',
    team: 'Neuron Labs',
    role: 'Research Lead',
    level: 'L2',
    approvalState: 'approved',
    assignedPolicyIds: ['policy-unassigned-neuro'],
    directPermissions: [],
  },

  // Unassigned — PLN Close Contributor
  {
    id: 'm-dmitri',
    name: 'Dmitri Volkov',
    email: 'dmitri@opennetwork.xyz',
    avatar: 'https://i.pravatar.cc/150?img=17',
    team: 'Open Network',
    role: 'Engineer',
    level: 'L2',
    approvalState: 'verified',
    assignedPolicyIds: ['policy-unassigned-pln-cc'],
    directPermissions: [],
  },

  // Unassigned — PLN Other
  {
    id: 'm-olivia',
    name: 'Olivia Grant',
    email: 'olivia@plnmember.io',
    avatar: 'https://i.pravatar.cc/150?img=29',
    team: '—',
    role: 'Member',
    level: 'L2',
    approvalState: 'pending',
    assignedPolicyIds: ['policy-unassigned-pln-other'],
    directPermissions: [],
  },

  // Unassigned — PLC Other
  {
    id: 'm-james',
    name: 'James Osei',
    email: 'james@plcother.io',
    avatar: 'https://i.pravatar.cc/150?img=18',
    team: '—',
    role: 'Member',
    level: 'L2',
    approvalState: 'pending',
    assignedPolicyIds: ['policy-unassigned-plc-other'],
    directPermissions: [],
  },

  // ── Rejected members ─────────────────────────────────────────────────────────

  {
    id: 'm-kai',
    name: 'Kai Andersen',
    email: 'kai@cryptonova.xyz',
    avatar: 'https://i.pravatar.cc/150?img=60',
    team: 'CryptoNova',
    role: 'Co-Founder',
    level: 'L0',
    approvalState: 'rejected',
    assignedPolicyIds: [],
    directPermissions: [],
  },
  {
    id: 'm-elena',
    name: 'Elena Vasquez',
    email: 'elena@defiprotocol.io',
    avatar: 'https://i.pravatar.cc/150?img=61',
    team: 'DeFi Protocol',
    role: 'CTO',
    level: 'L1',
    approvalState: 'rejected',
    assignedPolicyIds: [],
    directPermissions: [],
  },
];

// ── Utility functions ─────────────────────────────────────────────────────────

export function getPoliciesForMember(member: RBACMember): RBACPolicy[] {
  return member.assignedPolicyIds
    .map((id) => RBAC_POLICIES.find((p) => p.id === id))
    .filter((p): p is RBACPolicy => p !== undefined);
}

export function getPolicyById(id: string): RBACPolicy | undefined {
  return RBAC_POLICIES.find((p) => p.id === id);
}

export function getEffectiveAccess(policies: RBACPolicy[], directPerms: DirectPermission[]): ModuleAccess[] {
  const moduleMap = new Map<string, Set<string>>();
  const noteMap = new Map<string, string[]>();

  for (const policy of policies) {
    for (const ma of policy.modules) {
      if (!moduleMap.has(ma.module)) moduleMap.set(ma.module, new Set());
      for (const a of ma.access) {
        moduleMap.get(ma.module)!.add(a);
      }
      if (ma.note) {
        const notes = noteMap.get(ma.module) ?? [];
        if (!notes.includes(ma.note)) notes.push(ma.note);
        noteMap.set(ma.module, notes);
      }
    }
  }

  const result: ModuleAccess[] = [];
  for (const [module, accessSet] of moduleMap.entries()) {
    const notes = noteMap.get(module);
    result.push({
      module,
      access: Array.from(accessSet),
      note: notes && notes.length > 0 ? notes.join(' + ') : undefined,
    });
  }

  return result;
}

export function getAccessExplanations(
  policies: RBACPolicy[],
  directPerms: DirectPermission[]
): Array<{ text: string; isException: boolean }> {
  const lines: Array<{ text: string; isException: boolean }> = [];

  for (const policy of policies) {
    for (const ma of policy.modules) {
      const accessStr = ma.access.join(' + ');
      const note = ma.note ? ` (${ma.note})` : '';
      lines.push({
        text: `${ma.module} · ${accessStr}${note} ← ${policy.name}`,
        isException: false,
      });
    }
  }

  for (const dp of directPerms) {
    lines.push({
      text: `${dp.permission} → added as direct exception by ${dp.addedBy} on ${dp.addedAt}`,
      isException: true,
    });
  }

  return lines;
}

export function isEligibleForPolicyAssignment(member: RBACMember): boolean {
  return member.approvalState === 'approved';
}

export function getLevelLabel(level: MemberLevel): string {
  const map: Record<MemberLevel, string> = {
    L0: 'L0 · Pending',
    L1: 'L1 · Verified',
    L2: 'L2 · Approved',
    L3: 'L3 · Approved',
    L4: 'L4 · Approved',
    L5: 'L5 · Approved',
    L6: 'L6 · Approved',
  };
  return map[level];
}

export function getLevelDescription(level: MemberLevel): string {
  const map: Record<MemberLevel, string> = {
    L0: 'Account created, email not yet verified',
    L1: 'Email verified, awaiting manual approval',
    L2: 'Approved — basic network access',
    L3: 'Approved — full community access',
    L4: 'Approved — senior / partner access',
    L5: 'Approved — lead / admin access',
    L6: 'Approved — superadmin / infrastructure',
  };
  return map[level];
}

export function getAccessSummary(member: RBACMember): string {
  const policies = getPoliciesForMember(member);
  if (policies.length === 0 && member.directPermissions.length === 0) {
    if (member.approvalState === 'pending') return 'No access — pending';
    if (member.approvalState === 'verified') return 'No policies assigned';
    return 'No policies assigned';
  }
  const modules = new Set<string>();
  for (const p of policies) {
    for (const m of p.modules) {
      modules.add(m.module);
    }
  }
  const arr = Array.from(modules);
  return arr.slice(0, 3).join(', ') + (arr.length > 3 ? ' +' + (arr.length - 3) + ' more' : '');
}
