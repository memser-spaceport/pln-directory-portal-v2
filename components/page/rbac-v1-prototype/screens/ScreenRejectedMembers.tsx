'use client';
import { RBACMember } from '../rbac-mock-data';
import s from './rbac-screens.module.scss';

interface Props {
  members: RBACMember[];
  onRestore: (memberId: string) => void;
}

export function ScreenRejectedMembers({ members, onRestore }: Props) {
  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {members.length === 0 ? (
        <div className={s.tableWrap} style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: '0 0 6px' }}>
            No rejected members
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Members rejected from the Members tab will appear here.
          </p>
        </div>
      ) : (
        <>
          <p className={s.warningNote}>
            Rejected members cannot log in or access any PL Network resources. Use Restore to re-instate a member for re-review.
          </p>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead className={s.tableHead}>
                <tr>
                  <th className={s.thCell} style={{ width: 220 }}>Member</th>
                  <th className={s.thCell} style={{ width: 160 }}>Team / Project</th>
                  <th className={s.thCell} style={{ width: 120 }}>Status</th>
                  <th className={s.thCell} style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className={s.tableRow} style={{ background: '#fff8f8' }}>
                    <td className={s.tdCell}>
                      <div className={s.memberCell}>
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className={s.memberAvatar}
                          style={{ opacity: 0.6 }}
                        />
                        <div>
                          <p className={s.memberName} style={{ color: '#64748b' }}>{member.name}</p>
                          <p className={s.memberEmail}>{member.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className={s.tdCell}>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{member.team}</span>
                    </td>

                    <td className={s.tdCell}>
                      <span
                        className={s.levelBadge}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                        }}
                      >
                        <span className={s.levelDot} style={{ background: '#dc2626' }} />
                        Rejected
                      </span>
                    </td>

                    <td className={s.tdCell}>
                      <button
                        className={s.btnSecondary}
                        style={{ fontSize: 12, padding: '5px 12px' }}
                        onClick={() => onRestore(member.id)}
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
            {members.length} rejected member{members.length !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}
