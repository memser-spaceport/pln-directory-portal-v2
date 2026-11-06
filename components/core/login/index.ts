// Main auth components. The Privy layer (PrivyModals, AuthInfo) is not exported here: whatever imports this barrel
// would then pull the Privy SDK into its bundle, which AuthBox loads only on demand (LAB-3092).
export { AuthBox } from './components/AuthBox';

// Error components
export { AuthInvalidUser } from './components/modals/AuthInvalidUser';
export { LinkAccountModal } from './components/modals/LinkAccountModal';

// Utility components
export { BroadcastChannel, createLogoutChannel, logoutAllTabs } from './components/BroadcastChannel';
export { CookieChecker } from './components/CookieChecker';
export { UserInfoChecker } from './components/UserInfoChecker';
export { UserInfoValidator } from './components/UserInfoValidator';
