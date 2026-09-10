import type { PrototypeEntry, PrototypeGroup } from './types';

export const prototypeRegistry: PrototypeEntry[] = [
  {
    key: 'linkedin-verify-live',
    title: 'LinkedIn verification (live production component)',
    description:
      "Production's OneClickVerification block, imported and rendered with mocked props so its gated state can be seen.",
    category: 'Getting started',
    load: () => import('./entries/linkedin-verify-live/LinkedInVerifyLivePrototype'),
  },
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
      "Mocked recreation of the team detail page: details, fund details, contact, membership / communities, members, focus areas, and projects — composed from real detail-page components. Public view shows a Follow pill (upvote-style, no count) in the header card's top-right corner; team view shows the follower avatar stack + count there, opening the full-list modal. The badges row also carries a \"Demo Day F25\" participation badge that deep-links to that demo day. Team view (members and admins) can post news: a small tertiary (text) \"+ Post news\" button in the rail header's corner, announced by a one-time brand-blue callout (the core Tooltip's highlight variant; shown on every page load in the prototype), or — when the team has none — an empty card with the invitation, which visitors never see (they get no rail at all). Compose is a modal in the standard shell: required headline, formatted body, required link (typed, no preview), with the link blocked at the field when it is already in this team's news. Posting lands the item at the top of the rail in the ordinary news-card treatment, attributed to the team. Inactive teams get no post control. The same view can hire from here: Open roles carries a \"+ Submit a job\" action in its header (the Edit slot) that leads to the job board's Submit a job form already opened on this team — one form, a second door, because a lead's home is their team's profile rather than a board of every team's roles. For that view the section also renders when the team has no roles (\"No open roles yet.\" under the door), the Asks / news-rail rule that an empty state holding an invitation goes to the people it is for; visitors still see no section at all. A Roles demo switch (Hiring / None yet) shows both. In that view each role row shows no actions at rest — one ⋯ menu holds View posting, Refer, Share, then Mark inactive / Bring back and a red Delete behind the team's own confirm dialog — with a status pill once a listing is not live — so a listing is taken down, brought back or removed from the team's page without opening it; an inactive one stays in the list with its undo, a deleted one is gone, and a toast says what the public board now does.",
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
    key: 'member-profile-edit',
    title: 'Member profile — editing a section',
    description:
      "A member's own profile page at /members/uid, with three changes to how a section is edited. Opening one section's editor mutes every other card — inert, so nothing on them can be pressed or focused, and faded to production's disabled tone — so one thing is happening on the page and a stray click cannot open a second. Cancel and Save move from above the fields to below them, at the end of the work where the hand already is; the title stays on top. And once the open card has scrolled wholly out of view, a floating “Keep editing” appears in the corner and takes you back to it with the first field focused. Four cards open an editor — the header card, Office Hours, Contact Details and Experience (add and per-row edit) — one short form, one medium, one long and one list; Teams, Project Contributions and Repositories are read-only and still mute like the rest. Filled with member-profile's Maya Okonkwo; no demo switch, the editing state is one press away on any Edit.",
    category: 'Members',
    load: () => import('./entries/member-profile-edit/MemberProfileEditPrototype'),
  },
  {
    key: 'status-bar-states',
    title: 'Status bar — every state',
    description:
      "A states sheet for the open-card status bar shared by the profile pages and the job board's apply drawer, so every state can be seen without producing it. The floating bar as the profile pages draw it — an editor with the card above (arrow up) or below (arrow down), unsaved changes with its Save, a CV review with Save CV results, and the CV read's three beats (uploading, reading, taking longer than usual) with the importer's own progress row and Cancel. And the same object as the job board drawer's footer row beside Continue: at rest with the footer's hint, then the read, the review and an editor once their card has scrolled away. Phone layouts are viewport rules and are not on this sheet — narrow the window on the real hosts for those.",
    category: 'Members',
    load: () => import('./entries/status-bar-states/StatusBarStatesPrototype'),
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
      'A brand-new member profile at /members/uid, transcribed from app/members/[id]/page.tsx in the order it renders and wearing its real stylesheets — the header card with the amber “+ Your Role” and “+ Your Location” pair and the “+ Add skills” / “+ Add bio” pills, the investor prompt banner over Investment Details with its three add pills, Office Hours and Contact Details behind their own prompts, then Experience, Project Contributions and Repositories. This is where a profile actually gets written: the onboarding modal collects five contact fields and then lands you here, on a page where every field a hiring team reads is still empty. The one addition sits at the very top, above the copy — “You can upload your CV”, open on its drop area, because a document fills the role and location on the header card and the skills row as well as the work history, and offering it inside the Experience section described it as smaller than it is. It is the same importer the apply drawer and the settings page mount, so three surfaces share one implementation — and the only one of the three where the review asks for a contact detail, since this account has a name from sign-up and no email yet; the answer lands on the Contact Details card. The section is permanent, not a first-run offer: the CV is kept and goes out with every application, so it is a thing the profile holds, and it renders like every other card on the page — the drop area while there is no file, the file with Replace and Remove once there is one. While it is drawn it is the document’s only door, so the Experience header’s “Update from CV” stands down and Replace takes its job — one entry point on screen, never two. A prototype-only “Preview” switch on the Back row jumps between the three states the page has — a new profile, a filled one with no CV, and the same profile with the document on it — and carries them in the URL (?state=no-cv, ?state=with-cv), so a link opens where the sender was.',
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
      'Faithful mocked copy of the production /jobs page, carrying the apply flow. Logged out, one standing banner makes the offer — "Sign in to apply for N open roles with one click", counting whatever the rail is currently showing, with both Sign up and Sign in. Applying is ONE flow in ONE drawer with a step rail — Review job → Your profile → Application, and the last step\'s button is Apply. It replaced three surfaces (a description drawer, a profile drawer and a centred apply modal) that the board handed to each other through four pieces of state, one of which existed only to carry a half-written cover letter across the seams. Every role row opens that flow on its reading step, keeping the arrow beside it as the way out to the posting. **A visitor with no account walks a shorter flow, with no rail** (Figma “3-step Application Flow”, Job Aspirant rows): the posting opens with a “What your profile unlocks” card under the masthead and a footer offering both doors — *Apply on the team’s site* in the light button, *Create profile* in the primary, with a “What your profile unlocks?” popover link under it. Create profile is one form (email, name, LinkedIn, current role, the “I work at a PL network startup” tick and the job search status), and the press lands back on the same job as a **job aspirant**: an “I’m interested” strip under the masthead (press → “The team will see it if you’re a match”, with Undo) and one footer button to the team’s own site. Aspirants do not apply through the board; ticking the PL-startup box still makes a pending account that waits on the PL team. The logged-out banner is the Figma’s card too — “N PL network teams are hiring. Let them find you.” with a Sign up button and an “Already at a PL network team? Sign in” strip. The sign-up modal survives only for the role-less Sign up door in the header and banner, sharing one schema with the in-flow pane. **The profile step is skipped, not hidden**: a finished profile sends Apply straight to the letter and step 2 wears a check from the first frame, which is the evidence for "nothing to refill" and gives Edit profile somewhere on screen to go. On mobile the whole thing is a page rather than a sheet. The profile step is the member profile itself, card for card (header, Job search status, Experience, Project Contributions, Repositories) on production\'s own DetailsSection chrome. Two answers gate applying — your current role and a private "Job search status" (actively looking / open to the right role / not looking, marked PL Team only and shown nowhere on the profile); everything else is optional. Experience can be typed or brought: its empty state carries the door production drew a `.connectButton` slot for and never wired — "Upload your CV", which takes a PDF, DOC or DOCX (a LinkedIn "Save to PDF" export among them, since a handle can never be read into a work history). What comes back is shown as a review card — positions to tick or drop, a pencil on any one of them that opens its role, team, dates and location in place (one row at a time, and ticking it is never touched), a start date to supply when the document had none, skills as editable tags, and the role and location only when the profile is still missing them — never the name or email, which a signed-in board already has — before anything touches the profile. Once the section has entries the door goes and the offer survives as one line at the top of the Add Experience form. Save and the rail moves you on: the last step reads your profile back with an Edit escape, takes a required cover letter, and the row flips to "Applied" — with no fourth step confirming what the board behind it already shows. The rail is drawn from the design system\'s own horizontal Steps component, which had no consumer anywhere in the app until now. Nothing on the board is hidden from a logged-out visitor — the gate is on applying, not browsing. The earlier matching answer to the same question ("Matches you" badges, a "Best match for me" sort, the nudge strip, the preferences modal) is gone, as is the timed dwell prompt: with an Apply button on every row the ask is already made at the moment of intent. Refer is unchanged and still signed-in only: the referral modal searches live directory members and prefills the hiring team\'s leads as recipients, alongside the share popover for LinkedIn / X / copy link. **The owner side** (viewers `team-lead`, who leads Filecoin Foundation, and `directory-admin`): a "Submit a job" door in the toolbar wearing Submit a Deal\'s button, opening a Submit-a-Deal-chrome modal whose fields are the role row\'s own (title, category, seniority, work mode, location, description, an optional link to the team\'s posting; admins also pick the team) — the press files the listing as *in review* and a toast says where it went. There is no owner tab: the owner\'s own team card on All — tinted in the product\'s "yours" surface (soft brand background, subtle brand border) for a lead, not for an admin — shows its listings in every state (a status pill on the in-review and inactive rows; everything else reads exactly as it does to an applicant), and each of those rows shows no actions at rest: everything is in one ⋯ menu — headed by where the listing came from ("Submitted by you", "From <careers host>") — View job, Refer, a Share submenu (LinkedIn / X / copy link), then below a rule Mark inactive on a live one, Bring back on an inactive one (no confirm — the undo is the item it turns into), and a red Delete in every state behind production\'s confirm dialog. Opening an owned listing gives the drawer without the rail, the status pill in the masthead and the same switch in the footer. `?submit=<teamUid>` opens the form on arrival for that team — the link the team profile\'s Open roles door uses.',
    category: 'Jobs',
    load: () => import('./entries/job-board/JobBoardPrototype'),
  },
  {
    key: 'job-board-profile-step',
    title: 'Job board — simplified profile step',
    description:
      'A fork of Job Board that changes one thing: step 2 of the apply flow. The step asks two questions — your current role and a private job search status — and `isProfileComplete` tests those two and nothing else, but it opened as six cards, four of them optional, each with its own header, Add control and empty state. Someone mid-apply met a profile-management surface where the flow had promised "the next step is finishing it". Here the two required answers keep the top of the step (with the CV card above them when the profile is blank, since a document answers the required role as well as the optional history), and Experience, Project Contributions and Repositories fold into one line below them: "Experience, projects and repositories (Optional)", reporting its own contents at rest — "3 roles · 1 project · GitHub linked" — so the step\'s lede stays honest with the sections closed. Folded rather than cut: Experience is what the application read-back quotes on step 3, and all three can still be typed here rather than on another page, which is the detour the whole flow exists to remove. Collapsed at rest in both states, because an empty profile already has the shortest route through all three offered above it and the amber strips on the two required cards have to stay the loudest thing on the step. The fold forces itself open around an open editor, so nothing collapses over unsaved work, and the sections stay mounted when closed so a part-filled form survives the trip. Everything else — the board, the rail, the account step, the letter — is job-board unchanged. Refer is not: this folder\'s mocked modal also takes someone outside the network (the referee search\'s menu ends in *Refer someone outside the network*, which swaps the search for three required inputs — full name, email address, LinkedIn profile), a branch the live copy cannot send yet.',
    category: 'Jobs',
    load: () => import('./entries/job-board-profile-step/JobBoardPrototype'),
  },
  {
    key: 'job-board-apply-steps',
    title: 'Job board — apply in five steps',
    description:
      "The other answer to the same problem as `job-board-profile-step`, built to be looked at beside it. Where that one folds the optional profile sections behind a line on step 2, this one gives each of them a position on the rail: Review job → Your CV → Your details → Experience → Application. The CV step is the offer and nothing else, with a Skip beside Continue in the footer — a border button, not a text link, because skipping is the majority path and dressing the common answer as an exception would misdescribe who uses it. Your details holds the two answers applying actually requires (current role, job search status). Experience holds the three that gate nothing, so its Continue is live whatever is on the screen. What the fork is for is seeing the costs the three-step version does not pay: a member with a finished profile opens the drawer to a five-stop rail whose middle three are ticked on the first frame and never visited; the CV offer becomes a decision everyone makes rather than a card you ignore by not dropping a file; and the draft now has three step boundaries to commit across instead of one. A visitor with no account gets a different rail — just Review job and Your details, because the other three are not ahead of them, they are not for them: the flow ends on the account form and an unreviewed account cannot send from here. Their last press is labelled `Apply on their site` (production's own words for this outcome) and does what it says, opening the team's posting in a new tab with the board's tracking suffix, while the PL account is created behind it. The CV step never draws for them at all; the importer was already removed from the account pane for the same reason. Everything else — the board, the letter, the account form — is job-board unchanged (Refer carries the same outside-the-network branch as `job-board-profile-step`), and `JobProfilePane` is one component showing a third of itself per step rather than three panes that could drift.",
    category: 'Jobs',
    load: () => import('./entries/job-board-apply-steps/JobBoardPrototype'),
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
      'Quality for an investor audience, in two surfaces. The feed opens on "For You" — the default production itself uses — so the personalization is what a reader lands in rather than something they have to go find. (The network-wide Top Story block that used to lead the week is hidden for now behind `SHOW_TOP_STORIES`; its three picks are ordinary feed cards while it is off.) The "For You" pill production ships on /home leads the category row here too — the same teams-you-match slice, with a one-line note under it ("Your feed is based on your skills, your focus areas, and the teams you follow") and an Update profile link onto the settings page that owns the first of the three; a personalized view that never states its inputs leaves a reader unable to tell a thin week from a thin profile — and naming follows as an input is what makes the Follow buttons already on the page read as personalization controls. A **Preview as** switch under the navbar (or `?viewer=logged-out`) opens the page as the visitor with no account: production tells that person nothing about any of this (its For You hint only renders behind the pill, and the pill only exists once there is an auth token), so here the signed-out home banner carries the offer and the same sentence, with Sign in inside it. A Sourcing switch demonstrates the recall bug behind it: production builds the All tab as the union of the focus-area groups, so an untagged story — including this week\'s top story — reaches no tab at all; flipping to "One stream" demotes focus area to a filter beside Sort and the untagged long tail comes back. Job-board activity joins the feed as a per-team hiring signal rather than pasted listings, and follow suggestions carry the relational `reason` production already returns. The Email digest view is the same curation as the Monday send — client chrome, subject line, top story with its why-line, the week in one line each, who started hiring — because the editorial bet is cheaper and more measurable to test in an inbox than in a hero card. The (?) in the header is the proposed help & feedback menu (see the Help & feedback menu entry), announced on arrival by the same one-time brand-blue callout the team profile uses for Post news — this is the page a session starts on, so it is where the announcement is met; shown on every load in the prototype.',
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
      'Mocked recreation of the PL Infra AI Apps page: the standard filters rail (search + Created by) beside the app grid, a sort menu, the "Create AI App" step-by-step modal, and a detail view embedding a deployed app preview. "Give feedback" sits at the top of both the all-apps masthead and the detail bar — the same bordered button in both places, instead of dev\'s floating pill. Cards carry an update note that names a collaborator when the last push wasn\'t the creator\'s ("Updated by Nina Chen 2h ago") and an activity row: views for everyone, plus an "activity" count (feedback items, called activity so a number can\'t read as a verdict) for people who can act on it. The creator can edit an app name/description and upload a 1-pager as HTML or Markdown (a PRD) that anyone can open; use the "View as" toggle to switch between the creator and visitor experience.',
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
    key: 'help-feedback-menu',
    title: 'Help & feedback menu',
    description:
      "The header's (?) becomes a hover-and-click menu whose items are the Contact Support form's own five topics (Contact support · Ask a question · Give feedback · Share an idea · Report a bug), each opening the form already on that topic — the `?dialog=` deep links, with labels. Inside the form the topic dropdown becomes a row of pills so all five are visible at rest, and the title follows the topic. Demo switches: an optional “Ask AI” item (opens the search overlay) and a one-time first-visit callout on the (?). Why: in 90 days the form opened in 605 sessions and only 12 chose a non-default topic — the dropdown is never looked inside.",
    category: 'Cross-product',
    load: () => import('./entries/help-feedback-menu/HelpFeedbackMenuPrototype'),
  },
  {
    key: 'ai-search',
    title: 'AI search — one list, one door',
    description:
      'The header search dialog with AI Search as a row above the results and a state of the same dialog, instead of production\'s two-column overlay (keyword list left, AI chat with a wordless empty state right). Idle: recent searches, the Husky page\'s "Try asking or searching for" block with prompts phrased as directory finds, then "Your AI Search History" (past threads that reopen in place, kept across closing the dialog). Typing: one fixed row first — Chat with AI Search about "<term>" — then production\'s category chips and result rows over a mocked corpus. The row replaces both of production\'s AI doors (the zero-results card and the commented-out "Try AI Search" button). Pressing it streams an answer with sources, "Results from the directory" and follow-ups, with Back to results and Continue in AI Search. Feedback is an inline thumbs pair; a thumbs-down asks why under the answer instead of opening the 1–5 rating dialog. History shows five threads with a "Show all (N)" door that opens the whole record in place, grouped Today / Yesterday / Last 7 days / Last 30 days / year in production\'s own history chrome, and a thread opened from there goes "Back to history". "Results from the directory" is redrawn as compact cards — 32px picture, name, one "Type · fact" line, the dialog\'s own borders and hover — in place of production\'s gradient-bordered 18px cards, with "Show all (N)" expanding in place. ⌘K opens it. Everything mocked.',
    category: 'Cross-product',
    load: () => import('./entries/ai-search/AiSearchPrototype'),
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
