export function getContactLogoByProvider(provider: string): string {
  switch (provider) {
    case 'linkedin': {
      return '/icons/contact/linkedIn-contact-logo.svg';
    }
    case 'discord': {
      return '/icons/contact/discord-contact-logo.svg';
    }
    case 'email': {
      return '/icons/contact/email-contact-logo.svg';
    }
    case 'github': {
      return '/icons/contact/github-contact-logo.svg';
    }
    case 'team': {
      return '/icons/contact/team-contact-logo.svg';
    }
    case 'telegram': {
      return '/icons/contact/telegram-contact-logo.svg';
    }
    case 'twitter': {
      return '/icons/contact/twitter-contact-logo.svg';
    }
    default: {
      return '/icons/contact/website-contact-logo.svg';
    }
  }
}
