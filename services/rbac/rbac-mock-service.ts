export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  directPermissionIds: string[];
}

export interface RBACState {
  permissions: Permission[];
  roles: Role[];
  members: Member[];
}

const INITIAL_PERMISSIONS: Permission[] = [
  { id: 'perm-3', code: 'FoundersGuideView', description: 'Access the Founders Guide' },
  { id: 'perm-4', code: 'FoundersGuideCreateArticles', description: 'Write articles in Founders Guide' },
  { id: 'perm-6', code: 'ForumAccess', description: 'Create and view forum posts' },
  { id: 'perm-7', code: 'DealsView', description: 'View available deals' },
  { id: 'perm-8', code: 'FullAdminAccess', description: 'Full access to view and edit everything' },
];

const INITIAL_ROLES: Role[] = [
  {
    id: 'role-1',
    name: 'Onboarding',
    description: 'New user with basic access',
    permissionIds: [],
  },
  {
    id: 'role-2',
    name: 'PL Funded Founder',
    description: 'Full access for funded founders',
    permissionIds: ['perm-3', 'perm-4', 'perm-6', 'perm-7'],
  },
  {
    id: 'role-3',
    name: 'System Admin',
    description: 'System administrators with full access',
    permissionIds: ['perm-8'],
  },
];

// Real member UID to RBAC role mappings (for mockup demo)
export const REAL_MEMBER_ROLE_MAPPINGS: Record<string, string[]> = {
  // System Admin
  'cmbc0q1050007x402kxosz2a3': ['role-3'],
  'cldvoe6id071fu21kkmems0nd': ['role-3'],
  'cmm5dv0n7007eot4gi2alhjwc': ['role-3'],
  // Onboarding
  'cmis24d3c0000n24f4u6e9drg': ['role-1'],
  'cmlozgmwm001pr54ftcu1125x': ['role-1'],
  // PL Funded Founder
  'cldvo5zyb04cpu21kptya0dqt': ['role-2'],
  'cldvocb4x06dnu21kicrtxm79': ['role-2'],
  'cldvo15m702pnu21kuwg2xzbe': ['role-2'],
};

const INITIAL_MEMBERS: Member[] = [];

class RBACMockService {
  private state: RBACState;

  constructor() {
    this.state = {
      permissions: [...INITIAL_PERMISSIONS],
      roles: [...INITIAL_ROLES],
      members: [...INITIAL_MEMBERS],
    };
  }

  getState(): RBACState {
    return { ...this.state };
  }

  // Permission methods
  getPermissions(): Permission[] {
    return [...this.state.permissions];
  }

  getPermissionById(id: string): Permission | undefined {
    return this.state.permissions.find((p) => p.id === id);
  }

  createPermission(code: string, description: string): Permission {
    const newPermission: Permission = {
      id: `perm-${Date.now()}`,
      code,
      description,
    };
    this.state.permissions.push(newPermission);
    return newPermission;
  }

  updatePermission(id: string, updates: Partial<Omit<Permission, 'id'>>): Permission | null {
    const index = this.state.permissions.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.state.permissions[index] = { ...this.state.permissions[index], ...updates };
    return this.state.permissions[index];
  }

  deletePermission(id: string): boolean {
    const index = this.state.permissions.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.state.permissions.splice(index, 1);
    // Remove from roles
    this.state.roles.forEach((role) => {
      role.permissionIds = role.permissionIds.filter((pid) => pid !== id);
    });
    // Remove from members' direct permissions
    this.state.members.forEach((member) => {
      member.directPermissionIds = member.directPermissionIds.filter((pid) => pid !== id);
    });
    return true;
  }

  // Role methods
  getRoles(): Role[] {
    return [...this.state.roles];
  }

  getRoleById(id: string): Role | undefined {
    return this.state.roles.find((r) => r.id === id);
  }

