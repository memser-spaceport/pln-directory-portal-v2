'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/form/Input/Input';
import { rbacService, Role, Permission } from '@/services/rbac/rbac-mock-service';
import s from './ManageMemberModal.module.scss';

export interface MemberWithRoles {
  id: string;
  uid: string;
  name: string;
  email?: string | null;
  profile?: string;
  rbacRoles: string[];
  directPermissionIds: string[];
}

interface ManageMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberWithRoles | null;
}

export function ManageMemberModal({ isOpen, onClose, member }: ManageMemberModalProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [memberData, setMemberData] = useState<MemberWithRoles | null>(member);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('');

  useEffect(() => {
    if (member) {
      // Get fresh direct permissions from service
      const storedMember = rbacService.getMemberById(member.id);
      setMemberData({
        ...member,
        directPermissionIds: storedMember?.directPermissionIds || member.directPermissionIds || [],
        rbacRoles: rbacService.getRolesForRealMember(member.id),
      });
    }
  }, [member, isOpen, refreshKey]);

  const roles = useMemo(() => rbacService.getRoles(), []);
  const permissions = useMemo(() => rbacService.getPermissions(), []);

  const assignedRoles = useMemo(() => {
    if (!memberData) return [];
    return roles.filter((r) => memberData.rbacRoles.includes(r.id));
  }, [memberData, roles]);

  const availableRoles = useMemo(() => {
    if (!memberData) return [];
    return roles.filter(
      (r) =>
        !memberData.rbacRoles.includes(r.id) &&
        r.name.toLowerCase().includes(roleSearchQuery.toLowerCase())
    );
  }, [memberData, roles, roleSearchQuery]);

  const rolePermissions = useMemo(() => {
    if (!memberData) return [];
    const permissionIds = new Set<string>();
    memberData.rbacRoles.forEach((roleId) => {
      const role = roles.find((r) => r.id === roleId);
      if (role) {
        role.permissionIds.forEach((pid) => permissionIds.add(pid));
      }
    });
    return permissions.filter((p) => permissionIds.has(p.id));
  }, [memberData, roles, permissions]);

  const directPermissions = useMemo(() => {
    if (!memberData) return [];
    return permissions.filter((p) => memberData.directPermissionIds.includes(p.id));
  }, [memberData, permissions]);

  const availablePermissions = useMemo(() => {
    if (!memberData) return [];
    return permissions.filter(
      (p) =>
        !memberData.directPermissionIds.includes(p.id) &&
        (p.code.toLowerCase().includes(permissionSearchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(permissionSearchQuery.toLowerCase()))
    );
  }, [memberData, permissions, permissionSearchQuery]);

  const handleAddRole = (roleId: string) => {
    if (!memberData) return;
    rbacService.addRoleToRealMember(memberData.id, roleId);
    setRefreshKey((k) => k + 1);
  };

  const handleRemoveRole = (roleId: string) => {
    if (!memberData) return;
    rbacService.removeRoleFromRealMember(memberData.id, roleId);
    setRefreshKey((k) => k + 1);
  };

  const handleAddDirectPermission = (permissionId: string) => {
    if (!memberData) return;
    rbacService.addDirectPermissionToRealMember(memberData.id, permissionId);
    setRefreshKey((k) => k + 1);
  };

  const handleRemoveDirectPermission = (permissionId: string) => {
    if (!memberData) return;
    rbacService.removeDirectPermissionFromRealMember(memberData.id, permissionId);
    setRefreshKey((k) => k + 1);
  };

  if (!memberData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.root}>
        <div className={s.header}>
          <h2 className={s.title}>Manage Member</h2>
          <p className={s.subtitle}>
            {memberData.name} ({memberData.email || 'No email'})
          </p>
        </div>

        <div className={s.section}>
          <h3 className={s.sectionTitle}>Assigned Roles</h3>
          <div className={s.currentItems}>
            {assignedRoles.map((role) => (
              <div key={role.id} className={s.item}>
                <div className={s.itemInfo}>
                  <span className={s.itemName}>{role.name}</span>
                  <span className={s.itemDescription}>{role.description}</span>
                </div>
                <button
                  className={s.removeBtn}
                  onClick={() => handleRemoveRole(role.id)}
                  aria-label={`Remove ${role.name}`}
                >
                  <XIcon />
                </button>
              </div>
            ))}
            {assignedRoles.length === 0 && (
              <span className={s.noItems}>No roles assigned</span>
            )}
          </div>

          <div className={s.addSection}>
            <Input
              placeholder="Search roles to add..."
              value={roleSearchQuery}
              onChange={(e) => setRoleSearchQuery(e.target.value)}
              startIcon={<SearchIcon />}
              className={s.searchInput}
            />
            {roleSearchQuery && availableRoles.length > 0 && (
              <div className={s.dropdown}>
                {availableRoles.map((role) => (
                  <button
                    key={role.id}
                    className={s.dropdownItem}
                    onClick={() => {
                      handleAddRole(role.id);
                      setRoleSearchQuery('');
                    }}
                  >
                    <span className={s.dropdownItemName}>{role.name}</span>
                    <span className={s.dropdownItemDescription}>{role.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={s.section}>
          <h3 className={s.sectionTitle}>Permissions from Roles</h3>
          <div className={s.permissionsList}>
            {rolePermissions.map((permission) => (
              <div key={permission.id} className={s.permissionItem}>
                <span className={s.permissionCode}>{permission.code}</span>
                <span className={s.permissionDescription}>{permission.description}</span>
              </div>
            ))}
            {rolePermissions.length === 0 && (
              <span className={s.noItems}>No permissions from roles</span>
            )}
          </div>
        </div>

        <div className={s.section}>
          <h3 className={s.sectionTitle}>Direct Permissions (Special Cases)</h3>
          <div className={s.currentItems}>
            {directPermissions.map((permission) => (
              <div key={permission.id} className={`${s.item} ${s.permissionItem}`}>
                <div className={s.itemInfo}>
                  <span className={s.itemName}>{permission.code}</span>
                  <span className={s.itemDescription}>{permission.description}</span>
                </div>
                <button
                  className={s.removeBtn}
                  onClick={() => handleRemoveDirectPermission(permission.id)}
                  aria-label={`Remove ${permission.code}`}
                >
                  <XIcon />
                </button>
              </div>
            ))}
            {directPermissions.length === 0 && (
              <span className={s.noItems}>No direct permissions</span>
            )}
          </div>

          <div className={s.addSection}>
            <Input
              placeholder="Search permissions to add directly..."
              value={permissionSearchQuery}
              onChange={(e) => setPermissionSearchQuery(e.target.value)}
              startIcon={<SearchIcon />}
              className={s.searchInput}
            />
            {permissionSearchQuery && availablePermissions.length > 0 && (
              <div className={s.dropdown}>
                {availablePermissions.map((permission) => (
                  <button
                    key={permission.id}
                    className={s.dropdownItem}
                    onClick={() => {
                      handleAddDirectPermission(permission.id);
                      setPermissionSearchQuery('');
                    }}
                  >
                    <span className={s.dropdownItemName}>{permission.code}</span>
                    <span className={s.dropdownItemDescription}>{permission.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={s.footer}>
          <Button variant="neutral" style="border" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 4L4 12M4 4L12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
