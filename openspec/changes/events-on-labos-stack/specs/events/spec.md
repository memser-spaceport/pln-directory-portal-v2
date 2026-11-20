# Spec Delta

## ADDED Requirements

### Requirement: Anyone can open the submit form

`/events/submit` SHALL show the form "Submit Event" to signed-in members and to signed-out visitors. A signed-out visitor SHALL also see a required contact email and a "Sign in" link that returns to the form, and SHALL NOT see "Save as draft". The page SHALL have a back control to `/events/all`.

#### Scenario: A signed-in member opens the form

- **GIVEN** a signed-in member
- **WHEN** they open `/events/submit`
- **THEN** the form shows with "Save as draft" and "Submit Event" and no contact email field

#### Scenario: A signed-out visitor opens the form

- **GIVEN** a signed-out visitor
- **WHEN** they open `/events/submit`
- **THEN** the form shows a required contact email, a "Sign in" link and "Submit Event" only

### Requirement: The form keeps the old portal's sections and order

The form SHALL show, top to bottom: the access option, the registration link, the logo with the event name, the format with the venue location and the meeting link, the start and end with the time zone, the description with the agenda, the tags, and the host with co-hosts. Pressing Enter in a single-line field SHALL NOT submit the form.

#### Scenario: Enter in the host field

- **GIVEN** the cursor in the host name field
- **WHEN** the visitor presses Enter
- **THEN** nothing is sent

### Requirement: Access option

The access option SHALL be one choice of "Free/Rsvp", "Paid" and "Invite Only", and SHALL start as "Free/Rsvp".

#### Scenario: Default access

- **WHEN** a visitor opens the form
- **THEN** the access option reads "Free/Rsvp"

### Requirement: Event logo

The logo SHALL be optional. It SHALL accept a PNG or JPEG of at most 4 MB whose width and height differ by at most 10 px. A file that fails SHALL NOT be attached, the earlier logo SHALL stay, and the form SHALL say "Image size should be less than 4MB" or "Image must have a 1:1 aspect ratio". A set logo SHALL offer replace and delete. The file SHALL be uploaded only when the form is sent.

#### Scenario: A wide image

- **WHEN** the visitor picks a 1200 x 600 image
- **THEN** the form says "Image must have a 1:1 aspect ratio" and no logo is set

#### Scenario: A large image

- **WHEN** the visitor picks a 6 MB square image
- **THEN** the form says "Image size should be less than 4MB"

### Requirement: Event name

The event name SHALL be a title-sized plain text field with the placeholder "Enter Event Name" and a limit of 100 characters; extra characters SHALL be cut while typing.

#### Scenario: A long name

- **WHEN** the visitor pastes 150 characters into the name
- **THEN** the field holds the first 100

### Requirement: Format decides the location fields

The format SHALL be one choice of "In Person" (default), "Online" and "Hybrid". In Person SHALL show the venue location. Online SHALL show the meeting link. Hybrid SHALL show both. Changing the format SHALL clear the venue location, the instruction and the meeting link. The meeting link SHALL have the placeholder "Enter Meeting Link" and SHALL be optional.

#### Scenario: From In Person to Online

- **GIVEN** an In Person event with a venue typed
- **WHEN** the visitor picks Online
- **THEN** the venue field is gone, its value is cleared, and the meeting link field shows

### Requirement: Venue location with suggestions and a map

The venue location (placeholder "Enter Venue Location") SHALL be optional and SHALL suggest places while the visitor types. Picking a suggestion or pressing Enter SHALL resolve the place: its city, region, country, position and map link are kept, a small map shows the place, and an "Instruction" field (placeholder "8th Floor, 2nd Building, etc.") appears. Text that is not resolved SHALL still be accepted as the address. Emptying the field SHALL drop the resolved place.

#### Scenario: A suggestion is picked

- **GIVEN** the visitor typed "Avenida da Liberdade"
- **WHEN** they pick a suggestion in Lisbon
- **THEN** a small map shows the place and the Instruction field appears

