'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

// Reuse the real page styling by importing the production SCSS modules directly,
// so the prototype tracks production when those styles change.
import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
import modal from '@/components/page/ai-apps/AiAppsPage/components/CreateAiAppModal/CreateAiAppModal.module.scss';
import detail from '@/components/page/ai-apps/AiAppDetailPage/AiAppDetailPage.module.scss';
// Gantry "Create new item" modal title style (Inter 20px / 500) — reuse it here.
import dealModal from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';

import {
  createModalIntro,
  createModalSecurityNote,
  createModalSteps,
  mockAiApps,
  mockAppPreviews,
  mockPageCopy,
} from './mocks';

import local from './AiAppsPrototype.module.scss';

// --- Card (copy & simplified from production AiAppCard: swap the <Link> to a route
// for an onSelect handler so navigation stays inside the prototype) ---
function AiAppCard({ app, onSelect }: { app: AiApp; onSelect: () => void }) {
  return (
    <button type="button" className={local.appCard} onClick={onSelect}>
      <div className={local.appCardTop}>
        <h3 className={local.appCardName}>{app.name}</h3>
        <p className={local.appCardDesc}>{app.description}</p>
      </div>
      <div className={local.appCardMeta}>
        <div className={local.appCardCreator}>
          <img className={local.appCardAvatar} src={getDefaultAvatar(app.member.name)} alt="" width={20} height={20} />
          <span className={local.appCardCreatorTitle}>by</span>
          <span className={local.appCardCreatorName}>{app.member.name}</span>
        </div>
        <p className={local.appCardDeployed}>Deployed {new Date(app.createdAt).toLocaleDateString()}</p>
      </div>
    </button>
  );
}

// --- Add card (mirrors the production Projects "Add Project" card; opens the
// Create modal instead of routing) ---
function AddAiAppCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={local.addCard} onClick={onClick}>
      <img className={local.addCardIcon} src="/icons/add.svg" alt="" />
      <p className={local.addCardTitle}>Create your app</p>
      <p className={local.addCardText}>Start building your app here</p>
    </button>
  );
}

// Close (X) icon, mirroring the production TeamNewsModal.
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// --- Create modal (copy & simplified: drop the authed starter-kit download) ---
function CreateAiAppModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={local.modalWide}>
      <div className={`${modal.content} ${local.modalContent}`}>
        <div className={`${modal.header} ${local.modalHeaderFixed}`}>
          <h2 className={dealModal.title}>Create AI App</h2>
          <button type="button" className={local.modalClose} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={`${modal.body} ${local.modalBodyScroll}`}>
          <div className={local.guideHeader}>
            <p className={local.stepsHeading}>Step-by-Step Guide</p>
            <p className={local.modalIntro}>{createModalIntro}</p>
          </div>
          <ol className={modal.steps}>
            {createModalSteps.map((step, i) => (
              <li key={i}>
                <strong>{step.title}:</strong> {step.description}
              </li>
            ))}
          </ol>
        </div>

        <div className={`${modal.footer} ${local.modalFooterFixed}`}>
          <div className={local.securityNote}>
            <img className={local.securityNoteIcon} src="/icons/lock-grey.svg" alt="" />
            <p className={local.securityNoteText}>{createModalSecurityNote}</p>
          </div>
          <div className={local.footerActions}>
            <Button size="s" style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            {/* Prototype: no real download — just acknowledge the action */}
            <Button size="s" onClick={() => alert('Prototype: starter kit download is mocked.')}>
              Download Starter Kit
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// --- Detail view (copy & simplified from AiAppDetailPage: mock iframe via srcDoc,
// "Open in New Tab" is mocked, plus a back action to return to the grid) ---
function AiAppDetail({ app, onBack }: { app: AiApp; onBack: () => void }) {
  return (
    <div className={detail.root}>
      <div className={detail.header}>
        <div className={detail.titleBlock}>
          <Button style="link" variant="primary" size="s" className={local.backButton} onClick={onBack}>
            ← All AI Apps
          </Button>
          <h1 className={detail.name}>{app.name}</h1>
          {app.description && <p className={detail.description}>{app.description}</p>}
          <p className={detail.author}>
            By <span>{app.member.name}</span>
          </p>
        </div>
        <div className={detail.actions}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Prototype: would open the deployed app in a new tab.');
            }}
            className={detail.openButton}
          >
            Open in New Tab ↗
          </a>
        </div>
      </div>

      <div className={detail.iframeContainer}>
        <iframe className={detail.iframe} srcDoc={mockAppPreviews[app.uid]} title={app.name} allow="fullscreen" />
      </div>
    </div>
  );
}

export default function AiAppsPrototype() {
  const [apps] = useState<AiApp[]>(mockAiApps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const selected = apps.find((a) => a.uid === selectedUid) ?? null;

  if (selected) {
    return <AiAppDetail app={selected} onBack={() => setSelectedUid(null)} />;
  }

  // Full-width Projects-style content frame (#f1f5f9 + matching paddings), no
  // filter rail.
  return (
    <div className={local.root}>
      <div className={local.content}>
        <div className={page.header}>
          <div className={page.titleBlock}>
            <h1 className={local.pageTitle}>{mockPageCopy.title}</h1>
            <p className={page.description}>{mockPageCopy.description}</p>
          </div>
        </div>

        {apps.length === 0 ? (
          <EmptyState title="No apps yet" description="Create your first AI app to get started." />
        ) : (
          <div className={local.grid}>
            <AddAiAppCard onClick={() => setIsModalOpen(true)} />
            {apps.map((app) => (
              <AiAppCard key={app.uid} app={app} onSelect={() => setSelectedUid(app.uid)} />
            ))}
          </div>
        )}

        <CreateAiAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
}
