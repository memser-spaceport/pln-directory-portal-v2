# Proposal

## Why

The PLAA nav "Feedback" link opens a Google Form, and submissions land in a sheet nobody else sees. Members cannot see what others asked for, cannot signal demand, and never hear back, so the same requests get resubmitted and the loop feels one way. The team then retypes useful submissions into Linear by hand.

A visible, closed-loop board that files straight into Linear gives members a voice and the team a demand signal with zero retyping. This is a new data domain, so it is born in Postgres: no Airtable, no sync job.

Source: `FEATURE-PLAAFeedbackBoard` v1.1 (Bill Warren, 2026-10-21). LAB ticket: TBD. Linear: TBD (team PLAA).

## What Changes

- A Feedback page at `/alignment-asset/feedback` with tabs for Ideas, Roadmap, Completed, My submissions, and Triage (admins only), plus a shareable item page at `/alignment-asset/feedback/[id]`.
- A **Give feedback** modal: type (New feature, Bug, Improvement), title, description, up to 3 screenshots, an optional https link, and an optional "Why is this important?".
- Every submission creates one Linear issue in team PLAA, with the type label and screenshots embedded. One way only: nothing flows back from Linear in v1.
- Ideas list with upvote, type and status filters, and Top/New sort.
- Roadmap Kanban: Under Review, To Do, In Progress, Completed (last 90 days). Columns become tabs under 768px.
- Item detail with the status timeline, a duplicate banner, and comments.
- Bugs are private to their author and admins, and never appear on the Roadmap or Ideas list.
- Admin controls for an allowlist of LabOS member UIDs: move status with a public note, change type, mark duplicates, hide comments, remove spam, retry a failed Linear push.
- The nav "Feedback" link swaps from the Google Form to the board when `NEXT_PUBLIC_PLAA_FEEDBACK_BOARD=true`. Off by default.

## Capabilities

### New Capabilities

- `plaa-feedback`: what a PLAA member can submit, see, vote on and comment on, and what an admin can move; who may see a private bug; and how a submission reaches Linear.

### Modified Capabilities

None. The PLAA nav entry changes its target behind a flag; no existing capability changes its contract.

## Out of scope

Copied from the PRD's scope boundaries:

- Any Linear → PLAA sync (status, comments, edits, webhooks).
- Propagating PLAA-side edits, comments, votes, duplicates, or status moves to Linear after the issue is created.
- An audit log table.
- Object storage, or showing screenshots on the board.
- Email, Slack, or push notifications to voters.
- PLAA points or any reward tied to feedback activity.
- Threaded replies, reactions, @mentions, markdown or rich text.
- A global feedback widget on other PLAA pages.
- Access for logged-out users or anyone failing `canViewPlaa`.
- A new RBAC role or permission.
- Importing historic Google Form responses.
- Any change to `plaa-sync`, Airtable, the points ledger, or Rights data.
