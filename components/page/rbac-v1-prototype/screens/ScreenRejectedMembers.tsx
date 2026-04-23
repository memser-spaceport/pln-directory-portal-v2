'use client';
import { useState } from 'react';
import { RBACMember, RBAC_POLICIES } from '../rbac-mock-data';
import s from './rbac-screens.module.scss';
import { MemberForm, EMPTY_FORM, MemberModal } from './MemberModal';

interface Props {
  members: RBACMember[];
  onRestore: (memberId: string) => void;
}

export function ScreenRejectedMembers({ members, onRestore }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);

  function openEdit(memberId: string) {
    const m = members.find((x) => x.id === memberId);
    if (!m) return;

    const existingPolicies = RBAC_POLICIES.filter((p) => (m.policyIds ?? []).includes(p.id));
    setForm({
      ...EMPTY_FORM,
      name: m.name,
      email: m.email,
      team: m.team ?? '',
      status: 'pending',
      selectedRoles: [...new Set(existingPolicies.map((p) => p.role))],
      selectedGroups: [...new Set(existingPolicies.map((p) => p.group))],
      policyIds: m.policyIds ?? [],
    });
    setEditingId(memberId);
  }

  function closeModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function saveModal() {
    if (editingId) onRestore(editingId);
    closeModal();
  }

  const editingMember = members.find((m) => m.id === editingId);

  return (
    <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead className={s.tableHead}>
            <tr>
              <th className={s.thCell}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Member
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5 }}>
                    <path d="M8 3.5V12.5M8 3.5L5.5 6M8 3.5L10.5 6M8 12.5L5.5 10M8 12.5L10.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </th>
              <th className={s.thCell}>Team/Project</th>
              <th className={s.thCell} style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>
                    No rejected members
                  </p>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                    Members rejected from the Members tab will appear here.
                  </p>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className={s.tableRow}>
                  <td className={s.tdCell}>
                    <div className={s.memberCell}>
                      <div className={s.memberInfo}>
                        <img src={member.avatar} alt={member.name} className={s.memberAvatar} />
                        <div className={s.memberText}>
                          <p className={s.memberName}>{member.name}</p>
                          <p className={s.memberEmail}>{member.email}</p>
                        </div>
                      </div>
                      <svg className={s.memberArrow} viewBox="0 0 16 16" fill="none">
                        <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </td>

                  <td className={s.tdCell}>
                    {member.team === '—' || !member.team ? (
                      <span className={s.emDash}>—</span>
                    ) : (
                      <span className={s.teamChip}>
                        <svg className={s.teamChipIcon} viewBox="0 0 16 16" fill="none">
                          <path d="M10.667 14v-1.333A2.667 2.667 0 0 0 8 10H3.333a2.667 2.667 0 0 0-2.666 2.667V14M12.667 5.333a2.667 2.667 0 0 1 0 5.334M14.667 14v-1.334a2.667 2.667 0 0 0-2-2.58M5.667 7.333a2.667 2.667 0 1 0 0-5.333 2.667 2.667 0 0 0 0 5.333Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {member.team}
                      </span>
                    )}
                  </td>

                  <td className={s.tdCell}>
                    <div className={s.actionsCell} style={{ justifyContent: 'flex-end' }}>
                      <button className={s.actionBtn} onClick={() => openEdit(member.id)}>
                        <svg className={s.actionBtnIcon} viewBox="0 0 14 14" fill="none">
                          <path d="M9.917 1.458a1.458 1.458 0 1 1 2.062 2.061L4.375 11.125l-2.708.583.583-2.708 7.667-7.542Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className={s.actionBtnLabel}>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingId && editingMember && (
        <MemberModal
          mode="edit"
          form={form}
          avatar={editingMember.avatar}
          onFormChange={setForm}
          onSave={saveModal}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