#### Scenario: Free text

- **GIVEN** the visitor typed "My friend's garage" and picked nothing
- **WHEN** they submit an otherwise valid form
- **THEN** the event is sent with that text as its address and no city

### Requirement: The time zone follows the picked place

When the visitor resolves a venue location, the time zone SHALL switch to that place's time zone, without a message. The typed dates and times SHALL keep their clock values. A failed lookup SHALL change nothing.

#### Scenario: A venue in Tokyo

- **GIVEN** the time zone Europe/Lisbon and a start of 10:00
- **WHEN** the visitor picks a venue in Tokyo
- **THEN** the time zone reads Asia/Tokyo and the start still reads 10:00

### Requirement: Start and end

"Start Date" and "End Date" SHALL each have a date picker and a time list in 15-minute steps. The start calendar SHALL disable days after the end, and the end calendar days before the start. Past dates SHALL be allowed. Picking a date SHALL reset that field's time to 12:00 AM. When the end day equals the start day, the end time SHALL be set to 23:45. On one day, the lists SHALL disable start times at or after the end and end times at or before the start.

#### Scenario: Same-day event

- **GIVEN** a start date of Dec 3
- **WHEN** the visitor picks Dec 3 as the end date
- **THEN** the end time reads 23:45

#### Scenario: End before start is not offered

- **GIVEN** a start of Dec 3, 10:00 and an end date of Dec 3
- **WHEN** the visitor opens the end time list
- **THEN** 10:00 and every earlier time are disabled

### Requirement: Time zone picker

The time zone SHALL be picked from a searchable list (placeholder "Search timezone", empty result "No timezones found") and SHALL start as the visitor's own time zone. Changing it SHALL keep the typed clock values.

#### Scenario: Default time zone

- **WHEN** a visitor whose browser is in Europe/Lisbon opens the form
- **THEN** the time zone reads Europe/Lisbon

### Requirement: Description

The description SHALL be optional rich text, opened with "Add Description", with the placeholder "Enter description" and the tools bold, italic, strikethrough, underline, link, two heading levels, bullet and numbered lists and four alignments. A description with no text SHALL be sent as empty. Wherever LabOS shows a description, it SHALL show only safe formatting.

#### Scenario: A formatted description

- **WHEN** the visitor types a heading and a bullet list and submits
- **THEN** the event drawer shows the heading and the list

#### Scenario: A script in the description

- **GIVEN** an event whose description holds a script tag
- **WHEN** its drawer opens
- **THEN** the script does not run and is not shown

### Requirement: Agenda from pasted text

The description SHALL show the hint "Type /Agenda to Add Agenda". The command SHALL open the agenda box: a sample "Agenda Format" card, one text area ("Paste or Type Date, Time, Title and Description of the Agenda"), "Cancel" and "Add". "Add" SHALL turn the text into sessions grouped by day, shown as "start – end • title" in the event's time zone. An agenda SHALL offer "Add/Edit" and "Remove all", which asks "Remove All Agenda Items?" first.

#### Scenario: A one-day agenda

- **GIVEN** an event on Jan 28 and the text "10:00 AM - 10:30 AM Opening Ceremony"
- **WHEN** the visitor presses "Add"
- **THEN** the agenda shows "Day 1" with "10:00 AM – 10:30 AM • Opening Ceremony"

#### Scenario: No dates yet

- **GIVEN** no start or end date
- **WHEN** the visitor presses "Add" on agenda text
- **THEN** the form says "Please select start and end date before adding agenda items."

#### Scenario: Text with no times

- **WHEN** the visitor adds agenda text that has no times
- **THEN** the form shows a message that times are missing and keeps the text

### Requirement: Agenda sessions stay inside the event

When the form is sent with an agenda, in any mode, each session SHALL be inside the event's start and end and SHALL end after it starts. Otherwise the form SHALL show a message under the agenda that names the session and SHALL send nothing. Changing the event's time zone SHALL keep each session's clock time.

