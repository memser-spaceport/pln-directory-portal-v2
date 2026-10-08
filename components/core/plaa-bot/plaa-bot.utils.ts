import '@/types/plaa-bot.types';

export const PLAA_BOT_SCRIPT_ID = 'plaa-bot-widget';

const BOT_ACTIVITY_IDS: Record<string, string> = {
  'network-introduction': 'network_introduction',
  'high-value-connector': 'high_value_connector',
  'host-x-space': 'x_space',
  'propose-incentivized-activity': 'propose_activity',
};

interface LoadPlaaBotOptions {
  scriptUrl: string;
  webhookUrl: string;
  configUrl: string;
  clientToken?: string;
}

export function resolvePlaaBotActivityId(portalActivityId: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(BOT_ACTIVITY_IDS, portalActivityId)
    ? BOT_ACTIVITY_IDS[portalActivityId]
    : undefined;
}

function loadScript(src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(PLAA_BOT_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve(existingScript);
        return;
      }

      existingScript.addEventListener('load', () => resolve(existingScript), { once: true });
      existingScript.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = PLAA_BOT_SCRIPT_ID;
    script.src = src;
    script.async = true;

    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve(script);
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => {
        script.remove();
        reject(new Error(`Failed to load script: ${src}`));
      },
      { once: true },
    );

    document.body.appendChild(script);
  });
}

export async function loadPlaaBot({
  scriptUrl,
  webhookUrl,
  configUrl,
  clientToken,
}: LoadPlaaBotOptions): Promise<void> {
  const script = await loadScript(scriptUrl);

  if (script.dataset.initialised === 'true') {
    return;
  }

  if (!window.PLAABot) {
    throw new Error('PLAABot is not available after loading the widget script');
  }

  window.PLAABot.init({ webhookUrl, configUrl, clientToken });
  script.dataset.initialised = 'true';
}

export function openPlaaBotForActivity(portalActivityId: string): boolean {
  const activityId = resolvePlaaBotActivityId(portalActivityId);
  const isInitialised = document.getElementById(PLAA_BOT_SCRIPT_ID)?.dataset.initialised === 'true';

  if (!activityId || !isInitialised || !window.PLAABot) {
    return false;
  }

  try {
    Promise.resolve(window.PLAABot.open({ activityId })).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}
