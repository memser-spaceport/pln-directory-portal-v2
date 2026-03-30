'use client';

import { useState } from 'react';
import { MembersTab } from '@/components/page/access-control/MembersTab/MembersTab';
import { RolesTab } from '@/components/page/access-control/RolesTab/RolesTab';
import { PermissionsTab } from '@/components/page/access-control/PermissionsTab/PermissionsTab';
import s from './page.module.scss';

type TabType = 'members' | 'roles' | 'permissions';

export default function AccessControlPage() {
  const [activeTab, setActiveTab] = useState<TabType>('members');

  return (
    <div className={s.root}>
      <div className={s.container}>
        <div className={s.header}>
          <h1 className={s.title}>Access Control</h1>
          <p className={s.subtitle}>Manage roles, permissions, and member access</p>
        </div>

        <div className={s.tabs}>
          <button
            className={`${s.tab} ${activeTab === 'members' ? s.active : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          <button
            className={`${s.tab} ${activeTab === 'roles' ? s.active : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            Roles
          </button>
          <button
            className={`${s.tab} ${activeTab === 'permissions' ? s.active : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permissions
          </button>
        </div>

        <div className={s.content}>
          {activeTab === 'members' && <MembersTab />}
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'permissions' && <PermissionsTab />}
        </div>
      </div>
    </div>
  );
}