#### Scenario: A session after the event ends

- **GIVEN** an event that ends on Jan 28 and an agenda session on Jan 29
- **WHEN** the visitor presses "Submit Event"
- **THEN** the form says the session is after the event ends and nothing is sent

### Requirement: Tags

"Choose Event tag(s)" SHALL offer the chips "Talks & Presentation", "Hackathon", "Workshop", "Art Exhibition" and "Social Event", with "Talks & Presentation" selected on a new form, and a field "Type your tag here" where Enter adds a custom tag that can be removed. A custom tag that already exists SHALL be ignored.

#### Scenario: A custom tag

- **WHEN** the visitor types "Demo Day" and presses Enter
- **THEN** a "Demo Day" chip is added and the form is not sent

### Requirement: Host and co-hosts

The host section SHALL have a host name ("Enter Host Name") and an optional host email ("Enter Host Email"). "Add Co-Host" SHALL add a row with a name and an optional email, and each row SHALL have a remove control. The title SHALL read "Host (N)", where N counts the host and the co-hosts.

#### Scenario: Two co-hosts

- **WHEN** the visitor adds two co-host rows
- **THEN** the title reads "Host (3)"

### Requirement: Registration link with import from Luma

The registration link ("Enter Registration Link") SHALL be optional. When it is a `luma.com` or `lu.ma` address, the form SHALL show "Luma Link Detected! Submit faster with auto-import" and "Fetch from Luma". Fetching SHALL show "Importing From Luma..." and then fill the form from the Luma event. After it, the strip SHALL read "Details in this form were imported from the above Luma link" with "Fetch Again". A failed fetch SHALL show a message and change nothing.

#### Scenario: A Luma link

- **GIVEN** the registration link `https://lu.ma/abc`
- **WHEN** the visitor presses "Fetch from Luma"
- **THEN** the name, logo, dates, time zone, format, location, access, description, agenda, tags and host are filled from the Luma event
- **AND** the strip offers "Fetch Again"

#### Scenario: A private Luma event

- **GIVEN** a Luma link the import cannot read
- **WHEN** the visitor presses "Fetch from Luma"
- **THEN** a message says the event could not be imported and the form is unchanged

#### Scenario: Another site

- **GIVEN** the registration link `https://example.com/event`
- **THEN** no Luma strip shows

### Requirement: Website link and social handles on the edit page

The edit page SHALL also show "Website Link" ("Enter Website Link") and "Social Handles". Social Handles SHALL be rows of a platform (Twitter, Discord, Bluesky, Mastodon, Telegram, Email) and a handle ("Enter your handle"), with "Add More" and a remove control. A handle that is not a web address SHALL be turned into the platform's profile address when sent. The submit page SHALL NOT show these two.

#### Scenario: A Twitter handle

- **GIVEN** the edit page with the handle "@plabs" on Twitter
- **WHEN** the member saves
- **THEN** the event stores `https://x.com/plabs`

#### Scenario: A handle with no platform

- **GIVEN** a handle typed in a row with no platform chosen
- **WHEN** the member saves
- **THEN** the row says "Please select a platform" and nothing is sent

### Requirement: Submit Event checks the form

"Submit Event" SHALL send nothing while a check fails, SHALL show each message under its field and SHALL scroll to the first one. The checks SHALL be: "Event name required"; "Start date and end date is required"; "Time zone is required"; "At least one tag is required"; "Enter a valid host name"; "Co-host name is required"; "Enter a valid email" for a co-host or contact email; "Enter a valid registration link"; "Enter a valid website link"; and the social handle and agenda checks.

#### Scenario: No tag

- **GIVEN** a form with every tag removed
- **WHEN** the visitor presses "Submit Event"
- **THEN** the tag box says "At least one tag is required" and nothing is sent

#### Scenario: No host

- **GIVEN** a form with an empty host name
- **WHEN** the visitor presses "Submit Event"
- **THEN** the host section says "Enter a valid host name"

