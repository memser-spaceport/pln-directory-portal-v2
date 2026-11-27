# Proposal

## Why

[LAB-3466](https://linear.app/protocollabs/issue/LAB-3466/bug-contact-details-hidden-from-members-when-the-visibility-toggle-is): the profile switch treats a missing contact flag as on, and the profile fetch deletes the contact. Other members then see empty contact rows.

## What Changes

- A contact field is removed for other members only when its flag is false.
- A missing flag leaves the field in place, matching the switch.

## Capabilities

### New Capabilities

### Modified Capabilities

- `profiles`: an approved member sees contact details when the switch is on, including when the flags were never saved, and does not see them when the switch is off.

## Impact

- `hidePreferences` in the member profile fetch. Signed-out visitors, Job Aspirants, and office hours stay as they are.
