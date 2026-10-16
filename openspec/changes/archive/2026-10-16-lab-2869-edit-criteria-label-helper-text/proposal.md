## Why

LAB-2869 (https://linear.app/protocollabs/issue/LAB-2869): in the "Edit criteria" modal of a role's Suggested candidates, the free-text box is labelled "Tell us who you're looking for". Nothing tells the lead that the AI matching reads this text, so leads do not know that what they write changes the suggestions.

## What Changes

- The box label reads "Help us suggest better members for <role title>." When the role has no title, it reads "Help us suggest better members for this role." (copy from Polina, 2026-10-16).
- Under the label, a helper text reads "Tell the AI who you're looking for".
- Screen readers read the helper text and the character counter together with the box.
- The 500-character limit, the counter, the placeholder and the save action do not change.

Out of scope: the modal's footer note (LAB-2857) and the other LAB-2837 tasks; analytics.

## Capabilities

### New Capabilities

### Modified Capabilities
- `job-board`: the "Edit a role's match criteria" requirement no longer names the box label; a new requirement states the label and the helper text.

## Impact

- Team page, Open roles, Suggested candidates, "Edit criteria" modal: the free-text box label and a new helper text under it.
