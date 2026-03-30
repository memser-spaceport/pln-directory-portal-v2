'use client';

import { useState, useMemo } from 'react';
import { rbacService, Role } from '@/services/rbac/rbac-mock-service';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/form/Input/Input';
import { ManageRoleModal } from '../modals/ManageRoleModal';
import s from './RolesTab.module.scss';

export function RolesTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const roles = useMemo(() => {
    return rbacService.getRoles();
  }, [refreshKey]);

  const permissions = useMemo(() => rbacService.getPermissions(), []);

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    rbacService.createRole(newRoleName.trim(), newRoleDescription.trim());
    setNewRoleName('');
    setNewRoleDescription('');
    setIsCreateModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleManageClick = (role: Role) => {
    setSelectedRole(role);
    setIsManageModalOpen(true);
  };

  const handleManageModalClose = () => {
    setIsManageModalOpen(false);
    setSelectedRole(null);
    setRefreshKey((k) => k + 1);
  };

  const getPermissionCount = (permissionIds: string[]) => {
    return permissionIds.length;
  };

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <Button
          variant="primary"
          style="fill"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <span className={s.buttonContent}>
            <PlusIcon /> Create Role
          </span>
        </Button>
      </div>

      <div className={s.tableContainer}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Permission Count</th>
              <th className={s.actionCol}>Action</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>
                  <span className={s.roleName}>{role.name}</span>
                </td>
                <td>
                  <span className={s.description}>{role.description || '-'}</span>
                </td>
                <td>
                  <span className={s.permissionCount}>
                    {getPermissionCount(role.permissionIds)} permissions
                  </span>
                </td>
                <td>
                  <Button
                    size="s"
                    style="border"
                    variant="neutral"
                    onClick={() => handleManageClick(role)}
                  >
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className={s.emptyState}>
                  No roles defined.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div className={s.createModal}>
          <h2 className={s.createModalTitle}>Create New Role</h2>
          <div className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Role Name *</label>
              <Input
                placeholder="Enter role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Description</label>
              <Input
                as="textarea"
                placeholder="Enter role description"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription((e.target as HTMLTextAreaElement).value)}
              />
            </div>
          </div>
          <div className={s.modalFooter}>
            <Button variant="neutral" style="border" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              style="fill"
              onClick={handleCreateRole}
              disabled={!newRoleName.trim()}
            >
              Create Role
            </Button>
          </div>
        </div>
      </Modal>

      <ManageRoleModal
        isOpen={isManageModalOpen}
        onClose={handleManageModalClose}
        role={selectedRole}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 3V13M3 8H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