#### Scenario: No location is allowed

- **GIVEN** an In Person event with no venue location and every required field filled
- **WHEN** the visitor presses "Submit Event"
- **THEN** the event is sent

### Requirement: Save as draft

"Save as draft" SHALL be offered to signed-in members. It SHALL need only the event name, the start and end and the time zone; filled social handles and an agenda SHALL still be checked. On success it SHALL say "Draft Event Created Successfully" and open the event's edit page. A draft SHALL be visible to its submitter only.

#### Scenario: A draft with no tag and no host

- **GIVEN** a form with a name, dates and a time zone only
- **WHEN** the member presses "Save as draft"
- **THEN** the draft is saved and its edit page opens

#### Scenario: A draft with no name

- **GIVEN** a form with no name
- **WHEN** the member presses "Save as draft"
- **THEN** the form says "Event name required"

### Requirement: Clear form and Preview

"Clear form" SHALL ask "Are you sure you want to clear this form?" with "Clicking confirm will remove all information you've entered in the event submission form". On confirm it SHALL reset every field and say "Form has been cleared successfully"; nothing SHALL be sent, and on the edit page the event itself SHALL stay. "Preview" SHALL show the event as LabOS will show it, from the values typed so far, with a way back to the form.

#### Scenario: Clear is cancelled

- **GIVEN** a filled form
- **WHEN** the visitor presses "Clear form" and then "Cancel"
- **THEN** the form is unchanged

#### Scenario: Preview

- **GIVEN** a form with a name and dates
- **WHEN** the visitor presses "Preview"
- **THEN** the event shows as it will look, and "Back" returns to the form with its values

### Requirement: After Submit Event

A sent form SHALL be sent once; the button SHALL be disabled while the request runs. For a signed-in member, success SHALL say "Event Created Successfully" and open the event's edit page, which shows the event's status: "Approved" when the backend published it, "Submitted" when it waits for approval. A signed-out visitor SHALL see, in place of the form, that the event was received and waits for approval, with "Submit another event". The page SHALL NOT decide the status itself.

#### Scenario: A member with forum access submits

- **GIVEN** a signed-in member whose submission the backend publishes
- **WHEN** they submit a valid form
- **THEN** the message "Event Created Successfully" shows and the edit page of the new event opens with the status "Approved"

#### Scenario: A member without forum access submits

- **GIVEN** a signed-in member whose submission the backend holds
- **WHEN** they submit a valid form
- **THEN** the edit page of the new event opens with the status "Submitted"

#### Scenario: A signed-out visitor submits

- **GIVEN** a signed-out visitor with a valid form and a contact email
- **WHEN** they submit
- **THEN** the page says the event was received and waits for approval

#### Scenario: Double press

- **GIVEN** a valid form
- **WHEN** the visitor presses "Submit Event" twice quickly
- **THEN** one request is sent

### Requirement: A failed request keeps the form

When the logo upload or the event request fails, the form SHALL keep everything typed and SHALL say "Something went wrong please try again.". When the answer is "too many submissions", the message SHALL say to try again later.

#### Scenario: The request fails

- **GIVEN** a valid form and a backend that answers with a server error
- **WHEN** the visitor presses "Submit Event"
- **THEN** the form still holds every value and the message shows

#### Scenario: Too many submissions

- **GIVEN** a signed-out visitor over the hourly limit
- **WHEN** they submit a valid form
- **THEN** the form keeps its values and says to try again later

### Requirement: The edit page opens read-only

`/events/edit/<uid>` SHALL be open to the event's submitter and to a directory admin; anyone else, and an unknown event, SHALL see "Oops! This event is no longer available." with "Back to my events". The page SHALL open as a read-only view of the event with its status and an "Edit" button. "Edit" SHALL unlock the form. A rejected event SHALL stay read-only for its submitter. A failed check on save SHALL unlock the form by itself.

#### Scenario: The submitter opens their event

