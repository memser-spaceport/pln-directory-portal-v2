# LAB-3278 event QA corrections

## Why

The event form and the event summary did not keep or show all the details that a host entered. Some form checks also occurred too late.

## What changes

- **LAB-3442, LAB-3448, LAB-3449, LAB-3453**: Limit the description in the editor, keep custom tags, align host fields, and validate host email before save.
- **LAB-3450, LAB-3452, LAB-3455**: Show social handles and the website on Submit. Use the X/Twitter label without a data change.
- **LAB-3447, LAB-3451, LAB-3454, LAB-3456**: Show verified venues, venue instructions, social links, and independent website and registration links.

## Scope

The Events capability changes. The frontend uses the current event API. Agenda provider access and Home date display are separate.
