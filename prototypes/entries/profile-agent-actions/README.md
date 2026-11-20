# profile-agent-actions

Member and team profiles where the header's contact press is a way into the Agent. `?profile=team` switches to the team profile.

## What changed from member-profile / team-profile

- **Make a request** (glossy press, where Schedule Meeting / Request an intro stood) opens a menu titled "Ask the agent to":
  - Member: **Book office hours**.
  - Team: **Request an intro** (shows "Intro requested" once sent) and **Book office hours** (with someone on the team).
  - Both: **Something else** opens the agent on the profile.
- Picking an item opens the Agent drawer with the request already sent:
  - Book office hours: the agent shows three open slots from the booking link and a drafted note, and books only when you press **Book**. **Other times** opens the booking page. On a team, it first asks which person who takes office hours you want to meet.
  - Request an intro: a drafted request to the PL team. It's sent only on **Send**, and it's written to intro-shared's store.
- **Schedule Meeting is back on the Office Hours card**, on the right of the description, as in production.
- A member without office hours gets no press. Booking needs a link, and intros to members aren't offered today. The corner Agent button is still there.

## Files

- `AgentRequestMenu.tsx`: the press and the menu. Uses production's glossy class and NewsShareMenu's menu chrome.
- `requests.tsx`: the agent's scripted replies and the booking and intro cards.
- Shared, optional props that change nothing for other entries:
  - `MemberProfilePage`: `contactAction`, `scheduleOnCard`, `reviewBandExtra`.
  - `TeamProfilePrototype`: `contactPress`, `initialView`.
  - `agent/AgentDrawer`: `send`.
  - `agent/AgentChat`: `initialSend`.

## Open questions

- Ask AI and Make a request are now two AI doors side by side in the header. Should Ask AI move into the menu as "Ask about Maya"?
- On a member with no office hours, should the press stay and offer an intro once member intros exist?
- The press is labelled "Make a request". The alternatives were "Ask the agent" and an icon-only agent button.
