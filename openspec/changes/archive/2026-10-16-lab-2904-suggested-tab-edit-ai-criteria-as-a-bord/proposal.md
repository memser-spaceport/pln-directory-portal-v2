# Proposal

## Why

LAB-2904 (https://linear.app/protocollabs/issue/LAB-2904): on the team candidates page, the Suggested tab opens Edit criteria from a brand-coloured "Edit criteria" text link at the end of the tab note. QA reported the link as missing (LAB-2892): one coloured word at the end of a sentence is easy to miss. The Suggested tab also shows the "Search by name or role" field, although it lists at most five people.

## What Changes

- Under the Suggested note, a small bordered grey button with the AI mark and the label "Edit AI criteria" opens the Edit criteria modal. It shows only when the role has criteria to edit.
- The "Edit criteria" text link at the end of the note goes away. The note text does not change.
- The Suggested tab has no search field; the button takes its place. Applied and Interested keep the search, and a term typed there does not filter Suggested.
- The modal title reads "Edit AI criteria" and its subtitle reads "What the AI matches members against for <role title>."

Out of scope: the `?edit=criteria` auto-open (LAB-2853, LAB-2893) stays as it is; the prompt box label and helper text (LAB-2869); the Contact flow.

## Capabilities

### New Capabilities

### Modified Capabilities
- `job-board`: where a lead opens Edit criteria on the Suggested tab, the modal title and subtitle, and the search on the Suggested tab.

## Impact

- Team candidates page (`/teams/<id>/applicants`), Suggested tab: the note, the new button, no search field.
- Edit criteria modal: title and subtitle.