  createRole(name: string, description: string, permissionIds: string[] = []): Role {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name,
      description,
      permissionIds,
    };
    this.state.roles.push(newRole);
    return newRole;
  }

  updateRole(id: string, updates: Partial<Omit<Role, 'id'>>): Role | null {
    const index = this.state.roles.findIndex((r) => r.id === id);
    if (index === -1) return null;
    this.state.roles[index] = { ...this.state.roles[index], ...updates };
    return this.state.roles[index];
  }

  deleteRole(id: string): boolean {
    const index = this.state.roles.findIndex((r) => r.id === id);
    if (index === -1) return false;
    this.state.roles.splice(index, 1);
    // Remove from members
    this.state.members.forEach((member) => {
      member.roleIds = member.roleIds.filter((rid) => rid !== id);
    });
    return true;
  }

  addPermissionToRole(roleId: string, permissionId: string): boolean {
    const role = this.state.roles.find((r) => r.id === roleId);
    if (!role) return false;
    if (!role.permissionIds.includes(permissionId)) {
      role.permissionIds.push(permissionId);
    }
    return true;
  }

  removePermissionFromRole(roleId: string, permissionId: string): boolean {
    const role = this.state.roles.find((r) => r.id === roleId);
    if (!role) return false;
    role.permissionIds = role.permissionIds.filter((pid) => pid !== permissionId);
    return true;
  }

  // Member methods
  getMembers(): Member[] {
    return [...this.state.members];
  }

  getMemberById(id: string): Member | undefined {
    return this.state.members.find((m) => m.id === id);
  }

  createMember(name: string, email: string, roleIds: string[] = [], directPermissionIds: string[] = []): Member {
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name,
      email,
      roleIds,
      directPermissionIds,
    };
    this.state.members.push(newMember);
    return newMember;
  }

  updateMember(id: string, updates: Partial<Omit<Member, 'id'>>): Member | null {
    const index = this.state.members.findIndex((m) => m.id === id);
    if (index === -1) return null;
    this.state.members[index] = { ...this.state.members[index], ...updates };
    return this.state.members[index];
  }

  deleteMember(id: string): boolean {
    const index = this.state.members.findIndex((m) => m.id === id);
    if (index === -1) return false;
    this.state.members.splice(index, 1);
    return true;
  }

  addRoleToMember(memberId: string, roleId: string): boolean {
    const member = this.state.members.find((m) => m.id === memberId);
    if (!member) return false;
    if (!member.roleIds.includes(roleId)) {
      member.roleIds.push(roleId);
    }
    return true;
  }

  removeRoleFromMember(memberId: string, roleId: string): boolean {
    const member = this.state.members.find((m) => m.id === memberId);
    if (!member) return false;
    member.roleIds = member.roleIds.filter((rid) => rid !== roleId);
    return true;
  }

  addDirectPermissionToMember(memberId: string, permissionId: string): boolean {
    const member = this.state.members.find((m) => m.id === memberId);
    if (!member) return false;
    if (!member.directPermissionIds.includes(permissionId)) {
      member.directPermissionIds.push(permissionId);
    }
    return true;
  }

  removeDirectPermissionFromMember(memberId: string, permissionId: string): boolean {
    const member = this.state.members.find((m) => m.id === memberId);
    if (!member) return false;
    member.directPermissionIds = member.directPermissionIds.filter((pid) => pid !== permissionId);
    return true;
  }

  // Utility methods
  getRolePermissions(roleId: string): Permission[] {
    const role = this.state.roles.find((r) => r.id === roleId);
    if (!role) return [];
    return this.state.permissions.filter((p) => role.permissionIds.includes(p.id));
  }

  getMemberEffectivePermissions(memberId: string): Permission[] {
    const member = this.state.members.find((m) => m.id === memberId);
    if (!member) return [];

    const rolePermissionIds = new Set<string>();
    member.roleIds.forEach((roleId) => {
      const role = this.state.roles.find((r) => r.id === roleId);
      if (role) {
        role.permissionIds.forEach((pid) => rolePermissionIds.add(pid));
      }
    });

    member.directPermissionIds.forEach((pid) => rolePermissionIds.add(pid));

    return this.state.permissions.filter((p) => rolePermissionIds.has(p.id));
  }

  getMembersWithPermission(permissionId: string): Member[] {
    return this.state.members.filter(
      (m) =>
        m.directPermissionIds.includes(permissionId) ||
        m.roleIds.some((roleId) => {
          const role = this.state.roles.find((r) => r.id === roleId);
          return role?.permissionIds.includes(permissionId);
        })
    );
  }

  getRolesWithPermission(permissionId: string): Role[] {
    return this.state.roles.filter((r) => r.permissionIds.includes(permissionId));
  }

  hasPermission(memberId: string, permissionCode: string): boolean {
    const member = this.state.members.find((m) => m.id === memberId);
    if (!member) return false;

    const permissions = this.getMemberEffectivePermissions(memberId);
    return permissions.some((p) => p.code === permissionCode);
  }

  hasRole(memberId: string, roleName: string): boolean {
    const member = this.state.members.find((m) => m.id === memberId);
    if (!member) return false;

    return member.roleIds.some((roleId) => {
      const role = this.state.roles.find((r) => r.id === roleId);
      return role?.name === roleName;
    });
  }

  searchMembers(query: string): Member[] {
    const lowerQuery = query.toLowerCase();
    return this.state.members.filter(
      (m) =>
        m.name.toLowerCase().includes(lowerQuery) || m.email.toLowerCase().includes(lowerQuery)
    );
  }

  // Real member integration methods
  getRolesForRealMember(memberUid: string): string[] {
    return REAL_MEMBER_ROLE_MAPPINGS[memberUid] || [];
  }

  getRealMemberEffectivePermissions(memberUid: string): Permission[] {
    const roleIds = this.getRolesForRealMember(memberUid);
    const permissionIds = new Set<string>();

    roleIds.forEach((roleId) => {
      const role = this.state.roles.find((r) => r.id === roleId);
      if (role) {
        role.permissionIds.forEach((pid) => permissionIds.add(pid));
      }
    });

    // Also check direct permissions from stored state
    const storedMember = this.state.members.find((m) => m.id === memberUid);
    if (storedMember) {
      storedMember.directPermissionIds.forEach((pid) => permissionIds.add(pid));
    }

    return this.state.permissions.filter((p) => permissionIds.has(p.id));
  }

  hasRealMemberDirectPermission(memberUid: string, permissionId: string): boolean {
    const storedMember = this.state.members.find((m) => m.id === memberUid);
    return storedMember ? storedMember.directPermissionIds.includes(permissionId) : false;
  }

  addDirectPermissionToRealMember(memberUid: string, permissionId: string): boolean {
    const existingMember = this.state.members.find((m) => m.id === memberUid);
    if (existingMember) {
      if (!existingMember.directPermissionIds.includes(permissionId)) {
        existingMember.directPermissionIds.push(permissionId);
      }
      return true;
    }
    // Create a new entry for this real member with just the direct permission
    const newMember: Member = {
      id: memberUid,
      name: '', // Will be filled from real API data
      email: '',
      roleIds: [],
      directPermissionIds: [permissionId],
    };
    this.state.members.push(newMember);
    return true;
  }

  removeDirectPermissionFromRealMember(memberUid: string, permissionId: string): boolean {
    const member = this.state.members.find((m) => m.id === memberUid);
    if (!member) return false;
    member.directPermissionIds = member.directPermissionIds.filter((pid) => pid !== permissionId);
    return true;
  }

  // Role management for real members (in-memory for mockup)
  addRoleToRealMember(memberUid: string, roleId: string): boolean {
    const currentRoles = REAL_MEMBER_ROLE_MAPPINGS[memberUid] || [];
    if (!currentRoles.includes(roleId)) {
      REAL_MEMBER_ROLE_MAPPINGS[memberUid] = [...currentRoles, roleId];
    }
    return true;
  }

  removeRoleFromRealMember(memberUid: string, roleId: string): boolean {
    const currentRoles = REAL_MEMBER_ROLE_MAPPINGS[memberUid] || [];
    REAL_MEMBER_ROLE_MAPPINGS[memberUid] = currentRoles.filter((id) => id !== roleId);
    return true;
  }
}

export const rbacService = new RBACMockService();
