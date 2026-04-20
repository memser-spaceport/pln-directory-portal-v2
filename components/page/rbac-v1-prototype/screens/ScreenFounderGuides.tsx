'use client';
import { useState } from 'react';
import s from './rbac-screens.module.scss';

type VisibilityOption = 'plvs' | 'plcc' | 'all';

const VISIBILITY_OPTIONS: Array<{
  id: VisibilityOption;
  title: string;
  desc: string;
  audience: string;
  permission: string;
}> = [
  {
    id: 'plvs',
    title: 'PLVS founders only',
    desc: 'Visible to founders accepted into the PLVS accelerator cohort. Not visible to PLC Crypto, Neuro, or general members.',
    audience: 'Founder — PLC PLVS policy holders',
    permission: 'founder_guides.view.plvs',
  },
  {
    id: 'plcc',
    title: 'PLC Crypto founders only',
    desc: 'Visible to founders in PLC Crypto and Neuro cohorts. Not visible to PLVS-only founders.',
    audience: 'Founder — PLC Crypto + Neuro policy holders',
    permission: 'founder_guides.view.plcc',
  },
  {
    id: 'all',
    title: 'All founders',
    desc: 'Visible to all founders with any active Founder policy, including PLVS, Crypto, Forge, and Neuro cohorts.',
    audience: 'All Founder policy holders',
    permission: 'founder_guides.view.all',
  },
];

const GUIDE_CATEGORIES = [
  'Fundraising',
  'Go-to-Market',
  'Product',
  'Tokenomics',
  'Legal & Compliance',
  'Team Building',
  'Protocol Design',
];

export function ScreenFounderGuides() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<VisibilityOption | null>(null);
  const [showPermissionHints, setShowPermissionHints] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!title || !visibility) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const selectedOption = VISIBILITY_OPTIONS.find((o) => o.id === visibility);

  return (
    <div className={s.screenBg}>
      <div className={s.formLayout}>
        {/* Header */}
        <div className={s.pageHeader}>
          <div className={s.pageHeaderLeft}>
            <h1 className={s.pageTitle}>Create Founder Guide</h1>
            <p className={s.pageSubtitle}>
              Admin interface — set visibility to control which founders can see this guide.
            </p>
          </div>
        </div>

        {saved && (
          <p className={s.successNote}>
            Guide saved successfully. Visibility has been applied based on the selected permission scope.
          </p>
        )}

        {/* Basic info (muted — demo context) */}
        <div className={s.formCard}>
          <p className={s.formCardTitle}>Guide details</p>
          <div className={s.formField}>
            <label className={s.formLabel}>Title</label>
            <input
              type="text"
              className={s.formInput}
              placeholder="e.g. How to pitch your protocol to Series A investors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={s.formField}>
            <label className={s.formLabel}>Summary</label>
            <textarea
              className={s.formTextarea}
              placeholder="A short description of what this guide covers…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className={s.formField}>
            <label className={s.formLabel}>Category</label>
            <select
              className={s.filterSelect}
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8 }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category…</option>
              {GUIDE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content sections (greyed out for demo) */}
        <div className={`${s.formCard} ${s.formSectionMuted}`}>
          <p className={s.formCardTitle}>Content</p>
          <div className={s.formField}>
            <label className={s.formLabel}>Body</label>
            <div
              style={{
                height: 120,
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>Rich text editor (mocked)</span>
            </div>
          </div>
          <div className={s.formField}>
            <label className={s.formLabel}>Attachments</label>
            <div
              style={{
                height: 60,
                border: '1.5px dashed #e2e8f0',
                borderRadius: 8,
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>Drop files here (mocked)</span>
            </div>
          </div>
          <p className={s.formMutedLabel}>Content fields are mocked — this prototype focuses on the visibility section below.</p>
        </div>

        {/* Visibility — key focus area */}
        <div className={s.formCard} style={{ borderColor: '#c7d2fe' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p className={s.formCardTitle} style={{ color: '#1b4dff' }}>Visibility</p>
              <p className={s.formCardSubtitle}>
                Choose which founders can see this guide. Access is controlled by fine-grained permissions —
                no manual member lists required.
              </p>
            </div>
            <button
              className={s.btnGhost}
              onClick={() => setShowPermissionHints(!showPermissionHints)}
            >
              {showPermissionHints ? 'Hide' : 'Show'} permission strings
            </button>
          </div>

          <div className={s.visibilityOptions}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const isSelected = visibility === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`${s.visibilityOption} ${isSelected ? s.visibilityOptionSelected : ''}`}
                  onClick={() => setVisibility(opt.id)}
                >
                  <div className={`${s.visibilityRadio} ${isSelected ? s.visibilityRadioSelected : ''}`}>
                    {isSelected && <div className={s.visibilityRadioDot} />}
                  </div>
                  <div className={s.visibilityOptionContent}>
                    <p className={s.visibilityOptionTitle}>{opt.title}</p>
                    <p className={s.visibilityOptionDesc}>{opt.desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      <span className={s.tagGray}>{opt.audience}</span>
                      {showPermissionHints && (
                        <span className={s.permissionHint}>
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="2" width="12" height="12" rx="2" stroke="#94a3b8" strokeWidth="1.4" />
                            <path d="M5 8h6M5 11h4" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
                          </svg>
                          {opt.permission}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibility === 'all' && (
            <p className={s.warningNote}>
              This guide will be visible to <strong>all founders</strong> with any active Founder policy —
              including PLVS, Crypto, Neuro, and Forge cohorts. Make sure the content is suitable for all groups.
            </p>
          )}

          {visibility && (
            <div className={s.successNote}>
              {selectedOption && (
                <>
                  <strong>Visibility set:</strong> {selectedOption.title}.{' '}
                  Members with the <em>{selectedOption.permission}</em> permission will have read access to this guide.
                </>
              )}
            </div>
          )}
        </div>

        {/* Attribution (muted) */}
        <div className={`${s.formCard} ${s.formSectionMuted}`}>
          <p className={s.formCardTitle}>Attribution</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className={s.formField} style={{ flex: 1 }}>
              <label className={s.formLabel}>Author</label>
              <input type="text" className={s.formInput} placeholder="Name or team" />
            </div>
            <div className={s.formField} style={{ flex: 1 }}>
              <label className={s.formLabel}>Published date</label>
              <input type="date" className={s.formInput} />
            </div>
          </div>
          <p className={s.formMutedLabel}>Attribution fields are mocked for prototype purposes.</p>
        </div>

        {/* Footer */}
        <div className={s.formFooter}>
          <button className={s.btnSecondary}>Save as draft</button>
          <button
            className={s.btnPrimary}
            disabled={!title || !visibility}
            onClick={handleSave}
          >
            Publish guide
          </button>
        </div>

        {/* Reference section */}
        <div className={s.helperNote} style={{ marginTop: 8 }}>
          <strong>How visibility works:</strong> Each founder&apos;s policy grants a specific permission like{' '}
          <code style={{ background: '#1e293b', color: '#94a3b8', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontFamily: 'monospace' }}>
            founder_guides.view.plvs
          </code>.{' '}
          Guides are only shown to members whose effective permissions include the required visibility scope.
          Admins set visibility here; members never see the permission strings.
        </div>
      </div>
    </div>
  );
}
