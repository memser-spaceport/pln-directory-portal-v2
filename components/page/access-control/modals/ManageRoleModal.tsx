'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/form/Input/Input';
import { rbacService, Role, Permission } from '@/services/rbac/rbac-mock-service';
import s from './ManageRoleModal.module.scss';

interface ManageRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

export function ManageRoleModal({ isOpen, onClose, role }: ManageRoleModalProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [roleData, setRoleData] = useState<Role | null>(role);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('');

  useEffect(() => {
    if (role) {
      const freshRole = rbacService.getRoleById(role.id);
      const currentRole = freshRole || role;
      setRoleData(currentRole);
      setName(currentRole.name);
      setDescription(currentRole.description);
    }
  }, [role, isOpen, refreshKey]);

  const permissions = useMemo(() => rbacService.getPermissions(), []);

  const assignedPermissions = useMemo(() => {
    if (!roleData) return [];
    return permissions.filter((p) => roleData.permissionIds.includes(p.id));
  }, [roleData, permissions]);

  const availablePermissions = useMemo(() => {
    if (!roleData) return [];
    return permissions.filter(
      (p) =>
        !roleData.permissionIds.includes(p.id) &&
        (p.code.toLowerCase().includes(permissionSearchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(permissionSearchQuery.toLowerCase()))
    );
  }, [roleData, permissions, permissionSearchQuery]);

  const handleSave = () => {
    if (!roleData || !name.trim()) return;
    rbacService.updateRole(roleData.id, {
      name: name.trim(),
      description: description.trim(),
    });
    setRefreshKey((k) => k + 1);
  };

  const handleAddPermission = (permissionId: string) => {
    if (!roleData) return;
    rbacService.addPermissionToRole(roleData.id, permissionId);
    // Update local state immediately for UI responsiveness
    setRoleData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        permissionIds: [...prev.permissionIds, permissionId],
      };
    });
    setRefreshKey((k) => k + 1);
  };

  const handleRemovePermission = (permissionId: string) => {
    if (!roleData) return;
    rbacService.removePermissionFromRole(roleData.id, permissionId);
    // Update local state immediately for UI responsiveness
    setRoleData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        permissionIds: prev.permissionIds.filter((id) => id !== permissionId),
      };
    });
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteRole = () => {
    if (!roleData) return;
    if (confirm(`Are you sure you want to delete the role "${roleData.name}"?`)) {
      rbacService.deleteRole(roleData.id);
      onClose();
    }
  };

  if (!roleData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
      <div className={s.root}>
        <div className={s.header}>
          <h2 className={s.title}>Manage Role</h2>
        </div>

        <div className={s.section}>
          <h3 className={s.sectionTitle}>Role Details</h3>
          <div className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Role Name *</label>
              <Input
                placeholder="Enter role name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Description</label>
              <Input
                as="textarea"
                placeholder="Enter role description"
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
                disabled={!name.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <div className={s.section}>
          <h3 className={s.sectionTitle}>
            Assigned Permissions ({assignedPermissions.length})
          </h3>
          <div className={s.permissionsList}>
            {assignedPermissions.map((permission) => (
              <div key={permission.id} className={s.permissionItem}>
                <div className={s.permissionInfo}>
                  <span className={s.permissionCode}>{permission.code}</span>
                  <span className={s.permissionDescription}>{permission.description}</span>
                </div>
                <button
                  className={s.removeBtn}
                  onClick={() => handleRemovePermission(permission.id)}
                  aria-label={`Remove ${permission.code}`}
                >
                  <XIcon />
                </button>
              </div>
            ))}
            {assignedPermissions.length === 0 && (
              <span className={s.noItems}>No permissions assigned to this role</span>
            )}
          </div>

          <div className={s.addSection}>
            <Input
              placeholder="Search permissions to add..."
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
                      handleAddPermission(permission.id);
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
          <Button variant="error" style="border" onClick={handleDeleteRole}>
            Delete Role
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
