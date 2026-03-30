'use client';

import { useState, useMemo } from 'react';
import { rbacService, Permission } from '@/services/rbac/rbac-mock-service';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/form/Input/Input';
import { ManagePermissionModal } from '../modals/ManagePermissionModal';
import s from './PermissionsTab.module.scss';

export function PermissionsTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const permissions = useMemo(() => {
    return rbacService.getPermissions();
  }, [refreshKey]);

  const handleCreatePermission = () => {
    if (!newCode.trim()) return;
    rbacService.createPermission(newCode.trim(), newDescription.trim());
    setNewCode('');
    setNewDescription('');
    setIsCreateModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleManageClick = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsManageModalOpen(true);
  };

  const handleManageModalClose = () => {
    setIsManageModalOpen(false);
    setSelectedPermission(null);
    setRefreshKey((k) => k + 1);
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
            <PlusIcon /> Create Permission
          </span>
        </Button>
      </div>

      <div className={s.tableContainer}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th className={s.actionCol}>Action</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.id}>
                <td>
                  <span className={s.permissionCode}>{permission.code}</span>
                </td>
                <td>
                  <span className={s.description}>{permission.description || '-'}</span>
                </td>
                <td>
                  <Button
                    size="s"
                    style="border"
                    variant="neutral"
                    onClick={() => handleManageClick(permission)}
                  >
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
            {permissions.length === 0 && (
              <tr>
                <td colSpan={3} className={s.emptyState}>
                  No permissions defined.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div className={s.createModal}>
          <h2 className={s.createModalTitle}>Create New Permission</h2>
          <div className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Permission Code *</label>
              <Input
                placeholder="e.g., CustomPermission"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Description</label>
              <Input
                as="textarea"
                placeholder="Enter permission description"
                value={newDescription}
                onChange={(e) => setNewDescription((e.target as HTMLTextAreaElement).value)}
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
              onClick={handleCreatePermission}
              disabled={!newCode.trim()}
            >
              Create Permission
            </Button>
          </div>
        </div>
      </Modal>

      <ManagePermissionModal
        isOpen={isManageModalOpen}
        onClose={handleManageModalClose}
        permission={selectedPermission}
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
