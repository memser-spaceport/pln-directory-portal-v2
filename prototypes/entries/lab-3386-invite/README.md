# LAB-3386 Invite someone to LabOS (prototype)

Route: `/prototypes/lab-3386-invite`. Mock data only. No API, events, auth, counts or points.

## Doors and destination

- Avatar menu: "Invite someone to LabOS", beside My profile.
- Members search with no results: "Can’t find them? They may not be on LabOS yet. Invite them." Populated results show no CTA.
- Team profile, Members header: "Invite a teammate" beside "Add New", for team leads and admins only.
- All three open Settings → Invite: the personal mock link, "Copy invite link", a Copied state (2 s) and a fallback that selects the link when the clipboard is blocked.

## Team lead evidence (develop d7a2eaea)

- `components/page/team-details/TeamMembers/components/TeamMembersView/TeamMembersView.tsx` shows "Add New" and the per-card edit only when `isTeamLeaderOrAdmin(userInfo, team.id)` is true.
- `components/page/team-details/utils/isTeamLeaderOrAdmin.ts`: admin (RBAC `directory.admin.full`) or the team is in `userInfo.leadingTeams`.
- `app/settings/teams/page.tsx` + `components/page/settings/teams-member-info.tsx`: leads and admins also add and remove members in Settings → Manage Teams.
- The prototype calls production's `isTeamLeaderOrAdmin` directly, so the gate cannot drift.

## URL state

`?view=menu|members|team|settings`, `&viewer=member|team-lead|admin`, `&q=<search>`, `&clipboard=blocked`.

## Reuse map

IMPORT DIRECTLY

- `MemberGridView`, `TeamMembersViewCard`, `DetailsSection`, `DetailsSectionHeader`, `HeaderActionBtn`, `Button`, `isTeamLeaderOrAdmin`.
- SCSS: `AccountMenu.module.scss`, settings shell (`app/settings/accounts/page.module.css`, `app/settings/page.module.css`), `ConnectedAccounts.module.scss` (tab frame and card), `SettingsMenu*` modules, members shell and grid, `TeamMembersView.module.scss`.
- Prototype siblings (read only): `nav-shared/PrototypeNav.module.scss` (avatar disc), `members/MembersPrototype.module.scss` (toolbar), `lab-2948.../SettingsBackButtonMock`.

COPY + SIMPLIFY

- `AccountMenu` (auth store, analytics, router, sign-out).
- `SettingsMenu` (reads notification settings and MCP access over the network).
- `EmptyResult` (login redirect, analytics). Copy kept word for word.
- `TeamMembersView` (store, analytics, react-query).

## Tests and lessons applied

- Tests 1–3: no CTA over populated results; the team door goes where leads already manage members; Settings owns the link.
- Lesson 29: one destination for every door. Lesson 6: menu item, rail item and page title say "Invite". Lessons 2, 27: the team door is the same `HeaderActionBtn` as Add New. Lesson 15: no invented explanatory copy on the Invite page. Lesson 7: Copied shows in place on the button, no toast. Lessons 22, 39: the menu glyph is production's add-user path in the menu's slate fill.

## Checks

```
npx jest --coverage=false --testPathIgnorePatterns=/node_modules/ --testPathPattern=prototypes/entries/lab-3386-invite
npx eslint prototypes/entries/lab-3386-invite prototypes/registry.ts
```

The repo's jest config ignores `prototypes/`, so the flag above runs this entry's tests.
