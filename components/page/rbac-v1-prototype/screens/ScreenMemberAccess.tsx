'use client';
import { useState } from 'react';
import {
  RBAC_MEMBERS,
  RBAC_POLICIES,
  RBACMember,
  DirectPermission,
  RBACPolicy,
  getPoliciesForMember,
  getEffectiveAccess,
  getAccessExplanations,
  isEligibleForPolicyAssignment,
  getLevelLabel,
  getLevelDescription,
} from '../rbac-mock-data';
import s from './rbac-screens.module.scss';

interface Props {
  memberId: string;
  onBack: () => void;
}

function LevelBadge({ member }: { member: RBACMember }) {
  const isPending = member.level === 'L0';
  const isVerified = member.level === 'L1';
  const badgeClass = isPending ? s.levelBadgePending : isVerified ? s.levelBadgeVerified : s.levelBadgeApproved;
  const dotColor = isPending ? '#94a3b8' : isVerified ? '#d97706' : '#16a34a';
  return (
    <span className={`${s.levelBadge} ${badgeClass}`}>
      <span className={s.levelDot} style={{ background: dotColor }} />
      {getLevelLabel(member.level)}
    </span>
  );
}

function ApprovalFlow({ member, onApprove }: { member: RBACMember; onApprove: () => void }) {
  if (member.approvalState === 'pending') {
    return (
      <div className={`${s.approvalCard} ${s.approvalCardPending}`}>
        <div className={`${s.approvalIcon} ${s.approvalIconPending}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#94a3b8" strokeWidth="1.8" />
            <path d="M12 7v5l3 3" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div className={s.approvalInfo}>
          <p className={s.approvalTitle}>Pending account verification</p>
          <p className={s.approvalDesc}>{getLevelDescription(member.level)}</p>
          <p className={s.helperNote} style={{ marginTop: 6 }}>
            Policy assignment is not available until the member verifies their email and is manually approved.
          </p>
        </div>
      </div>
    );
  }

  if (member.approvalState === 'verified') {
    return (
      <div className={`${s.approvalCard} ${s.approvalCardVerified}`}>
        <div className={`${s.approvalIcon} ${s.approvalIconVerified}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#d97706" strokeWidth="1.8" />
            <path d="M12 8v4" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="#d97706" />
          </svg>
        </div>
        <div className={s.approvalInfo}>
          <p className={s.approvalTitle}>Verified — awaiting manual approval</p>
          <p className={s.approvalDesc}>{getLevelDescription(member.level)}</p>
          <p className={s.warningNote} style={{ marginTop: 6 }}>
            Policy assignment unlocks after approval. Review the member&apos;s profile before approving.
          </p>
          <div className={s.approvalAction}>
            <button className={s.btnPrimary} onClick={onApprove}>
              ✓ Approve member
            </button>
            <button className={s.btnSecondary}>Request more info</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.approvalCard} ${s.approvalCardApproved}`}>
      <div className={`${s.approvalIcon} ${s.approvalIconApproved}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="1.8" />
          <path d="M8 12l3 3 5-5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={s.approvalInfo}>
        <p className={s.approvalTitle}>Approved — eligible for policy assignment</p>
        <p className={s.approvalDesc}>{getLevelDescription(member.level)}</p>
      </div>
    </div>
  );
}

function PolicyCard({
  policy,
  onRemove,
  canRemove,
}: {
  policy: RBACPolicy;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className={s.policyCardFull}>
      <div className={s.policyCardHeader}>
        <div className={s.policyCardLeft}>
          <p className={s.policyCardName}>{policy.name}</p>
          <div className={s.policyCardBadges}>
            <span className={s.roleBadge}>{policy.role}</span>
            <span className={s.groupBadge}>{policy.group}</span>
          </div>
        </div>
        {canRemove && (
          <button className={s.btnDanger} onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <p className={s.policyCardDesc}>{policy.description}</p>
      <div className={s.policyModuleGrid}>
        {policy.modules.map((m) => (
          <div key={m.module} className={s.moduleChip}>
            <span style={{ fontWeight: 600, color: '#334155', fontSize: 11 }}>{m.module}</span>
            <span className={s.moduleChipAccess}>{m.access.join(', ')}</span>
            {m.note && <span className={s.moduleNote}>({m.note})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScreenMemberAccess({ memberId, onBack }: Props) {
  const baseMember = RBAC_MEMBERS.find((m) => m.id === memberId);

  const [approvalState, setApprovalState] = useState(baseMember?.approvalState ?? 'pending');
  const [assignedPolicyIds, setAssignedPolicyIds] = useState<string[]>(baseMember?.assignedPolicyIds ?? []);
  const [directPerms, setDirectPerms] = useState<DirectPermission[]>(baseMember?.directPermissions ?? []);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showDirectPerms, setShowDirectPerms] = useState(directPerms.length > 0);
  const [newPermInput, setNewPermInput] = useState('');
  const [showAddPermInput, setShowAddPermInput] = useState(false);

  if (!baseMember) {
    return (
      <div className={s.screenBg}>
        <div className={s.pageWrap}>
          <p className={s.helperNote}>Member not found.</p>
        </div>
      </div>
    );
  }

  const member: RBACMember = { ...baseMember, approvalState, assignedPolicyIds, directPermissions: directPerms };

  const assignedPolicies = getPoliciesForMember(member);
  const effectiveAccess = getEffectiveAccess(assignedPolicies, directPerms);
  const explanations = getAccessExplanations(assignedPolicies, directPerms);
  const eligible = approvalState === 'approved';

  const availablePolicies = RBAC_POLICIES.filter((p) => !assignedPolicyIds.includes(p.id));

  const removePolicy = (policyId: string) => {
    setAssignedPolicyIds((prev) => prev.filter((id) => id !== policyId));
  };

  const addPolicy = (policyId: string) => {
    setAssignedPolicyIds((prev) => [...prev, policyId]);
    setShowAddPolicy(false);
  };

  const removeDirectPerm = (permId: string) => {
    setDirectPerms((prev) => prev.filter((p) => p.id !== permId));
  };

  const addDirectPerm = () => {
    if (!newPermInput.trim()) return;
    const newPerm: DirectPermission = {
      id: `dp-${Date.now()}`,
      permission: newPermInput.trim(),
      label: newPermInput.trim(),
      addedBy: 'You (prototype)',
      addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      reason: 'Added via prototype UI',
    };
    setDirectPerms((prev) => [...prev, newPerm]);
    setNewPermInput('');
    setShowAddPermInput(false);
  };

  const approvalStateIsVerified = approvalState === 'verified';
  const level = baseMember.level;
  const isPending = level === 'L0';

  return (
    <div className={s.screenBg}>
      <div className={s.accessLayout}>
        {/* Back */}
        <button className={s.accessBackBtn} onClick={onBack}>
          ← Back to Members
        </button>

        {/* Member context card */}
        <div className={s.accessCard}>
          <div className={s.memberHeaderRow}>
            <div className={s.memberHeaderLeft}>
              <img src={baseMember.avatar} alt={baseMember.name} className={s.memberAvatarLg} />
              <div className={s.memberInfoBlock}>
                <p className={s.memberNameLg}>{baseMember.name}</p>
                <div className={s.memberMetaRow}>
                  <span className={s.memberMetaItem}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M2 8h12M2 12h8" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    {baseMember.email}
                  </span>
                  <span className={s.memberMetaDot}>·</span>
                  <span className={s.memberMetaItem}>{baseMember.team}</span>
                  <span className={s.memberMetaDot}>·</span>
                  <span className={s.memberMetaItem}>{baseMember.role}</span>
                </div>
              </div>
            </div>
            <LevelBadge member={{ ...baseMember, approvalState } as RBACMember} />
          </div>

          {/* Approval flow */}
          <div>
            <p className={s.sectionTitle}>Approval Status</p>
            <ApprovalFlow
              member={{ ...baseMember, approvalState } as RBACMember}
              onApprove={() => setApprovalState('approved')}
            />
          </div>
        </div>

        {/* Assigned Policies */}
        <div className={s.accessCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p className={s.sectionTitle} style={{ marginBottom: 2 }}>Assigned Policies</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Each policy grants a predefined set of roles, groups, and module access.
              </p>
            </div>
            {eligible && (
              <button
                className={s.btnGhost}
                onClick={() => setShowAddPolicy(!showAddPolicy)}
              >
                {showAddPolicy ? '✕ Cancel' : '+ Add policy'}
              </button>
            )}
          </div>

          {!eligible && (
            <p className={isPending ? s.helperNote : s.warningNote}>
              {isPending
                ? 'Policy assignment is locked until the member verifies their account.'
                : 'Approve this member first to enable policy assignment.'}
            </p>
          )}

          {eligible && (
            <>
              <div className={s.policyListGap}>
                {assignedPolicies.length === 0 && !showAddPolicy && (
                  <div className={s.emptyState} style={{ padding: '24px 0' }}>
                    <p className={s.emptyStateTitle}>No policies assigned</p>
                    <p>Add a predefined policy to grant this member access.</p>
                  </div>
                )}
                {assignedPolicies.map((policy) => (
                  <PolicyCard
                    key={policy.id}
                    policy={policy}
                    canRemove={true}
                    onRemove={() => removePolicy(policy.id)}
                  />
                ))}
              </div>

              {showAddPolicy && (
                <div className={s.addPolicyArea}>
                  <div className={s.addPolicyHeader}>
                    <p className={s.addPolicyLabel}>Choose a predefined policy to assign</p>
                  </div>
                  {availablePolicies.length === 0 ? (
                    <p className={s.helperNote}>All policies are already assigned to this member.</p>
                  ) : (
                    <div className={s.addPolicyDropdown}>
                      {availablePolicies.map((p) => (
                        <div
                          key={p.id}
                          className={s.addPolicyOption}
                          onClick={() => addPolicy(p.id)}
                        >
                          <div className={s.addPolicyOptionInfo}>
                            <span className={s.addPolicyOptionName}>{p.name}</span>
                            <span className={s.addPolicyOptionMeta}>
                              {p.role} · {p.group} · {p.modules.length} modules
                            </span>
                          </div>
                          <span className={s.tagBlue}>Assign</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Effective Access */}
        {eligible && assignedPolicies.length > 0 && (
          <div className={s.accessCard}>
            <p className={s.sectionTitle}>Effective Access</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: '-8px 0 6px' }}>
              Union of all assigned policy permissions. This is what the member can actually do.
            </p>
            <div className={s.effectiveTable}>
              {effectiveAccess.map((row) => (
                <div key={row.module} className={s.effectiveRow}>
                  <div className={s.effectiveModuleCell}>{row.module}</div>
                  <div className={s.effectiveAccessCell}>
                    {row.access.map((a) => (
                      <span key={a} className={s.accessBadge}>{a}</span>
                    ))}
                  </div>
                  {row.note && <div className={s.effectiveNoteCell}>{row.note}</div>}
                </div>
              ))}
              {directPerms.length > 0 && (
                <div className={`${s.effectiveRow} ${s.effectiveRowDirect}`}>
                  <div className={s.effectiveModuleCell} style={{ color: '#c2410c', fontStyle: 'italic' }}>
                    Direct exceptions
                  </div>
                  <div className={s.effectiveAccessCell}>
                    {directPerms.map((dp) => (
                      <span key={dp.id} className={`${s.accessBadge} ${s.accessBadgeDirect}`}>
                        {dp.label}
                      </span>
                    ))}
                  </div>
                  <div className={s.effectiveNoteCell} style={{ color: '#c2410c' }}>not from a policy</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Access Explanation */}
        {eligible && explanations.length > 0 && (
          <div className={s.accessCard}>
            <p className={s.sectionTitle}>Access Explanation</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: '-8px 0 6px' }}>
              Where each permission comes from — policy inheritance vs direct exceptions.
            </p>
            <div className={s.explanationList}>
              {explanations.map((item, idx) => (
                <div
                  key={idx}
                  className={`${s.explanationItem} ${item.isException ? s.explanationItemException : ''}`}
                >
                  <span className={`${s.explanationDot} ${item.isException ? s.explanationDotException : ''}`} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Direct Permissions (collapsible, de-emphasized) */}
        {eligible && (
          <div className={s.accessCard} style={{ borderColor: directPerms.length > 0 ? '#fed7aa' : '#e2e8f0' }}>
            <div className={s.collapsibleToggle} onClick={() => setShowDirectPerms(!showDirectPerms)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <p className={s.sectionTitleInline}>
                  Direct Permissions (Exceptions)
                  {directPerms.length > 0 && (
                    <span className={s.exceptionBadge} style={{ marginLeft: 10 }}>
                      ⚠ {directPerms.length} exception{directPerms.length > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                  Advanced: permissions granted directly to this member, not inherited from a policy.
                </p>
              </div>
              <span className={`${s.collapsibleIcon} ${showDirectPerms ? s.collapsibleIconOpen : ''}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>

            {showDirectPerms && (
              <>
                <p className={s.warningNote}>
                  Direct permissions bypass the policy model. Use sparingly and document the reason.
                  Remove when the underlying need is addressed through a proper policy.
                </p>

                <div className={s.directPermList}>
                  {directPerms.length === 0 ? (
                    <p className={s.emptyDirectPerms}>No direct exceptions for this member.</p>
                  ) : (
                    directPerms.map((dp) => (
                      <div key={dp.id} className={s.directPermItem}>
                        <div className={s.directPermHeader}>
                          <div>
                            <p className={s.directPermName}>{dp.permission}</p>
                            <p className={s.directPermLabel}>{dp.label !== dp.permission ? dp.label : ''}</p>
                          </div>
                          <button className={s.btnDanger} onClick={() => removeDirectPerm(dp.id)}>
                            Revoke
                          </button>
                        </div>
                        <div className={s.directPermMeta}>
                          <span>Added by: {dp.addedBy}</span>
                          <span>·</span>
                          <span>{dp.addedAt}</span>
                        </div>
                        {dp.reason && (
                          <p className={s.directPermReason}>&quot;{dp.reason}&quot;</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {!showAddPermInput ? (
                  <button
                    className={s.btnSecondary}
                    style={{ alignSelf: 'flex-start', borderColor: '#fde68a', color: '#92400e' }}
                    onClick={() => setShowAddPermInput(true)}
                  >
                    + Add direct exception
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p className={s.exceptionWarning}>
                      Direct permissions bypass the standard RBAC policy model. Document a reason and prefer assigning a policy instead.
                    </p>
                    <div className={s.addExceptionRow}>
                      <input
                        type="text"
                        className={s.addExceptionInput}
                        placeholder="e.g. founder_guides.admin"
                        value={newPermInput}
                        onChange={(e) => setNewPermInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') addDirectPerm(); }}
                      />
                      <button className={s.btnPrimary} onClick={addDirectPerm} style={{ background: '#ea580c' }}>
                        Grant
                      </button>
                      <button className={s.btnSecondary} onClick={() => { setShowAddPermInput(false); setNewPermInput(''); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
