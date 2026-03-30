'use client';

import { useState, useMemo } from 'react';
import { useAllMembers } from '@/services/members/hooks/useAllMembers';
import { rbacService } from '@/services/rbac/rbac-mock-service';
import { Input } from '@/components/common/form/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { ManageMemberModal, MemberWithRoles } from '@/components/page/access-control/modals/ManageMemberModal';
import s from './MembersTab.module.scss';

export function MembersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMember, setSelectedMember] = useState<MemberWithRoles | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const { data: membersResponse, isLoading } = useAllMembers();

  const roles = useMemo(() => rbacService.getRoles(), [refreshKey]);
  const permissions = useMemo(() => rbacService.getPermissions(), [refreshKey]);

  // Extract members array from response
  const realMembers = membersResponse?.data;

  // Combine real members with RBAC roles
  const members = useMemo(() => {
    if (!realMembers || !Array.isArray(realMembers)) return [];

    return realMembers
      .map((member): MemberWithRoles => {
        const roleIds = rbacService.getRolesForRealMember(member.uid);
        // Check if this member has stored direct permissions
        const storedMember = rbacService.getMemberById(member.uid);

        return {
          id: member.uid,
          uid: member.uid,
          name: member.name,
          email: member.email,
          profile: member.profile,
          rbacRoles: roleIds,
          directPermissionIds: storedMember?.directPermissionIds || [],
        };
      })
      .filter((member) => {
        // Only show members that have at least one RBAC role assigned for the mockup
        // or search query matches
        if (!searchQuery.trim()) {
          return member.rbacRoles.length > 0;
        }
        const lowerQuery = searchQuery.toLowerCase();
        return (
          member.name.toLowerCase().includes(lowerQuery) ||
          (member.email && member.email.toLowerCase().includes(lowerQuery))
        );
      });
  }, [realMembers, searchQuery, refreshKey]);

  const getRoleNames = (roleIds: string[]): string[] => {
    return roleIds.map((id) => roles.find((r) => r.id === id)?.name).filter(Boolean) as string[];
  };

  const getDirectPermissionCodes = (permissionIds: string[]): string[] => {
    return permissionIds.map((id) => permissions.find((p) => p.id === id)?.code).filter(Boolean) as string[];
  };

  const handleManageClick = (member: MemberWithRoles) => {
    setSelectedMember(member);
    setIsManageModalOpen(true);
  };

  const handleModalClose = () => {
    setIsManageModalOpen(false);
    setSelectedMember(null);
    setRefreshKey((k) => k + 1);
  };

  if (isLoading) {
    return (
      <div className={s.root}>
        <div className={s.loadingState}>Loading members...</div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <div className={s.searchWrapper}>
          <Input
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<SearchIcon />}
            className={s.searchInput}
          />
        </div>
      </div>

      <div className={s.tableContainer}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Name / Email</th>
              <th>Assigned Roles</th>
              <th>Direct Permissions</th>
              <th className={s.actionCol}>Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className={s.memberInfo}>
                    <div className={s.memberName}>{member.name}</div>
                    <div className={s.memberEmail}>{member.email ?? 'No email'}</div>
                  </div>
                </td>
                <td>
                  <div className={s.tags}>
                    {getRoleNames(member.rbacRoles).map((roleName) => (
                      <span key={roleName} className={`${s.tag} ${s.roleTag}`}>
                        {roleName}
                      </span>
                    ))}
                    {member.rbacRoles.length === 0 && <span className={s.noTags}>No roles</span>}
                  </div>
                </td>
                <td>
                  <div className={s.tags}>
                    {getDirectPermissionCodes(member.directPermissionIds).map((code) => (
                      <span key={code} className={`${s.tag} ${s.permissionTag}`}>
                        {code}
                      </span>
                    ))}
                    {member.directPermissionIds.length === 0 && <span className={s.noTags}>None</span>}
                  </div>
                </td>
                <td>
                  <Button size="s" style="border" variant="neutral" onClick={() => handleManageClick(member)}>
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className={s.emptyState}>
                  No members found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ManageMemberModal isOpen={isManageModalOpen} onClose={handleModalClose} member={selectedMember} />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 14L11.1333 11.1333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
