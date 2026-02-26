# IRL Gatherings — Technical Documentation

## Directory Application — IRL Page

> **Repository**: [pln-directory-portal-v2](https://github.com/memser-spaceport/pln-directory-portal-v2)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Technology Stack](#technology-stack)
4. [Application Structure](#application-structure)
5. [Authentication & Access](#authentication--access)
6. [Core Modules & Features](#core-modules--features)
7. [API Integration](#api-integration)
8. [Glossary](#glossary)

---

## Project Overview

### Purpose

IRL Gatherings is a centralized module that curates in-person community events across global locations. It enables members to discover city-based meetups, track past and upcoming gatherings, and evaluate regional ecosystem activity. The module strengthens community growth by driving real-world networking, collaboration, and deeper participation within the broader network. IRL Gathering page is part of the Protocol Labs Directory, and this document covers only IRL Gathering page.

The IRL Gatherings page allows network members to:

- Choose a location (gathering) and view its upcoming or past events.
- View quick links (additional resources) for the selected location.
- Declare presence (“I’m Going”) for upcoming gatherings and manage their attendance (topics, reason, events).
- View attendees for the selected location/event type (upcoming or past), with search, filters, and pagination.
- Admins (DIRECTORYADMIN) can add, edit, and remove attendees for IRL events at that location.

### Events sync

Events and gathering data originate from the Event Submission application and are stored in the events service database (MongoDB). The events service is the single source of truth. Data is transformed and synced from the events service to the IRL page (via the backend). See [PL Events Submission - Technical Documentation](https://github.com/memser-spaceport/pl-events-submission) for full details.

### Complete Workflow

There are two possible user workflows depending on login state:
- not logged in (no access to "I'm Going" or "+ Follow") and 
- logged in(full access to both).

```
┌──────────────────────────────────────┐
│  User lands on /events/irl           │
│                                      │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Page loads: locations, events,      │
│  guests, followers, topics           │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Select location (card click)        │
│  → URL updates: ?location={name}     │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  View Additional Resources (if any)  │
│  Quick links for location            │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Follow section:                     │
│  • View followers / schedule link    │
│  • "I'm Going" and "+ Follow"        |
|    If a user loggedin, can access it |
|    If not loggedin and user clicks it|
|    -> login prompted                 │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Attendee list:                      │
│  • Switch Upcoming / Past            │
│  • Search, filter, sort              │
│  • Pagination                        │
│  • View only (no Edit / I'm Going    │
│    from row — login required)        │
└──────────────────────────────────────┘
```

#### Admin flow (DIRECTORYADMIN)

```
┌──────────────────────────────────────┐
│  Admin on IRL page, same location    │
│  isAdminInAllEvents = true           │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Follow section: "+ Add attendee"    │
│  → Opens same attendance modal       │
│  (add mode for admin)                │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Attendee list:                      │
│  • Select guests → Floating bar      │
│  • Remove selected guests            │
│  • Per-row: Edit guest, Remove guest │
└──────────────────────────────────────┘
```

#### I’m Going / Presence flow (user or admin add)

```
┌──────────────────────────────────────┐
│  Open "I'm Going" or "+ Add attendee"│
│  (login required for member)         │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Attendance modal:                   │
│  • Gatherings (events) selection     │
│  • Topics, reason, details           │
│  • Optional: arrival/departure,      │
│    office hours, Telegram, etc.      │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Submit → POST presence or guest     │
│  (markMyPresence / createEventGuest) │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Success → Refresh list / close modal│
└──────────────────────────────────────┘
```

### Key Entities

- **Location / Gathering**: An IRL destination (e.g. San Francisco, Bangkok) with a UID; has upcoming and past events, optional resources, and a schedule URL.
- **Event**: A single gathering occurrence (upcoming or past) within a location; members can declare attendance for one or more events.
- **Guest / Attendee**: A member who has declared presence (or was added by admin) for one or more events at a location; has topics, reason, and optional details.
- **Member**: Authenticated user; may be base or advanced access level; advanced can use “I’m Going” and edit own attendance.
- **Follower**: Member subscribed to the location (entity) for updates; displayed in the Follow section.
- **Directory Admin (DIRECTORYADMIN)**: Role that can add, edit, and remove attendees for IRL events at the location.

---

## Technical Architecture

### Architecture Overview

```
┌──────────────────────────────────────┐
│   IRL Page (Next.js App Router)      │
│   - Server Component (Page)          │
│   - getPageData(searchParams)        │
│   - CSS Modules (page.module.css)    │
└──────────────┬───────────────────────┘
               │ props
               ↓
┌──────────────────────────────────────┐
│   Sections (Client Components)       │
│   - IrlHeader                        │
│   - IrlLocation                      │
│   - AddtionalResources               │
│   - IrlFollowGathering→ FollowSection│
│   - AttendeeList                     │
└──────────────┬───────────────────────┘
               ↕
┌──────────────────────────────────────┐
│   Services & Utils                   │
│   - irl.service (API calls)          │
│   - irl.utils (parseSearchParams,    │
│     getFilteredEventsForUser, etc.)  │
│   - preferences.service              │
│   - auth.utils (getAccessLevel)      │
└──────────────┬───────────────────────┘
               ↕
┌──────────────────────────────────────┐
│   DIRECTORY_API_URL                  │
│   (Locations, guests, topics,        │
│    presence, followers, etc.)        │
└──────────────────────────────────────┘
```

### Architectural Patterns

- **Server-first**: Page is a Server Component; data is fetched in `getPageData()`; client sections receive props.
- **URL-driven state**: `searchParams` (location, type, event, search, filters) drive which location/event type and filters are shown.
- **Access levels**: `getAccessLevel(userInfo, isLoggedIn)` returns `base`, `advanced`, or `null`; “I’m Going” and edit attendance are gated for **advanced** (and login). Admin actions are gated by `DIRECTORYADMIN` and `checkAdminInAllEvents`.

---

## Technology Stack

### Core

| Technology | Purpose |
|------------|---------|
| Next.js (App Router) | Server Components, server-side data fetching |
| React | UI components |
| TypeScript | Type safety |
| CSS Modules | Page and component styling (e.g. `page.module.css`) |
| Styled JSX | Component-scoped styles (e.g. IrlHeader, IrlFollowGathering) |

### State & Data

| Technology | Purpose |
|------------|---------|
| Cookies (authToken, userInfo) | Auth and user context via `getCookiesFromHeaders()` |
| URL search params | Location, type, event, filters, pagination |
| Client state (useState, refs) | Modals, dropdowns, selection, pagination in lists |

### Integrations

| Service | Purpose |
|---------|---------|
| Directory backend | Used to load and manage IRL page data: locations (with events), guest/attendee list, topics per location, presence (“I’m Going”) requests, and followers. The IRL page calls it via `DIRECTORY_API_URL` for all locations, guests, topics, presence, and follower APIs. |

---

## Application Structure

### Route

- **Path**: `/events/irl`
- **File**: `app/events/irl/page.tsx`
- **Query params**: `location`, `type` (upcoming | past), `event`, `search`, `attending`, `attendees`, `topics`, `sortBy`, `sortDirection`, etc.

### Page Layout (sections, in order)

| Section | Component | Purpose |
|---------|-----------|---------|
| Header | `IrlHeader` | Title “IRL Gatherings” and short description |
| Locations | `IrlLocation` | Location cards; select location → updates URL |
| Additional Resources | `AddtionalResources` | Quick links for selected location (web + mobile) |
| Follow Gathering | `IrlFollowGathering` | Follow section: followers, “I’m Going”, “Add attendee” (admin), schedule link |
| Attendees | `AttendeeList` | Toolbar (Upcoming/Past, filters), guest table, pagination, floating bar (admin delete) |

### Directory Structure (IRL page and related components)

```
app/events/irl/
├── page.tsx              # Server Component, getPageData, layout
├── page.module.css       # Page layout styles

components/page/irl/
├── irl-header.tsx
├── locations/
│   ├── irl-location.tsx
│   ├── irl-location-card.tsx
│   ├── irl-location-popupView.tsx
│   ├── irl-see-more-location-card.tsx
│   └── pl-button-card.tsx
├── events/
│   ├── addtional-resources.tsx
│   └── link-tab.tsx
├── follow-gathering/
│   ├── irl-follow-gathering.tsx
│   ├── follow-section.tsx
│   ├── follow-button.tsx
│   ├── all-followers.tsx
│   └── presence-request-success.tsx
├── attendee-list/
│   ├── attendees-list.tsx
│   ├── guest-list.tsx
│   ├── guest-table-row.tsx
│   ├── toolbar.tsx
│   ├── attendee-table-header.tsx
│   ├── floating-bar.tsx
│   ├── delete-attendees-popup.tsx
│   └── ...
├── add-edit-attendee/
│   ├── attendee-form.tsx
│   ├── gatherings.tsx
│   ├── attendee-details.tsx
│   └── ...


services/
├── irl.service.ts         # getAllLocations, getGuestsByLocation, createEventGuest, etc.
└── preferences.service.ts # getMemberPreferences

utils/
├── irl.utils.ts           # parseSearchParams, getFilteredEventsForUser, checkAdminInAllEvents, etc.
└── auth.utils.ts          # getAccessLevel
```

### Key Files

- **`app/events/irl/page.tsx`**: Entry; calls `getPageData(searchParams)`, handles `isLocationError` / `isError`, renders sections.
- **`services/irl.service.ts`**: All IRL API calls (locations, guests, presence, topics, followers, CRUD guests).
- **`utils/irl.utils.ts`**: `parseSearchParams`, `getFilteredEventsForUser`, `checkAdminInAllEvents`, `getGatherings`, `filterUpcomingGatherings`, etc.
- **`utils/auth.utils.ts`**: `getAccessLevel(userInfo, isLoggedIn)` for base/advanced.

---

## Authentication & Access

### Access Levels

- **Not logged in**: Can view locations, resources, attendee list; “I’m Going” and edit prompt login.
- **Base (L0/L1)**: Logged in; cannot use “I’m Going” or edit own attendance (advanced-only features).
- **Advanced (L2–L6)**: Can declare “I’m Going” and edit own attendance for upcoming events.

### Admin (IRL events)

- **Role**: `DIRECTORYADMIN` (`ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS`).
- **Condition**: `checkAdminInAllEvents(type, upcomingEvents, pastEvents)` must be true for the current location/event type.
- **Capabilities**: Add attendee, edit any guest, remove guests (single or bulk via floating bar).

### Session

- **Cookies**: `authToken`, `userInfo`, `isLoggedIn` from `getCookiesFromHeaders()`.
- **Usage**: Passed into services for authenticated calls; `userInfo` and `isLoggedIn` passed to child components for gating buttons and modals.

---

## Core Modules & Features

### 1. Header

- **Component**: `IrlHeader`
- **Content**: Title “IRL Gatherings”, short copy (choose destination, view gatherings, attendees, resources, declare presence).
- **Implementation**: `components/page/irl/irl-header.tsx`

### 2. Location Selection

- **Purpose**: When you click a location card, the URL updates to `?location={name}` and the page switches context to that gathering: you see that location’s quick links, followers, “I’m Going” / Add attendee area, and attendee list. “See more” (or mobile popup) lets you choose from additional locations. Selecting a location is required to see location-specific content below.
- **Component**: `IrlLocation` (uses `IrlLocationCard`, `IrlSeeMoreLocationCard`, `IrlLocationPopupView` for mobile).
- **Behavior**: Renders location cards from `locationDetails`; click sets `?location={name}` (and clears `type`/`event`). “See more” expands to show more locations; mobile can use a popup.
- **Data**: `locationDetails` from `getAllLocations()`; `searchParams` for current selection.
- **Implementation**: `components/page/irl/locations/irl-location.tsx`

### 3. Additional Resources (Quick Links)

- **Purpose**: When you use quick links, you open external resources (e.g. schedule, Slack, docs) that organisers have set for that location. First two links are visible inline; “+N more” opens a modal with all links for the selected location.
- **Component**: `AddtionalResources`
- **Behavior**: Shows “Quick Links for {location}” when location has `resources`; first two visible, “+N more” opens modal with all links. Shown for web and mobile in separate sections when `eventDetails?.resources?.length > 0`.
- **Implementation**: `components/page/irl/events/addtional-resources.tsx`

### 4. Follow Gathering

- **Purpose**: When you follow a location, you subscribe to that gathering (entity) so you can receive updates and stay informed. The section also shows who else is following, a link to the external schedule, and (if logged in and eligible) “I’m Going” to declare presence or “Edit my attendance” to update it. Admins see “+ Add attendee” to add another member as a guest.
- **Components**: `IrlFollowGathering` → `FollowSection`
- **Behavior**:
  - **Followers**: List of members following the location (from `getFollowersByLocation`).
  - **Schedule link**: Link to external schedule (e.g. `schedule_url` or `SCHEDULE_BASE_URL` with location and date).
  - **“I’m Going”**: Shown for advanced users who are not yet going and have no upcoming events; opens attendance modal (presence request). Logged-out or base users may see login prompt.
  - **Edit my attendance**: If user is already going, can open same modal in edit mode.
  - **“+ Add attendee”**: Shown only when `canUserAddAttendees` (admin in all events + DIRECTORYADMIN); opens same modal in add mode.
- **Implementation**: `components/page/irl/follow-gathering/irl-follow-gathering.tsx`, `follow-section.tsx`

### 5. Attendee List

- **Purpose**: When you switch Upcoming / Past, the list shows guests for that event type for the selected location. When you search or use filters (attending, attendees, topics, sort), the table updates to show only matching guests. When you select one or more guests (admin), a floating bar appears with “Remove” to delete the selected guests from the event(s). Per-row Edit opens the attendance modal; Remove (admin) removes that guest.
- **Components**: `AttendeeList` → `Toolbar`, `AttendeeTableHeader`, `GuestList` → `GuestTableRow`, `FloatingBar`, `DeleteAttendeesPopup`, `AttendeeForm` (I’m Going modal).
- **Behavior**:
  - **Toolbar**: Switch Upcoming / Past; search; filters (attending, attendees, topics); sort; admin “Add attendee” (if allowed); “Remove” when guests selected.
  - **Table**: Guest rows with avatar, name, topics, reason, events, etc. Per row: View/Edit (opens AttendeeForm), Remove (admin). Custom events (e.g. `OPEN_IAM_GOING_POPUP`, `OPEN_REMOVE_GUESTS_POPUP`, `REFRESH_ATTENDEES_LIST`) coordinate modal open and refresh.
  - **Pagination**: Infinite scroll or page-based via `usePagination` and `getGuestsByLocation` with `currentPage`, `limit`.
- **Implementation**: `components/page/irl/attendee-list/attendees-list.tsx`, `guest-table-row.tsx`, `add-edit-attendee/attendee-form.tsx`

### 6. Add / Edit Attendee (I’m Going modal)

- **Purpose**: When you submit the form, your presence is recorded or updated: for “I’m Going” or admin “Add attendee”, a new guest/presence is created; for “Edit”, existing attendance is updated. You (or the admin) choose which events (gatherings) you’re attending, add topics and reason, and optionally arrival/departure, office hours, Telegram, etc. On success, the list refreshes and the modal closes.
- **Component**: `AttendeeForm`
- **Modes**: New (I’m Going), Edit (own or admin), Add (admin adding another member).
- **Fields**: Gatherings (events) selection, topics, reason, optional details (arrival/departure, office hours, Telegram, etc.). Validation and submit call `createEventGuest`, `markMyPresence`, or `editEventGuest` as appropriate.
- **Implementation**: `components/page/irl/add-edit-attendee/attendee-form.tsx`

---

## API Integration

### Web API Endpoints

**Base URL**: `DIRECTORY_API_URL` environment variable

#### Locations & events

- `GET /v1/irl/locations?pagination=false` - Get all IRL locations (with upcoming/past events, sorted)

#### Guests & attendance

- `GET /v1/irl/locations/{locationId}/guests?page=&limit=&type=&...` - Get guests for location (with searchParams)
- `GET /v1/irl/locations/{locationId}/me/events` - Get logged-in user’s events at location
- `POST /v1/irl/locations/{locationId}/me/presence-request?type={type}` - Submit “I’m Going” (presence request)
- `POST /v1/irl/locations/{locationId}/guests?type={type}` - Create guest (admin add or member submit)
- `PUT /v1/irl/locations/{locationId}/guests/{guestUid}?type={type}` - Update guest
- `POST /v1/irl/locations/{locationId}/events/guests` - Delete guest(s) (payload-driven)

#### Topics & followers

- `GET /v1/irl/locations/{locationId}/topics?type={type}` - Get topics for location
- `GET /v1/irl/locations/{locationId}/guests/{userId}/topics` - Get topics and reason for user at location
- `GET /v1/member-subscriptions?entityUid={locationId}&isActive=true&pagination=false&select=...` - Get followers for location

#### Other

- `DELETE /v1/irl/locations/{locationId}/events/{eventId}` - Delete event (admin)

### Preferences

- Member preferences (e.g. Telegram visibility) via `preferences.service` (e.g. `getMemberPreferences(userId, authToken)`).

---

## Glossary

| Term | Definition |
|------|------------|
| **IRL Gatherings** | In-real-life gathering destinations (locations) with events and attendees in the Directory app. |
| **Location / Gathering** | A destination (e.g. San Francisco) with UID, upcoming/past events, optional resources and schedule URL. |
| **Event** | A single occurrence (upcoming or past) within a location; members can declare attendance for events. |
| **Guest / Attendee** | A member who has declared presence (or was added by admin) for one or more events at a location. |
| **I’m Going** | User flow to declare presence for upcoming events; opens attendance modal (topics, reason, events). |
| **Presence request** | API flow for submitting “I’m Going” (e.g. `markMyPresence`). |
| **Directory Admin (DIRECTORYADMIN)** | Role allowed to add, edit, and remove IRL attendees for the location. |
| **Access level** | `base` (L0/L1) or `advanced` (L2–L6); “I’m Going” and edit attendance require advanced. |
| **searchParams** | URL query (location, type, event, search, filters) driving which data is shown. |
| **getPageData** | Server-side function in the IRL page that fetches locations, events, guests, followers, topics, and preferences. |
