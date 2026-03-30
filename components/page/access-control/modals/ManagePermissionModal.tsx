'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/form/Input/Input';
import { rbacService, Permission, Role, Member } from '@/services/rbac/rbac-mock-service';
import s from './ManagePermissionModal.module.scss';

interface ManagePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: Permission | null;
}

export function ManagePermissionModal({ isOpen, onClose, permission }: ManagePermissionModalProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [permissionData, setPermissionData] = useState<Permission | null>(permission);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (permission) {
      const freshPermission = rbacService.getPermissionById(permission.id);
      const currentPermission = freshPermission || permission;
      setPermissionData(currentPermission);
      setCode(currentPermission.code);
      setDescription(currentPermission.description);
    }
  }, [permission, isOpen, refreshKey]);

  const roles = useMemo(() => rbacService.getRoles(), [refreshKey]);
  const members = useMemo(() => rbacService.getMembers(), [refreshKey]);

  const rolesWithPermission = useMemo(() => {
    if (!permissionData) return [];
    return roles.filter((r) => r.permissionIds.includes(permissionData.id));
  }, [permissionData, roles]);

  const membersWithDirectPermission = useMemo(() => {
    if (!permissionData) return [];
    return members.filter((m) => m.directPermissionIds.includes(permissionData.id));
  }, [permissionData, members]);

  const handleSave = () => {
    if (!permissionData || !code.trim()) return;
    rbacService.updatePermission(permissionData.id, {
      code: code.trim(),
      description: description.trim(),
    });
    setRefreshKey((k) => k + 1);
  };

  const handleRemoveFromRole = (roleId: string) => {
    if (!permissionData) return;
    rbacService.removePermissionFromRole(roleId, permissionData.id);
    setRefreshKey((k) => k + 1);
  };

  const handleRevokeFromMember = (memberId: string) => {
    if (!permissionData) return;
    rbacService.removeDirectPermissionFromMember(memberId, permissionData.id);
    setRefreshKey((k) => k + 1);
  };

  const handleDeletePermission = () => {
    if (!permissionData) return;
    if (confirm(`Are you sure you want to delete the permission "${permissionData.code}"? This will remove it from all roles and members.`)) {
      rbacService.deletePermission(permissionData.id);
      onClose();
    }
  };

  if (!permissionData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.root}>
        <div className={s.header}>
          <h2 className={s.title}>Manage Permission</h2>
        </div>

        <div className={s.section}>
          <h3 className={s.sectionTitle}>Permission Details</h3>
          <div className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Permission Code *</label>
              <Input
                placeholder="Enter permission code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Description</label>
              <Input
                as="textarea"
                placeholder="Enter permission description"
                value={description}
                onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
              />
            </div>
            <div className={s.saveBtnWrapper}>
              <Button
                variant="primary"
                style="fill"
                size="s"
                onClick={handleSave}
                disabled={!code.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <div className={s.section}>
          <h3 className={s.sectionTitle}>
            Roles Using This Permission ({rolesWithPermission.length})
          </h3>
          <div className={s.itemsList}>
            {rolesWithPermission.map((role) => (
              <div key={role.id} className={s.item}>
                <div className={s.itemInfo}>
                  <span className={s.itemName}>{role.name}</span>
                  <span className={s.itemDescription}>{role.description || 'No description'}</span>
                </div>
                <button
                  className={s.removeBtn}
                  onClick={() => handleRemoveFromRole(role.id)}
                  aria-label={`Remove from ${role.name}`}
                >
                  <XIcon />
                </button>
              </div>
            ))}
            {rolesWithPermission.length === 0 && (
              <span className={s.noItems}>No roles are using this permission</span>
            )}
          </div>
        </div>

        <div className={s.section}>
          <h3 className={s.sectionTitle}>
            Members with Direct Permission ({membersWithDirectPermission.length})
          </h3>
          <div className={s.itemsList}>
            {membersWithDirectPermission.map((member) => (
              <div key={member.id} className={s.item}>
                <div className={s.itemInfo}>
                  <span className={s.itemName}>{member.name}</span>
                  <span className={s.itemDescription}>{member.email}</span>
                </div>
                <button
                  className={s.revokeBtn}
                  onClick={() => handleRevokeFromMember(member.id)}
                  aria-label={`Revoke from ${member.name}`}
                >
                  Revoke
                </button>
              </div>
            ))}
            {membersWithDirectPermission.length === 0 && (
              <span className={s.noItems}>No members have this as a direct permission</span>
            )}
          </div>
        </div>

        <div className={s.footer}>
          <Button variant="error" style="border" onClick={handleDeletePermission}>
            Delete Permission
          </Button>
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
