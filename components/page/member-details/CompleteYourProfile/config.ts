export const STEP_CONFIG: Record<string, { label: string }> = {
  verify_linkedIn: { label: 'Verify via LinkedIn' },
  setup_investor_profile: { label: 'Set Up Investor Profile' },
  additional_details: { label: 'Additional details (optional)' },
  notification_preferences: { label: 'Notification preferences' },
};

export const ACTION_CONFIG: Record<string, { label: string; link?: boolean }> = {
  confirm_identity: { label: 'Confirm your identity' },
  update_investor_profile: { label: 'Update Investor profile', link: true },
  update_contact_details: { label: 'Update contact details', link: true },
  add_bio: { label: 'Add bio', link: true },
  add_additional_teams: { label: 'Add additional teams', link: true },
  manage_notifications: { label: 'Manage notifications here', link: true },
};

export function getStepLabel(type: string): string {
  return STEP_CONFIG[type]?.label ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getActionLabel(type: string): string {
  return ACTION_CONFIG[type]?.label ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isActionClickable(type: string): boolean {
  return ACTION_CONFIG[type]?.link ?? false;
}
