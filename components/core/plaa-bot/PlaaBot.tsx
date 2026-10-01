'use client';

import { useEffect } from 'react';

import {
  PLAA_BOT_CLIENT_TOKEN,
  PLAA_BOT_CONFIG_URL,
  PLAA_BOT_SCRIPT_URL,
  PLAA_BOT_WEBHOOK_URL,
  isPlaaBotEnabled,
} from '@/components/core/plaa-bot/constants';
import { loadPlaaBot } from '@/components/core/plaa-bot/plaa-bot.utils';

export function PlaaBot() {
  useEffect(() => {
    if (!isPlaaBotEnabled) {
      return;
    }

    loadPlaaBot({
      scriptUrl: PLAA_BOT_SCRIPT_URL,
      webhookUrl: PLAA_BOT_WEBHOOK_URL,
      configUrl: PLAA_BOT_CONFIG_URL,
      clientToken: PLAA_BOT_CLIENT_TOKEN,
    }).catch((error: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[PlaaBot] Failed to initialize the activity bot', error);
      }
    });
  }, []);

  return null;
}
