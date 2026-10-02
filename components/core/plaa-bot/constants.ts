export const PLAA_BOT_SCRIPT_URL = '/plaa-bot/plaa-bot-widget.min.js';
export const PLAA_BOT_CONFIG_URL = '/plaa-bot/activities.json';

export const PLAA_BOT_WEBHOOK_URL = process.env.NEXT_PUBLIC_PLAA_BOT_WEBHOOK_URL ?? '';
export const PLAA_BOT_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PLAA_BOT_CLIENT_TOKEN ?? '';

export const isPlaaBotEnabled = process.env.NEXT_PUBLIC_PLAA_BOT_ENABLED === 'true' && PLAA_BOT_WEBHOOK_URL !== '';

export const PLAA_BOT_ANALYTICS_TARGET = 'plaa-bot';