- **GIVEN** an event member M submitted
- **WHEN** M opens its edit page
- **THEN** the event shows read-only with its status and "Edit"

#### Scenario: Another member opens the address

- **GIVEN** an event member M submitted
- **WHEN** member N, who is not a directory admin, opens its edit page
- **THEN** the page says the event is no longer available

#### Scenario: A rejected event

- **GIVEN** member M's rejected event
- **WHEN** M opens its edit page
- **THEN** the event shows read-only with "Rejected" and no "Edit"

### Requirement: Saving on the edit page

While editing, a draft SHALL offer "Save as draft" and "Submit"; any other event SHALL offer "Save Changes". "Submit" and "Save Changes" SHALL run the Submit Event checks. A saved draft SHALL stay a draft. "Submit" SHALL send the draft for publishing ("Event Submitted Successfully"). "Save Changes" SHALL keep the event's status ("Event Updated Successfully"). After a save the page SHALL return to the read-only view. A failed save SHALL say "Failed to update event. Please try again.".

#### Scenario: A draft is submitted

- **GIVEN** member M's draft with a tag and a host
- **WHEN** M presses "Edit" and then "Submit"
- **THEN** the message "Event Submitted Successfully" shows and the status is "Submitted" or "Approved"

#### Scenario: An approved event is corrected

- **GIVEN** member M's approved event
- **WHEN** M changes the dates and presses "Save Changes"
- **THEN** the message "Event Updated Successfully" shows and the status is still "Approved"

#### Scenario: A draft submitted without a host

- **GIVEN** member M's draft with no host name
- **WHEN** M presses "Submit"
- **THEN** the form unlocks and says "Enter a valid host name"

### Requirement: Delete Event

"Delete Event" SHALL show on the edit page and in My Submissions for an event that is not approved; a directory admin SHALL also get it for an approved event. It SHALL ask "Are you sure you want to delete?" with "Clicking delete will remove the event from the list." and the buttons "Cancel" and "Delete". After a delete the message SHALL be "Event deleted successfully" and My Submissions SHALL open. A failed delete SHALL say "Something went wrong please try again.".

#### Scenario: A submitter deletes a draft

- **GIVEN** member M's draft
- **WHEN** M presses "Delete Event" and confirms
- **THEN** the message "Event deleted successfully" shows and the draft is gone from My Submissions

#### Scenario: An approved event

- **GIVEN** member M's approved event, and M is not a directory admin
- **WHEN** M opens its edit page
- **THEN** there is no "Delete Event"

#### Scenario: Delete is cancelled

- **GIVEN** the delete question is open
- **WHEN** the member presses "Cancel"
- **THEN** the event is unchanged

### Requirement: My Submissions lists the member's events

`/events/mine` SHALL list the signed-in member's events of every status. Each row SHALL show the name, a status ("Draft", "Submitted", "Approved" or "Rejected"), "Last Modified" with its date and time, and its buttons: "Modify" and "Delete" for a draft or submitted event, "Modify" for an approved one, "View" and "Delete" for a rejected one. "Modify" and "View" SHALL open the edit page. Rows SHALL be grouped under month headings, earliest month first.

#### Scenario: One event of each status

- **GIVEN** member M has a draft, a submitted, an approved and a rejected event
- **WHEN** M opens `/events/mine`
- **THEN** each shows its status, the approved one has no "Delete" and the rejected one has "View"

#### Scenario: Month headings

- **GIVEN** upcoming events in December 2026 and January 2027
- **WHEN** M opens `/events/mine`
- **THEN** the December event is under "DEC 2026", above "JAN 2027"

### Requirement: My Submissions can be searched and switched between upcoming and past

The page SHALL have a search "Search by event name" that applies on Enter and matches the name ignoring case, with a control that clears it, and a switch "Upcoming" (default) / "Past". An event SHALL be upcoming when its end is not in the past. Changing the switch SHALL clear the search.

#### Scenario: Past events

- **GIVEN** an event that ended last month
- **WHEN** M switches to "Past"
- **THEN** the event is listed

