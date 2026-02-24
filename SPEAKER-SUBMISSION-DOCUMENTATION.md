# Speaker Submission — Technical Documentation

## IRL Page — Speaker Request Feature

> **Repository**: [pln-directory-portal-v2](https://github.com/memser-spaceport/pln-directory-portal-v2)

> **Scope**: This document covers only the speaker submission feature on the IRL Gatherings page: “Be a Speaker” flow in the Directory application.Approval or rejection of submitted requests is performed in the Event Management admin page [pl-events-submission](https://github.com/memser-spaceport/pl-events-submission)(external application).

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

The speaker submission feature allows authenticated members to request to speak at an IRL gathering (location). Submissions are created on the Directory IRL page and are reviewed in a external Event Management (admin) application.

- **Directory application (IRL page)**: Members see a “Be a Speaker” control per location; they can submit a request (description, topics, optional files) and later see status (APPROVED with event list).

The admin flow of approve, reject, or manually add speakers flow are implemented in a external application [pl-events-submission](https://github.com/memser-spaceport/pl-events-submission).

One speaker request per member per location is supported.

### Complete Workflow

#### User flow (Directory — IRL page)

```
┌──────────────────────────────────────┐
│ Member on IRL page, location selected│
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Clicks "Be a Speaker"               │
│  (Not logged in → redirect to #login)│
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Speaker Request modal opens         │
│  • Requesting as (from profile)      │
│  • Speaker Description* (required)   │
│  • Topics* (required, multi-select)  │
│  • Attach files (optional, 4MB,      │
│    PNG/JPEG/PDF)                     │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Submits "Send Request"              │
│  POST /v1/internals/irl/speaker-     │
│  requests                            │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Request stored — status: PENDING    │
└──────────────┬───────────────────────┘
               │
               ↓ (after admin approves the speaker request in external application(Events Management))
┌──────────────────────────────────────┐
│  Status: APPROVED; events linked     │
│  "Approved (N event(s))" + dropdown  │
│  of approved events                  │
└──────────────────────────────────────┘
```

### Key Entities

- **Gathering / Location**: IRL gathering (e.g. San Francisco) identified by a location UID; one speaker request per member per location.
- **Speaker request**: A member’s request to speak at that gathering; has status PENDING, APPROVED, or REJECTED.
- **Member**: Authenticated user who can submit a request via “Be a Speaker” and see approved events on the IRL page.
- **Events**: Individual events within a gathering; when approved, the admin links one or more events to the speaker.
- **Directory application**: This app (pln-directory-portal-v2); IRL page and speaker-section components.
---

## Technical Architecture

### Architecture Overview (Speaker Only)

```
┌──────────────────────────────────────┐
│   IRL Page (app/events/irl/page.tsx) │
│  Renders SpeakerSection + SpeakerForm│
└──────────────┬───────────────────────┘
               │ props (eventLocationSummary, userInfo, currentGuest / isLoggedIn)
               ↓
┌──────────────────────────────────────┐
│   Speaker Section (Client)           │
│  • SpeakerSection (banner + button)  │
│  • SpeakerButton (Be a Speaker /     │
│    Approved + dropdown; status fetch)│
│  • SpeakerForm (listens for popup    │
│    event, renders SpeakerRequestForm)│
│  • SpeakerRequestForm (modal, submit)│
└──────────────┬───────────────────────┘
               ↕ DOM events (OPEN_SPEAKER_REQUEST_POPUP, SPEAKER_REQUEST_SUBMITTED)
┌──────────────────────────────────────┐
│   Services                           │
│  • irl.service: submitSpeakerRequest,│
│    getSpeakerRequestStatus           │
└──────────────┬───────────────────────┘
               ↕
┌──────────────────────────────────────┐
│   DIRECTORY_API_URL                  │
│   POST/GET speaker-requests          │
└──────────────────────────────────────┘
```

### Patterns

- **Client-only**: Speaker UI is client components; no server-side speaker data in `getPageData` (status is fetched in `SpeakerButton`).
- **Custom DOM events**: `OPEN_SPEAKER_REQUEST_POPUP` (open modal), `SPEAKER_REQUEST_SUBMITTED` (update button to PENDING after submit).
- **One request per location**: Submission and status are scoped by `locationUid` and `memberUid`.

---

## Technology Stack

### Core

| Technology | Purpose |
|------------|---------|
| Next.js (App Router) | Server Components, server-side data fetching |
| React | UI components |
| TypeScript | Type safety |
| Styled JSX | Component-scoped styles in speaker-section and speaker-button. |


### State & Data

| Technology | Purpose |
|------------|---------|
| Cookies (authToken, userInfo) |`authToken` for API calls; unauthenticated users are sent to `#login` when clicking “Be a Speaker”. |
| Client state (useState, refs) | Modals, dropdowns, selection |

### Integrations

| Service | Purpose |
|---------|---------|
| Directory backend | Used to submit and get speaker-request status via `DIRECTORY_API_URL` |

---

## Application Structure

### Where It Lives on the IRL Page

- **Page**: `app/events/irl/page.tsx`
- **Sections**: After Follow Gathering, the page renders:
  - `<SpeakerSection eventLocationSummary={...} userInfo={...} currentGuest={...} />`
  - `<SpeakerForm userInfo={...} eventLocationSummary={...} isLoggedIn={...} />`

No speaker-specific data is fetched in `getPageData`; the speaker section uses `eventLocationSummary` and `userInfo` from the page and fetches status in the client.

### Directory Structure (Speaker-Section Only)

```
components/page/irl/speaker-section/
├── speaker-section.tsx      # Banner + copy + SpeakerButton
├── speaker-button.tsx      # Be a Speaker / Approved (N events) + dropdown; fetches status; opens modal
├── speaker-form.tsx        # Listens for OPEN_SPEAKER_REQUEST_POPUP; renders SpeakerRequestForm when open
├── speaker-request-form.tsx # Modal: requesting as, description, topics, files; submit; dispatches SPEAKER_REQUEST_SUBMITTED
```

### Custom Events (DOM)

| Event                     | Constant                         | Dispatched by        | Listened by   | Purpose |
|---------------------------|----------------------------------|----------------------|---------------|--------|
| Open speaker popup        | `EVENTS.OPEN_SPEAKER_REQUEST_POPUP` | SpeakerButton on click | SpeakerForm   | Open request modal. |
| Speaker request submitted | `EVENTS.SPEAKER_REQUEST_SUBMITTED`  | SpeakerRequestForm after submit | SpeakerButton | Set status to PENDING, clear approved list for location. |

---

## Authentication & Access

- **Not logged in**: “Be a Speaker” click redirects to `{pathname}{search}#login`; user must sign in to submit.
- **Logged in**: User can open the modal and submit (memberUid from `userInfo.uid`). Status is fetched with `authToken`.
---

## Core Modules & Features

### 1. SpeakerSection

- **Purpose**: Renders the speaker banner (icon + copy: “Contribute as a speaker…”) and the SpeakerButton.
- **Component**: `speaker-section.tsx`
- **Props**: `eventLocationSummary`, `userInfo`, `currentGuest`.
- **Implementation**: `components/page/irl/speaker-section/speaker-section.tsx`

### 2. SpeakerButton

- **Purpose**: When the user clicks “Be a Speaker” , the app checks auth; if not logged in, redirects to `#login`. If logged in, dispatches `OPEN_SPEAKER_REQUEST_POPUP` so the modal opens. On load it fetches speaker request status for the current location and member; if status is **APPROVED** it shows “Approved (N event(s))” with a dropdown of approved events. After a new submit it listens for `SPEAKER_REQUEST_SUBMITTED` and sets local state to PENDING for that location.
- **Component**: `speaker-button.tsx`
- **Behavior**: Fetches `getSpeakerRequestStatus(locationId, memberUid, authToken)` on mount; shows Loading, “Be a Speaker”, or “Approved (N events)” + dropdown; click opens modal or toggles dropdown.
- **Implementation**: `components/page/irl/speaker-section/speaker-button.tsx`

### 3. SpeakerForm

- **Purpose**: Listens for `OPEN_SPEAKER_REQUEST_POPUP`; when `detail.isOpen` is true, renders SpeakerRequestForm so the modal is visible. No other logic.
- **Component**: `speaker-form.tsx`
- **Implementation**: `components/page/irl/speaker-section/speaker-form.tsx`

### 4. SpeakerRequestForm (Modal)

- **Purpose**: When the user submits the form, the app validates description and at least one topic, then calls `submitSpeakerRequest({ memberUid, locationUid, description, tags }, authToken)`. On success it shows a success toast, dispatches `SPEAKER_REQUEST_SUBMITTED` with `locationId`, and closes the modal. Optional file attachments (PNG, JPEG, PDF, max 4 MB) are supported in the UI.
- **Component**: `speaker-request-form.tsx`
- **Fields**: Requesting as (read-only from profile), Speaker Description (required), Topics (required, multi-select + custom), Attach files (optional).
- **Implementation**: `components/page/irl/speaker-section/speaker-request-form.tsx`

---

## API Integration

### Directory Application (Speaker Only)

**Base URL**: `DIRECTORY_API_URL`

#### Submit speaker request

- `POST /v1/internals/irl/speaker-requests` — Submit a speaker request.  
  **Headers**: `Authorization: Bearer {authToken}`, `Content-Type: application/json`.  
  **Body**: `{ memberUid, locationUid, description, tags }`.  
  **Used by**: `SpeakerRequestForm` via `submitSpeakerRequest` in `irl.service`.

#### Get speaker request status

- `GET /v1/internals/irl/locations/{locationId}/members/{memberUid}/speaker-requests` — Get status and, if APPROVED, the list of events.  
  **Headers**: `Authorization: Bearer {authToken}`.  
  **Used by**: `SpeakerButton` via `getSpeakerRequestStatus` in `irl.service`.
---

## Glossary

| Term | Definition |
|------|------------|
| **Speaker request** | A member’s request to speak at a specific IRL gathering; one per member per location; |
| **Be a Speaker** | The primary CTA on the IRL page that opens the speaker request modal (or redirects to login). |
| **APPROVED** | Admin approved the request; one or more events are linked; member sees “Approved (N event(s))” and dropdown. |
| **Directory application** | pln-directory-portal-v2; IRL page and speaker-section live here. |