'use client';

// The AI App setup card (production AiAppDetailPage `needsSetup` branch,
// rendered with its real SCSS) with the proposed secret-key states:
// stored value → locked field + Edit, Deploy → Re-deploy.

import { useState } from 'react';
import clsx from 'clsx';

import detail from '@/components/page/ai-apps/AiAppDetailPage/AiAppDetailPage.module.scss';
import s from './AiAppsSecrets.module.scss';

import { AppSecretsPanelMock } from './AppSecretsPanelMock';
import { secretScenarios, type MockSecretsApp } from './mocks';

const SETUP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  DEPLOYING: 'Deploying',
  ERROR: 'Deploy failed',
};

export default function AiAppsSecretsPrototype() {
  const [scenarioKey, setScenarioKey] = useState(secretScenarios[1].key);
  const [app, setApp] = useState<MockSecretsApp>(secretScenarios[1]);

  const selectScenario = (scenario: MockSecretsApp) => {
    setScenarioKey(scenario.key);
    setApp(scenario);
  };

  const handleDeployed = (filledVars: string[]) => {
    setApp((prev) => ({
      ...prev,
      status: 'DEPLOYING',
      notes: null,
      providedEnvVars: Array.from(new Set([...prev.providedEnvVars, ...filledVars])),
    }));
  };

  return (
    <div className={detail.setupPage}>
      <div className={s.stage}>
        <div className={s.scenarioBar}>
          {secretScenarios.map((scenario) => (
            <button
              key={scenario.key}
              type="button"
              className={clsx(s.scenarioPill, scenario.key === scenarioKey && s.scenarioPillActive)}
              onClick={() => selectScenario(scenario)}
            >
              {scenario.label}
            </button>
          ))}
        </div>
        <p className={s.scenarioCaption}>{app.caption}</p>

        <div className={detail.setupCard}>
          <div className={detail.setupHeader}>
            <h1 className={detail.setupTitle}>{app.name}</h1>
            <span className={detail.statusBadge} data-status={app.status}>
              {SETUP_STATUS_LABELS[app.status] ?? app.status}
            </span>
          </div>
          <p className={detail.setupDescription}>{app.description}</p>
          {app.status === 'ERROR' && app.notes && <p className={detail.setupError}>Last deploy failed: {app.notes}</p>}
          <AppSecretsPanelMock key={scenarioKey} app={app} onDeployed={handleDeployed} />
        </div>
      </div>
    </div>
  );
}