#### Scenario: Search

- **GIVEN** events named "Lisbon Meetup" and "Denver Hack Day"
- **WHEN** M types "lisbon" and presses Enter
- **THEN** only "Lisbon Meetup" is listed

### Requirement: My Submissions has empty, signed-out and error states

With no rows, also after a search, the page SHALL say "No Events currently available". A signed-out visitor SHALL be asked to sign in and SHALL return to the page after. When the list can't load, the page SHALL say so and offer "Try again".

#### Scenario: No submissions

- **GIVEN** a signed-in member who submitted nothing
- **WHEN** they open `/events/mine`
- **THEN** the page says "No Events currently available"

#### Scenario: Signed out

- **GIVEN** a signed-out visitor
- **WHEN** they open `/events/mine`
- **THEN** they are asked to sign in, and after sign-in they are on `/events/mine`

### Requirement: The event drawer leads to the edit page

The event drawer SHALL show "Edit" to the member who submitted the event and to a directory admin, and to nobody else. It SHALL open the event's edit page. When its submitter or a directory admin opens an event that is not approved, the drawer SHALL show its status and SHALL NOT offer "I'm going". Any other viewer SHALL get the drawer's "no longer available" state.

#### Scenario: Another member opens the drawer

- **GIVEN** an approved event member M submitted
- **WHEN** member N, who is not a directory admin, opens its drawer
- **THEN** there is no "Edit"

#### Scenario: Another member opens a submitted event by link

- **GIVEN** an event that waits for approval
- **WHEN** a member who did not submit it opens `/events/all?event=<its uid>`
- **THEN** the drawer says the event is no longer available

### Requirement: All-day events show dates without a time

For an all-day event, every card, the calendar, My Submissions and the drawer SHALL show its date or date range and SHALL NOT show a start time, an end time or a UTC offset. The submit form SHALL NOT create all-day events; they come from partner apps.

#### Scenario: A three-day conference

- **GIVEN** an all-day event on Jul 24–26
- **WHEN** a visitor opens the List view
- **THEN** its card under Jul 24 reads "Day 1 of 3" with no time

### Requirement: Submit and My Submissions analytics

The page SHALL send `events-submit-form-opened`; `events-submit-form-submitted` with the result (`approved`, `submitted` or `draft`) and whether the visitor is signed in; `events-submit-form-failed` with the status code; `events-luma-imported`; `events-my-submissions-opened`; `events-event-edited`; and `events-event-deleted`. No event SHALL carry an email or the event's text.

#### Scenario: A published submission

- **GIVEN** a signed-in member
- **WHEN** their submission is published
- **THEN** `events-submit-form-submitted` is sent with result `approved` and signed in `true`

## RENAMED Requirements

- FROM: `### Requirement: The All Events page is native behind a flag`
- TO: `### Requirement: The All Events page is native`

## MODIFIED Requirements

### Requirement: The All Events page is native

`/events/all` SHALL render the All Events page in LabOS on every build. No build SHALL show the events app in an iframe. The page SHALL be open to signed-out visitors. It SHALL show published, upcoming events only: events that have not ended.

#### Scenario: Flag off

- **GIVEN** a build with `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2` unset
- **WHEN** a visitor opens `/events/all`
- **THEN** the native page shows, because the flag is no longer read

#### Scenario: Flag on

- **WHEN** a visitor opens `/events/all`
- **THEN** the page shows the header, Browse by city, the Coming up toolbar and the List view
- **AND** no iframe loads

#### Scenario: Past events are not listed

- **GIVEN** an event that ended yesterday and one that starts tomorrow
- **WHEN** a visitor opens `/events/all`
- **THEN** only the event that starts tomorrow is listed

#### Scenario: A pending event is not listed

- **GIVEN** an event that waits for approval
- **WHEN** any visitor opens `/events/all`
- **THEN** the event is not in any view

### Requirement: The page header

