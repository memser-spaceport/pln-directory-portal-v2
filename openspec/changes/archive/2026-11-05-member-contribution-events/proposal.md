## Why

Team news posts and Contact Support submits do not reach PostHog, so the Members contribute metric cannot count them (LAB-3165, LAB-3168).

## What Changes

- Opening the team-news composer and a successful publish record the existing events.
- A successful Contact Support submit records `contact-support-submitted` with the topic and page path.

## Capabilities

### Modified Capabilities

- `team-news`: posting records the two create events.
- `feedback`: a successful support submit records one event.
