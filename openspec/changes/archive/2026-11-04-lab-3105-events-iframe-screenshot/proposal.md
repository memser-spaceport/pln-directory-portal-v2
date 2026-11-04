## Why

LAB-3105 (https://linear.app/protocollabs/issue/LAB-3105): feedback sent from the events page shows a blank area where the events calendar sits. The calendar is a cross-origin iframe, and a page screenshot cannot see inside it.

## What Changes

- The events embed loads the LabOS bridge when a trusted directory frames it.
- The events page marks that iframe. The feedback screenshot asks the bridge for the calendar picture and paints it where the iframe sits.
- A page with no such iframe screenshots as before. If the calendar does not answer, the screenshot still shows the LabOS page.

## Capabilities

### New Capabilities

### Modified Capabilities

- `feedback`: the page screenshot shows an embedded events calendar.

## Impact

The LabOS events page and the events embed. Other feedback screenshots stay as they are.