The page SHALL open with the title "Events", one line of description, "My Submissions" for a signed-in member, and "Submit an event". "Submit an event" SHALL open `/events/submit` in the same tab, for signed-in members and signed-out visitors. "My Submissions" SHALL open `/events/mine`. The header SHALL have no link to the events app.

#### Scenario: Submit an event

- **WHEN** a visitor presses "Submit an event"
- **THEN** `/events/submit` opens in the same tab

#### Scenario: Signed-out header

- **GIVEN** a signed-out visitor
- **WHEN** they open `/events/all`
- **THEN** the header shows "Submit an event" and no "My Submissions"

### Requirement: The Coming up toolbar and filters

A "Coming up" toolbar SHALL show the number of events that match, a Filters button and the view switch List · Calendar · Map, offering only the views this build has (no switch while there is one). On desktop and tablet it SHALL stay in view under the navbar while the events scroll. The filter rail SHALL be closed by default. The Filters button SHALL open it and show the number of applied filters. The rail SHALL have a control that closes it and "Clear All". While the rail is closed, each applied filter SHALL show as a removable chip under the toolbar. The filters SHALL be, in this order: search (event name, host, city or topic), "Events I'm going to" (signed-in members only), "Featured events", Mode (In person, Virtual, Hybrid), Access type (Free, Paid, Invite only: the words the cards and the drawer use), Focus area (the event's tags), City and Host. Focus area and Host SHALL have a search box. Values within one filter SHALL match any (OR); different filters SHALL all apply (AND). A Mode, Access type, Focus area, City or Host filter with fewer than 2 values in the loaded events SHALL NOT show, unless it is applied. "Featured events" SHALL NOT show when no loaded event is featured, unless it is applied. Filters and the view SHALL be kept in the page address, so a copied link reopens the same view and filters, and switching view SHALL keep the filters. On phones the filters SHALL open as a bottom sheet from a Filters button.

#### Scenario: Filter survives a view switch

- **GIVEN** the Mode filter set to Virtual
- **WHEN** the visitor switches from List to Calendar
- **THEN** the calendar shows only online events and the Mode chip stays

#### Scenario: Removing a chip

- **GIVEN** the rail is closed with the chips "Hybrid", "Dubai" and "Lisbon"
- **WHEN** the visitor removes "Dubai"
- **THEN** the hybrid events in Lisbon show, and the Filters button reads 2

#### Scenario: Events I'm going to

- **GIVEN** a signed-in member going to 2 upcoming events
- **WHEN** they turn on "Events I'm going to"
- **THEN** the page shows those 2 events only

#### Scenario: Access type filter

- **GIVEN** two free events and one invite-only event
- **WHEN** the visitor sets Access type to Invite only
- **THEN** only the invite-only event shows

#### Scenario: Filter by host

- **GIVEN** upcoming events hosted by Protocol Labs and by Filecoin Foundation
- **WHEN** the visitor picks Host "Protocol Labs"
- **THEN** only the events Protocol Labs hosts or co-hosts show, with a "Protocol Labs" chip

#### Scenario: No details yet

- **GIVEN** upcoming events whose access, tags and hosts are all empty
- **WHEN** the visitor opens the rail
- **THEN** it shows no Access type, Focus area or Host section

#### Scenario: Featured events

- **GIVEN** one featured event and two that are not
- **WHEN** the visitor turns on "Featured events"
- **THEN** only the featured event shows

#### Scenario: No event is featured

- **GIVEN** no loaded event is featured
- **WHEN** the visitor opens the filter rail
- **THEN** there is no "Featured events" switch

#### Scenario: Nothing matches

- **GIVEN** filters that match no event
- **WHEN** the view loads
- **THEN** it says no upcoming events match and offers "Show all events", which clears every filter and keeps the view and an open event

#### Scenario: Events fail to load

- **GIVEN** the upcoming events request fails
- **WHEN** a visitor opens `/events/all`
- **THEN** the header stays, and the page says the events couldn't load, with "Try again"
