export enum RbacQueryKeys {
  RBAC_ME = 'rbac-me',
}

export const PERMISSIONS = {
  GANTRY: {
    PERM_ADMIN: 'roadmap.admin',
    PERM_VIEW: 'roadmap.view',
    PERM_CREATE: 'roadmap.idea.create',
    PERM_UPVOTE: 'roadmap.item.upvote',
    PERM_EDIT_OWN: 'roadmap.item.edit_own',
    PERM_CURATE: 'roadmap.item.curate',
    PERM_TRANSITION: 'roadmap.item.transition',
  },
  FOUNDER_DB: {
    PERM_VIEW: 'founder_db.view',
    PERM_EDIT: 'founder_db.edit',
  },
  INVESTOR_DB: {
    PERM_VIEW: 'investor_db.view',
    PERM_EDIT: 'investor_db.edit',
  },
  AI_APPS: {
    PERM_VIEW: 'ai_apps.read',
  },
  FOUNDER_GUIDE: {
    PERM_VIEW: 'founder_guides.view',
  },
};
