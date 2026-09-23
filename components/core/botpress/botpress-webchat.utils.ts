export const BOTPRESS_INJECT_SCRIPT_ID = 'botpress-webchat-inject';
export const BOTPRESS_CONFIG_SCRIPT_ID = 'botpress-webchat-config';

// webchat v3 renders a class and no id; the id selectors below are v2's and
// match nothing on v3, which is what let the widget survive unmount.
const BOTPRESS_WIDGET_SELECTORS = [
  '.bpChatContainer',
  '#bp-web-widget-container',
  '#bp-web-widget',
  '[id^="bp-web-widget"]',
];

interface LoadScriptOptions {
  id: string;
  defer?: boolean;
}

function loadScript(src: string, { id, defer = false }: LoadScriptOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;

    if (defer) {
      script.defer = true;
    }

    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true },
    );
    script.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });

    document.body.appendChild(script);
  });
}

export async function loadBotpressWebchat(injectScriptUrl: string, configScriptUrl: string): Promise<void> {
  await loadScript(injectScriptUrl, { id: BOTPRESS_INJECT_SCRIPT_ID });
  await loadScript(configScriptUrl, { id: BOTPRESS_CONFIG_SCRIPT_ID, defer: true });
}

export function removeBotpressWebchatWidget(): number {
  let removed = 0;

  BOTPRESS_WIDGET_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.remove();
      removed += 1;
    });
  });

  return removed;
}

export function unloadBotpressWebchat(): void {
  const wasInitialised = 'botpress' in window;
  const removed = removeBotpressWebchatWidget();

  document.getElementById(BOTPRESS_INJECT_SCRIPT_ID)?.remove();
  document.getElementById(BOTPRESS_CONFIG_SCRIPT_ID)?.remove();

  if ('botpress' in window) {
    delete window.botpress;
  }

  // Removing nothing from an initialised widget means the selectors no longer
  // match what the vendor renders, and the widget is now orphaned on the page.
  if (wasInitialised && removed === 0) {
    console.warn('[BotpressWebchat] unload removed the scripts but no widget node matched; check BOTPRESS_WIDGET_SELECTORS against the loaded webchat version.');
  }
}
