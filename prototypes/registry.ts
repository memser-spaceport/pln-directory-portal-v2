import type { PrototypeEntry, PrototypeGroup } from './types';

export const prototypeRegistry: PrototypeEntry[] = [
  {
    key: 'template',
    title: 'Starter template',
    description: 'Copy this entry as a starting point — mock list, detail panel, and local state.',
    category: 'Getting started',
    load: () => import('./entries/template/TemplatePrototype'),
  },
  {
    key: 'gantry-priority-support',
    title: 'Gantry priority support',
    description: 'Compare current upvote UX with eight prioritization patterns on mocked Gantry need cards.',
    category: 'Gantry',
    load: () => import('./entries/gantry-priority-support/GantryPrioritySupportPrototype'),
  },
  {
    key: 'gantry-impact-rating',
    title: 'Gantry — impact rating',
    description:
      "A free, unlimited crowd rating of an item's impact on Gantry objectives, shown as a second axis alongside Boost (demand). Two variants: overall score, and overall + optional per-objective.",
    category: 'Gantry',
    load: () => import('./entries/gantry-impact-rating/GantryImpactRatingPrototype'),
  },
  {
    key: 'gantry-saved-draft-item',
    title: 'Gantry saved draft item',
    description: 'Mocked autosave visibility flow for a single Gantry item draft shown in filters.',
    category: 'Gantry',
    load: () => import('./entries/gantry-saved-draft-item/GantrySavedDraftItemPrototype'),
  },
  {
    key: 'founder-db',
    title: 'Founder DB — ranking improvements',
    description:
      'Alignment as its own tier-colored column (segmented meter + %), a "Strong fit · top 10" band, rank numbers, default Sort by Alignment, row checkboxes with bulk approve/export, and a drawer with a top fit-summary and sticky Approve footer.',
    category: 'Founder DB',
    load: () => import('./entries/founder-db/FounderDbPrototype'),
  },
  {
    key: 'warm-intros-filter-update',
    title: 'Warm intros update',
    description:
      'People-first warm-intros workspace: connector states (in-network / external / org-unknown), per-investor paths, and an investor drawer with sticky header.',
    category: 'Investor DB',
    load: () => import('./entries/warm-intros-filter-update/WarmIntrosFilterUpdatePrototype'),
  },
  {
    key: 'teams',
    title: 'Teams — listing page',
    description:
      'Mocked recreation of the teams listing: filters rail, toolbar (search / sort / view toggle), and a responsive grid of real TeamGridView cards linking to the team profile. Teams that have wound down carry an "Inactive" state — muted card, grey badge, no news mark — and are out of the default set behind a "Show inactive teams" toggle in the filter rail.',
    category: 'Teams',
    load: () => import('./entries/teams/TeamsPrototype'),
  },
  {
    key: 'team-profile',
    title: 'Team profile',
    description:
      'Mocked recreation of the team detail page: details, fund details, contact, membership / communities, members, focus areas, and projects — composed from real detail-page components. Public view shows a Follow pill (upvote-style, no count) in the header card\'s top-right corner; team view shows the follower avatar stack + count there, opening the full-list modal. The badges row also carries a "Demo Day F25" participation badge that deep-links to that demo day.',
    category: 'Teams',
    load: () => import('./entries/team-profile/TeamProfilePrototype'),
  },
  {
    key: 'warm-intros-columns',
    title: 'Warm intros — connection columns',
    description:
      'Investor spine with Score + Direct + 1-hop connector columns (founders, co-investors, and org/person-unknown), a "direct only" quick filter, and per-connector filtering.',
    category: 'Investor DB',
    load: () => import('./entries/warm-intros-columns/WarmIntrosColumnsPrototype'),
  },
  {
    key: 'warm-path-states',
    title: 'Warm path — states reference',
    description:
      'Dev reference: every node state and warm-path card state in one place, rendered through the real components.',
    category: 'Investor DB',
    load: () => import('./entries/warm-intros-filter-update/WarmPathStatesPrototype'),
  },
  {
    key: 'warm-intros-v2',
    title: 'Warm intros v2 — mocked clone',
    description:
      'Faithful mocked clone of the production Warm Intros v2 workspace: list picker + search + PL-member / sector filters + CSV export, the real results table (score %, connector → investor path chips — the proximity code is dropped), the glossary drawer, the investor drawer with best path, reasons and alternate connectors, and the MasterProfile modal.',
    category: 'Investor DB',
    load: () => import('./entries/warm-intros-v2/WarmIntrosV2Prototype'),
  },
  {
    key: 'warm-intros-role-colors',
    title: 'Warm intros — role-coloured nodes',
    description:
      'The v2 workspace imported whole, with one variable changed: whether a path node says what kind of person it is in colour as well as in words. Opens on “Tags only” — the nodes stay exactly as they are and only the role tag beneath each one takes its hue; “Fill” tints the chip too, for comparison on the same rows. The uncoloured baseline is the Warm intros v2 entry above. Hues come from MasterProfileModal’s type pills, the tags on the profile a node opens — PL member indigo, founder orange, co-investor cyan, investor green — not from HopRoleBadge, which contradicts them on three of the four roles.',
    category: 'Investor DB',
    load: () => import('./entries/warm-intros-role-colors/WarmIntrosRoleColorsPrototype'),
  },
  {
    key: 'members',
    title: 'Members — listing page',
    description:
      'Production members listing recreated with mocked data: filters rail, toolbar (search, sort, grid/list toggle), and the real member cards. Cards link through to the Affinity profile prototype.',
    category: 'Members',
    load: () => import('./entries/members/MembersPrototype'),
  },
  {
    key: 'member-profile',
    title: 'Member profile — relationship + activity',
    description:
      'Member profile page augmented with Affinity CRM context: relationship owner, last contact (date + one-line summary), and an interaction-frequency read (high-touch vs neglected) over the last 6 months, marked "PL team only" — the card is PL\'s notes about the member, not the member\'s own field. Adds a Follow button + follower count on the right of the header, with a manage-notifications modal. Also carries the member\'s Bluesky, as an "On Bluesky" rail card between Relationship and the team updates: two posts rendered as real posts — linkified body, media, unfurled link cards, quoted posts, reply/repost/like counts — narrowed for the 300px column, and falling into the main column below tablet-landscape where the rail is hidden. Four states: shared, owner view (adds who-can-see-this and where to change it), not connected (the owner is offered a "Connect Bluesky" prompt in the same card), and not shared (a visitor sees nothing — there is nothing to offer someone who cannot act on it).',
    category: 'Members',
    load: () => import('./entries/member-profile/MemberProfilePrototype'),
  },
  {
    key: 'person-city-calendar',
    title: 'Person city calendar',
    description:
      "Signal which city you'll be in over time, defaulting to your home city. Four real pages at production fidelity — the IRL gathering RSVP that seeds a trip, a Travel plans section on your profile beside Office Hours, /members with a third Travel view (person × day overlap matrix), and a visitor's profile. State carries across tabs: RSVP on the gathering and the trip appears everywhere else.",
    category: 'Members',
    load: () => import('./entries/person-city-calendar/PersonCityCalendarPrototype'),
  },
  {
    key: 'demoday-tag-placements',
    title: 'Demo Day tag — placement options',
    description:
      'Placements + styles for the "participated in Demo Day" indicator on the team profile, switchable by tab: next to the name as a filled code badge, an outlined code badge, a calendar-icon emblem, or a series-tag-style pill; on its own separate row; as a chip in the tags row; or as a row inside the Events/Contributions block.',
    category: 'Teams',
    load: () => import('./entries/demoday-tag-placements/DemodayTagPlacementsPrototype'),
  },
  {
    key: 'follow-team',
    title: 'Follow — team profile',
    description:
      'Duplicate of the team profile with the follow feature: two layout variants (button + "why" card, or inline-with-title grouped pill), notification settings, social proof, and a personalized news rail.',
    category: 'Ideation',
    load: () => import('./entries/follow-team/FollowTeamPrototype'),
  },
  {
    key: 'onboarding',
    title: 'New member profile — first fill',
    description:
      'A brand-new member profile at /members/uid, transcribed from app/members/[id]/page.tsx in the order it renders and wearing its real stylesheets — the header card with the amber “+ Your Role” and “+ Your Location” pair and the “+ Add skills” / “+ Add bio” pills, the investor prompt banner over Investment Details with its three add pills, Office Hours and Contact Details behind their own prompts, then Experience, Project Contributions and Repositories. This is where a profile actually gets written: the onboarding modal collects five contact fields and then lands you here, on a page where every field a hiring team reads is still empty. The one addition sits at the very top, above the copy — “You can upload your CV”, open on its drop area, because a document fills the role and location on the header card and the skills row as well as the work history, and offering it inside the Experience section described it as smaller than it is. It is the same importer the apply drawer and the settings page mount, so three surfaces share one implementation — and the only one of the three where the review asks for a contact detail, since this account has a name from sign-up and no email yet; the answer lands on the Contact Details card. The card disappears the moment anything is filled in, and the Experience header then carries “Update from CV” for the next document — one entry point on screen, never two.',
    category: 'Members',
    load: () => import('./entries/onboarding/OnboardingPrototype'),
  },
  {
    key: 'profile-settings',
    title: 'Profile settings',
    description:
      'Mocked recreation of the production settings shell (back bar, left preferences/admin menu, content) with a Profile edit form — basic info, team & skills, experience, contact, and availability — plus a sticky save bar. Experience is a list here rather than a single entry, and carries the same CV importer as the apply drawer on the job board: an “Upload your CV” pill in the empty state, “Update from CV” beside the heading once there are entries (opening the file dialog on the press), and the same review card — positions to tick or drop, a pencil that corrects one of them in place, already-present ones labelled and unticked, skills as editable tags. Name and email are on this page two sections up, so the review never offers to overwrite them. It shares ExperienceList and ExperienceForm with the drawer rather than re-typing them, because the two pages are two windows onto one record. While the review is open the sticky Save on this page stands down, the way the drawer footer does.',
    category: 'Ideation',
    load: () => import('./entries/profile-settings/ProfileSettingsPrototype'),
  },
  {
    key: 'following-popover',
    title: 'Follow — Following / Followers',
    description:
      'Manage who you follow from the profile avatar popover: Following (split into People / Teams, each row unfollowable) and Followers (with Follow-back and network proof).',
    category: 'Ideation',
    load: () => import('./entries/following-popover/FollowingPopoverPrototype'),
  },
  {
    key: 'teams-following',
    title: 'Follow — teams you follow (manage page)',
    description:
      'LinkedIn-style "Pages you follow" list for the directory: one centered card with Teams/People tabs, search within the list, follower counts + follow recency per row, and a Following/Follow toggle that keeps unfollowed rows in place for easy undo.',
    category: 'Ideation',
    load: () => import('./entries/teams-following/TeamsFollowingPrototype'),
  },
  {
    key: 'news-feed',
    title: 'Follow — network news feed',
    description:
      'Faithful copy of the production homepage "News from the network" feed (focus-area tabs, category filters, card grid, Show All) with a small follow/following button next to each team name.',
    category: 'Ideation',
    load: () => import('./entries/news-feed/NewsFeedPrototype'),
  },
  {
    key: 'home-news',
    title: 'Follow — personalized feed',
    description:
      'The news feed silently personalized by who you follow: followed teams & people surface first under a subtle marker, with a SubscribeBanner empty state and one-tap follow suggestions. Switch between following none / a few / many to see it re-sort live.',
    category: 'Ideation',
    load: () => import('./entries/home-news/HomeNewsPrototype'),
  },
  {
    key: 'job-board',
    title: 'Job Board',
    description:
      'Faithful mocked copy of the production /jobs page, carrying the apply flow. Logged out, one standing banner makes the offer — "Sign in to apply for N open roles with one click", counting whatever the rail is currently showing, with both Sign up and Sign in. Applying is ONE flow in ONE drawer with a step rail — Review job → Your profile → Application, and the last step\'s button is Apply. It replaced three surfaces (a description drawer, a profile drawer and a centred apply modal) that the board handed to each other through four pieces of state, one of which existed only to carry a half-written cover letter across the seams. Every role row opens that flow on its reading step, keeping the arrow beside it as the way out to the posting. **Signing up happens inside the flow too**: a visitor with no account gets the same three-step rail with step 2 renamed "Your details" — email, name, LinkedIn, role @ company and the job search status — and the final Apply opens the account and files the application in one press, so abandoning at the letter leaves no orphan account. PL review no longer gates applying; it runs alongside. The sign-up modal survives only for the role-less Sign up door in the header and banner, sharing one schema with the in-flow pane. **The profile step is skipped, not hidden**: a finished profile sends Apply straight to the letter and step 2 wears a check from the first frame, which is the evidence for "nothing to refill" and gives Edit profile somewhere on screen to go. On mobile the whole thing is a page rather than a sheet. The profile step is the member profile itself, card for card (header, Job search status, Experience, Project Contributions, Repositories) on production\'s own DetailsSection chrome. Two answers gate applying — your current role and a private "Job search status" (actively looking / open to the right role / not looking, marked PL Team only and shown nowhere on the profile); everything else is optional. Experience can be typed or brought: its empty state carries the door production drew a `.connectButton` slot for and never wired — "Upload your CV", which takes a PDF, DOC or DOCX (a LinkedIn "Save to PDF" export among them, since a handle can never be read into a work history). What comes back is shown as a review card — positions to tick or drop, a pencil on any one of them that opens its role, team, dates and location in place (one row at a time, and ticking it is never touched), a start date to supply when the document had none, skills as editable tags, and the role and location only when the profile is still missing them — never the name or email, which a signed-in board already has — before anything touches the profile. Once the section has entries the door goes and the offer survives as one line at the top of the Add Experience form. Save and the rail moves you on: the last step reads your profile back with an Edit escape, takes a required cover letter, and the row flips to "Applied" — with no fourth step confirming what the board behind it already shows. The rail is drawn from the design system\'s own horizontal Steps component, which had no consumer anywhere in the app until now. Nothing on the board is hidden from a logged-out visitor — the gate is on applying, not browsing. The earlier matching answer to the same question ("Matches you" badges, a "Best match for me" sort, the nudge strip, the preferences modal) is gone, as is the timed dwell prompt: with an Apply button on every row the ask is already made at the moment of intent. Refer is unchanged and still signed-in only: the referral modal searches live directory members and prefills the hiring team\'s leads as recipients, alongside the share popover for LinkedIn / X / copy link.',
    category: 'Jobs',
    load: () => import('./entries/job-board/JobBoardPrototype'),
  },
  {
    key: 'newsfeed-discovery',
    title: 'Newsfeed discoverability — labelled door + unread signal',
    description:
      "The feed isn't hard to find — `/` redirects to `/home`, so every session starts on it. It's hard to get *back* to: the navbar has no Home or News item, and the logo is the only route there. Rather than a second /newsfeed route competing with the page that already owns network news, this adds a labelled News item to the real navbar, reorders home so the feed leads and Quick Actions demotes to a chip strip, and puts the unread signal on that item — a dot, never a count. Cards published since your last visit carry a New tag (a Badge, right-aligned into one scan column), which suppresses itself entirely once new items pass a third of the list, since a tag on everything labels nothing. Both signals read one primitive, `newsLastSeenAt`: no per-item read state, no viewport tracking, no mark-all-as-read. A Last visit switch flips between nothing new, a few new, and everything new; clicking News clears the dot and the tags together.",
    category: 'Newsfeed',
    load: () => import('./entries/newsfeed-discovery/NewsfeedDiscoveryPrototype'),
  },
  {
    key: 'newsfeed-v0',
    title: 'Newsfeed redesign — v0 quick wins',
    description:
      'A wide single-column feed mixing team news clusters and member forum posts (author on top, same card style), with a follow-suggestions / popular rail and fully-functional per-item likes (forum-style). A prototype switch flips between two versions: "With comments" (news and posts carry an inline comment thread) and "Without comments" (Like + Share only). Clicking a story opens an enlarged detail modal with the standardized modal chrome (sticky header + close, full summary, Share, source badges, and comments in the with-comments version).',
    category: 'Newsfeed',
    load: () => import('./entries/newsfeed-v0/NewsfeedV0Prototype'),
  },
  {
    key: 'newsfeed',
    title: 'Newsfeed — curated feed + weekly email',
    description:
      'Quality for an investor audience, in two surfaces. The feed opens on "For You" — the default production itself uses — so the personalization is what a reader lands in rather than something they have to go find. (The network-wide Top Story block that used to lead the week is hidden for now behind `SHOW_TOP_STORIES`; its three picks are ordinary feed cards while it is off.) The "For You" pill production ships on /home leads the category row here too — the same teams-you-match slice, with a one-line note under it ("Your feed is based on your focus areas, skills, and teams") and an Update profile link onto the settings page that owns two of the three; a personalized view that never states its inputs leaves a reader unable to tell a thin week from a thin profile. A Sourcing switch demonstrates the recall bug behind it: production builds the All tab as the union of the focus-area groups, so an untagged story — including this week\'s top story — reaches no tab at all; flipping to "One stream" demotes focus area to a filter beside Sort and the untagged long tail comes back. Job-board activity joins the feed as a per-team hiring signal rather than pasted listings, and follow suggestions carry the relational `reason` production already returns. The Email digest view is the same curation as the Monday send — client chrome, subject line, top story with its why-line, the week in one line each, who started hiring — because the editorial bet is cheaper and more measurable to test in an inbox than in a hero card.',
    category: 'Newsfeed',
    load: () => import('./entries/newsfeed/NewsfeedPrototype'),
  },
  {
    key: 'notifications-hub',
    title: 'Notifications — bell panel',
    description:
      'The bell dropdown, reworked so it is something you can act on rather than only read. Header follows the Airtable notification panel: an All / Unread / Read segmented switch, in-panel search, and a visible Mark all as read above the list (with an undo window rather than a confirm). Read state is decoupled from navigation — a per-row read toggle on a real 28px target plus per-row dismiss — and status is split from action the way the reference splits it: a non-interactive dot leads each row so unread reads down the left edge. The panel behaves like a dialog — Escape, focus trap, focus restore, positioned against the bell instead of a fixed offset — and has real loading and error states instead of falling through to "No new updates". The eight categories get distinct hues and keep their glyph on mobile, and every accent carrying text clears 4.5:1.',
    category: 'Newsfeed',
    load: () => import('./entries/notifications-hub/NotificationsHubPrototype'),
  },
  {
    key: 'notifications-inbox',
    title: 'Notifications — full Updates page',
    description:
      'The standalone counterpart to the bell panel: the full Updates page grouped by Today / Yesterday / Earlier and closed with a terminator instead of infinite scroll simply stopping. Carries the same All / Unread / Read switch, search, per-row read toggle and dismiss as the panel, plus Mark all as read with an undo window — production wires markAllAsRead through the provider and the service but no component ever calls it. Shares its state hook, filter, row component and stylesheet with the panel entry so the two surfaces cannot drift.',
    category: 'Newsfeed',
    load: () => import('./entries/notifications-inbox/NotificationsInboxPrototype'),
  },
  {
    key: 'email-preferences',
    title: 'Email Preferences — digest split',
    description:
      'Recreation of the Settings › Email Preferences tab (settings menu + all sections) from the real components. The one change: the old "Forum Digest" is renamed "Digest" (it actually carries forum activity + network news) and gains per-content toggles, so a member can keep the digest but switch Network news off independently.',
    category: 'Newsfeed',
    load: () => import('./entries/email-preferences/EmailPreferencesPrototype'),
  },
  {
    key: 'settings-contact-details',
    title: 'Settings — Email & accounts',
    description:
      'The member settings surface, fully walkable, with one findable home for the email address. Today the only self-serve control is an unlabeled grey pencil inside a disabled field on the member\'s own profile page, so people write to support instead — while "Account settings" redirects to Connected Accounts (which omits email entirely) and "Email preferences" holds digest toggles. Two rail changes: "Email preferences" becomes "Notification preferences" under a bell, which frees the word "email"; and "Connected accounts" becomes "Email & accounts" under the envelope, absorbing the contact fields so there is exactly one plausible door rather than two adjacent ones. That tab holds three sections — the email address, the sign-in methods (Google / GitHub / Wallet), and the social links with their visibility switch. The email row is read-only with a labeled Change button rather than disabled with a hidden pencil, states that the address is also the login before any code is sent, names the cause and the way out when the address is refused. That row is now the shipped component (Settings › Connected accounts renders this exact file), so its Change button hands off to the real Privy code flow rather than a mocked one — the rest of the tab is still mocked. Notification preferences and Job Alert are reproduced as they ship, as is the shell: the mobile /settings menu page, the sticky back bar, and the 1024px rail breakpoint.',
    category: 'Cross-product',
    load: () => import('./entries/settings-contact-details/SettingsContactDetailsPrototype'),
  },
  {
    key: 'demoday-past-teams',
    title: 'Demo Day — past participating teams',
    description:
      'The completed (past) Demo Day page with the "Teams That Presented" grid un-hidden: hero, partner logos, the full list of past participating teams (real TeamCards linking to team pages), FAQ, and footer. Only shown for demo days that already happened.',
    category: 'Demo Day',
    load: () => import('./entries/demoday-past-teams/DemodayPastTeamsPrototype'),
  },
  {
    key: 'ai-apps',
    title: 'AI Apps',
    description:
      'Mocked recreation of the PL Infra AI Apps page: app grid, the "Create AI App" step-by-step modal, and a detail view embedding a deployed app preview. The creator can edit an app name/description and upload a 1-pager as HTML or Markdown (a PRD) that anyone can open; use the "View as" toggle to switch between the creator and visitor experience.',
    category: 'AI Apps',
    load: () => import('./entries/ai-apps/AiAppsPrototype'),
  },
  {
    key: 'agent-session-chat',
    title: 'Agent session — chat & detail',
    description:
      'Mocked recreation of /pl-infra/agent-sessions/<id>: the sticky identity header with its status badge, the Overview / Chat tabs, the message thread (agent markdown vs. plain admin bubbles, amber reserved for the one question the run is actually stopped on, an outcome row that closes a finished run with the PR and feature-environment links it produced, and a failure block with the error code, namespace and Kubernetes job name plus a Retry) and the docked composer that says sending starts a new agent run. Overview carries the meta grid, the prompt, an inline confirmation for deleting the feature environment, and the derived progress steps. A state switcher moves the session between running, waiting for input, PR created with a live feature env, and failed; View as flips between the admin (tabs + chat) and the VIEW-only member, who gets no tab bar at all. Answering the agent while it waits resumes the run — reachable from Overview too, which has no composer — and Deploy / Delete walk the feature environment through its states.',
    category: 'PL Infra',
    load: () => import('./entries/agent-session-chat/AgentSessionChatPrototype'),
  },
  {
    key: 'ai-apps-feedback',
    title: 'AI Apps — feedback',
    description:
      'Feedback flows on the AI Apps page: give feedback via a floating button or a header button, and a full received-feedback view for app authors and admins, switchable by role.',
    category: 'AI Apps',
    load: () => import('./entries/ai-apps-feedback/AiAppsFeedbackPrototype'),
  },
  {
    key: 'ai-apps-secrets',
    title: 'AI Apps — stored secrets & re-deploy',
    description:
      'Secret-key states for the app setup card: first deploy (plain required field + Deploy), value already stored (locked masked field with Edit / Cancel, button becomes Re-deploy), and a failed deploy where a newly added key is still missing.',
    category: 'AI Apps',
    load: () => import('./entries/ai-apps-secrets/AiAppsSecretsPrototype'),
  },
  {
    key: 'input-interactions',
    title: 'Input interactions — autosave & dismissal',
    description:
      'One contract for every place a member types: outside click never destroys text, autosave is continuous and visible, discard is always explicit, and drafts survive reload. Four demos (inline composer, page composer, modal, anchored popover) each flip between what ships today and the proposed behaviour, standing in for the Tier 1 and Tier 2 surfaces from the consistency audit.',
    category: 'Cross-product',
    load: () => import('./entries/input-interactions/InputInteractionsPrototype'),
  },
  {
    key: 'auth-copy-audit',
    title: 'Auth copy audit — “Log in” → “Sign in”',
    description:
      'Every visible string that needs the log→sign change, with file, line, current text and replacement: wrong verb, wrong case, body copy and assistive text. Also lists the identifiers a sweep will match but must not rename — the #login route, auth events, PostHog names, CSS classes — and a suggested order.',
    category: 'Cross-product',
    load: () => import('./entries/auth-copy-audit/AuthCopyAuditPrototype'),
  },
  {
    key: 'kudos-edit',
    title: 'Kudos — edit states',
    description:
      "PLAA-50 click-through with the real KudosCard component and a mocked signed-in giver: your own kudos on the current round (Edit action), your own kudos on a past round (locked, frozen), and someone else's kudos (neither). Save changes calls a mocked update so you can see a full successful edit without a reachable PLAA_API_URL.",
    category: 'PLAA',
    load: () => import('./entries/kudos-edit/KudosEditPrototype'),
  },
  {
    key: 'pl-spotlight-table',
    title: 'PL Spotlight — back-office participants table',
    description:
      'Recreation of the PL Spotlight participants table from the Back Office Figma file (node 750:690): the ten-column grid — select, member (name + email + avatar), team link, investor-type badge (Angel / Fund / not provided), invite-accepted check or cross, follow-up count over its date, the clipped Template vars JSON, the purple Type pill, the wide blue Access pill, and the three action buttons. Column widths, row heights, badge ramps and the Send-vs-Resend state of every button are transcribed from the frame; the controls are real, so checkboxes select (with an indeterminate header), both dropdowns change, invites and follow-ups update the row they act on, and removing a participant is undoable. Type and Access take their option sets from production enums rather than invented ones, since the frame renders native selects and the canvas cannot draw their labels. The envelope button no longer fires on click: it opens a compose modal — the portal referral modal chrome, not the back-office confirm sheet — carrying the recipient card, an editable subject and body drafted from a template, a note saying which template vars filled in and which line was dropped for want of one, the list of what the send adds on its own, and the amber already-invited warning. The navbar’s Settings item is a working destination: it opens Settings → Email templates, the org-wide list of what the back office sends (the spotlight invite and the follow-up), each row carrying where it is sent from, whether it still says what shipped, which records keep their own version of it, and an Edit button onto the same template editor the Overview card uses. That makes the wording three-level and the levels visible: Settings holds the default, a spotlight overrides it for itself, one send drafts from whichever applies — saving a spotlight template identical to the default drops the override rather than freezing a copy, and the Settings row reports the override so editing a default cannot silently miss the record that stopped listening.',
    category: 'Back office',
    load: () => import('./entries/pl-spotlight-table/PlSpotlightTablePrototype'),
  },
  // TODO: prototype not built yet — folder entries/warm-intros-side-drawer-improvements/ is missing.
  // Re-enable this entry once WarmIntrosSideDrawerPrototype.tsx exists (the import below breaks the build otherwise).
  // {
  //   key: 'warm-intros-side-drawer-improvements',
  //   title: 'Warm Intros side drawer improvements',
  //   description: 'Mocked Investor DB drawer preview for surfacing warm-intro context near the top.',
  //   category: 'Investor DB',
  //   load: () => import('./entries/warm-intros-side-drawer-improvements/WarmIntrosSideDrawerPrototype'),
  // },
];

export function getPrototypeEntry(key: string): PrototypeEntry | undefined {
  return prototypeRegistry.find((entry) => entry.key === key);
}

export function getPrototypeKeys(): string[] {
  return prototypeRegistry.map((entry) => entry.key);
}

export function getPrototypesByCategory(): PrototypeGroup[] {
  const groups = new Map<string, PrototypeEntry[]>();

  for (const entry of prototypeRegistry) {
    const items = groups.get(entry.category) ?? [];
    items.push(entry);
    groups.set(entry.category, items);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({ category, items }));
}
