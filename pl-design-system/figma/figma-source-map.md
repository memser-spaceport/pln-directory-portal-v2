# Figma Source Map

Canonical Figma file: **Design-System-Full | Protocol Labs**
File URL: https://www.figma.com/design/0fFjyzEincRez6m3D80vLg/Design-System-Full-%7C-Protocol-Labs

Inspection method: Figma MCP `get_metadata` — all entries below are **verified** unless explicitly marked TODO.

---

## Document Page Structure

| Page ID | Page Name | Notes |
|---|---|---|
| `5740:96716` | Foundations | Section header |
| `0:1` | 🎨 Colors | Foundation page |
| `13610:4349` | 🎟️ Color Variables-Token | Foundation page |
| `802:20273` | 🅰️ Typography | Foundation page |
| `1158:20442` | 🏔 Effects | Foundation page |
| `5740:96717` | Primitive Components | Section header |
| `802:20272` | ❖ Button | Primitive |
| `13802:14570` | ❖ Input | Primitive |
| `15774:38577` | ❖ TextArea | Primitive |
| `1048:18099` | ❖ Checkbox | Primitive (also contains Checkbox Label and Radio) |
| `2411:87285` | ❖ Checkbox Group | Primitive |
| `1079:21757` | ❖ Badges & Tags | Primitive |
| `1467:24996` | ❖ Date Picker | Primitive |
| `1333:24055` | ❖ Accordion | Primitive |
| `1158:20441` | ❖ Dropdown | Primitive |
| `2411:87283` | ❖ Empty | Primitive |
| `1333:24057` | ❖ Pagination | Primitive |
| `1161:20445` | ❖ Progress | Primitive |
| `1333:24062` | ❖ Regular Search Input | Primitive |
| `1467:24998` | ❖ Slider / Range | Primitive |
| `1467:25002` | ❖ Steps | Primitive |
| `2411:87282` | ❖ Carousel | Primitive |
| `1050:18030` | ❖ Switch & Toggle | Primitive |
| `2411:87286` | ❖ Table | Primitive |
| `1333:24058` | ❖ Tabs | Primitive |
| `1161:20444` | ❖ Tooltips | Primitive |
| `17368:2110` | ❖ Context Menu | Primitive |
| `24092:113086` | Composite Components | Section header |
| `24084:58112` | ❖ Header & Nav | Composite (includes Bottom Navigation) |
| `25861:2872` | ❖ Sidebars & Bottom Sheets | Composite |
| `25865:10547` | ❖ Cards | Composite (all card types) |
| `27043:54960` | ❖ Modals | Composite |
| `1333:24059` | ❖ Upload | Composite |
| `17368:2111` | ❖ Drawer | Composite |
| `1158:20439` | ❖ Alerts & Notification | Composite |
| `25861:2795` | Layout Patterns & Compositions | Patterns |
| `27043:33169` | Page Examples | Examples |
| `2411:87291` | Miscellaneous | Other |

---

## Primitive Components

---

## Component: Button

Figma page: `❖ Button`
Page ID: `802:20272`
Frame: `13053:5771` — "Button"
Status: **✅ Verified** (MCP inspection of node `802:20272`)

Variants (all confirmed):
- **Type**: Default (Brand), Success, Warning, Error, Neutral, Light/Ghost
- **Style**: Fill, Border, Light
- **Size**: Tiny (24px h), Extra Small (32px h), Small (36px h), Medium (40px h), Large (48px h), Extra Large (56px h), Big (58px h)
- **State**: Normal, Hover, Focus, Active, Disable

Related components: Link Button, Icon Button, Round Icon Button (verify on same page)

Notes: Do not recreate manually. The Figma file itself contains the instruction: "Canonical component. Do not recreate manually. Always instantiate from Figma library."

---

## Component: Input

Figma page: `❖ Input`
Page ID: `13802:14570`
Frame: `13797:14348`
Status: **✅ Verified** (MCP inspection)

Variants (all confirmed):
- **Type**: Normal, Tag
- **Style**: Rounded, Fill
- **Size**: Large (76px h), Medium (68px h), Small (64px h)
- **State**: Placeholder, Hover, Typing, Fill & Focus, Error, Disable

Important corrections:
- Styles are **Rounded** and **Fill** — NOT "Default/Underline/Filled"
- Types are **Normal** and **Tag** — Password and Avatar inputs are NOT separate types in this component
- Search input is a SEPARATE component: `Regular Search Input`

---

## Component: TextArea

Figma page: `❖ TextArea`
Page ID: `15774:38577`
Frame: `13842:8583` — "TextArea Input Field"
Also: `20157:48805` — "_Base-editor" (Type=Text editor, Type=Actions)
Status: **✅ Verified** (MCP inspection)

Variants (all confirmed):
- **Style**: Border, Fill
- **State**: Default, Fill, Focus, Typing, Error, Disable

The `_Base-editor` component contains the rich-text toolbar (Text editor + Actions).

---

## Component: Checkbox

Figma page: `❖ Checkbox`
Page ID: `1048:18099`
Frame 1: `17215:16334` — "Checkbox" (the control)
Frame 2: `14308:16244` — "Checkbox Label" (selectable row)
Status: **✅ Verified** (MCP inspection)

**Checkbox control:**
- **Variant**: Unchecked, Checked, Minus-Indeterminate
- **Type**: Checkbox, **Radio** ← Radio buttons are part of this component
- **State**: Normal, Hover, Focus, Disable
- **Size**: Medium (24px), Large (28px)

**Checkbox Label (selectable row):**
- **Variant**: Unchecked, Checked, Minus-Indeterminate
- **State**: Normal, Hover, Focus, Disable
- **Size**: Small (62px h), Medium (74px h), Large (83px h)

Note: The Checkbox page includes both Checkbox and Radio button controls.

---

## Component: Checkbox Group

Figma page: `❖ Checkbox Group`
Page ID: `2411:87285`
Frame: `14352:23080` — "Checkbox Group"
Status: **✅ Verified** (MCP inspection)

Variants (all confirmed):
- **Type**: Basic medium, Basic small, With Icon, With Logo, Avatar, With Image, Card
- **Selected**: False, True
- **State**: Default, Disabled, Hover, Focused

---

## Component: Badges & Tags

Figma page: `❖ Badges & Tags`
Page ID: `1079:21757`
Frame 1: `14216:28718` — "Badge"
Frame 2: `14216:28702` — "_BaseBadgeDot"
Status: **✅ Verified** (MCP inspection)

**Badge variants:**
- **Color**: Blue (Brand), Gray (Neutral), Green (Success), Yellow (Warning), Red (Error)
- **Style**: Light, Outline, Fill
- **Size**: Small (16px h), Medium (20px h), Large (24px h)
- **Disable**: False, True

**Badge Dot variants:**
- **Color**: Light, Light Secondary, Blue, Green, Yellow, Red
- **Size**: Small (12px), Medium (16px), Large (16–24px)

Important: Figma uses color names (Blue, Gray, Green, Yellow, Red), not semantic names (Brand, Neutral, Success, etc.).

---

## Component: Accordion

Figma page: `❖ Accordion`
Page ID: `1333:24055`
Frame: `14424:10186` — "Accordion"
Status: **✅ Verified** (MCP inspection)

Variants (all confirmed):
- **Type**: Basic, Light Gary, Underline
- **Open**: True (expanded, 107px h on desktop), False (collapsed, 67px h on desktop)
- **State**: Normal, Hover, Focus, Disable
- **Device**: Desktop, Mobile

Note: "Light Gary" is the exact Figma spelling (not "Light Grey").

---

## Component: Dropdown

Figma page: `❖ Dropdown`
Page ID: `1158:20441`
Frames: `14587:127686` — "Dropdown" · `23042:245240` — "_dropdown input" · `14545:73352` — "_BaseDropdownListItem"
Status: **✅ Verified** (MCP inspection)

**Dropdown (trigger display) variants:**
- **Variants**: Basic, Select team, Multiple Team Selection, Select Company, Payment Method, Country, Action, Profile
- **State**: Default, Open, Filled

**_dropdown input (text field) variants:**
- **Type**: Icon, Avatar, Payment, Tag
- **Size**: Large (76px h), Medium (68px h), Small (64px h)
- **State**: Default, Hover, Focus, Filled

**_BaseDropdownListItem:**
- **Type**: Basic, With Helper Text
- **State**: Default, Hover, Disable

Sub-components: Divider (Line, Dash Line, Line with Text, etc.), Keyboard Shortcut, Scrollbar

---

## Component: Empty

Figma page: `❖ Empty`
Page ID: `2411:87283`
Frame: `2457:94176` — "Empty"
Status: **✅ Verified** (MCP inspection)

Variants (all confirmed):
- **Type**: Night sky, Nature, Folder, Pages, Search, Eye, Document, Spaceship, Sad screen
- **Size**: Small, Medium, Large

Note: Each Type has a unique illustration. "Search" is for no-results. "Sad screen" is for errors. Do not create custom illustrations — use these canonical types.

---

## Component: Pagination

Figma page: `❖ Pagination`
Page ID: `1333:24057`
Frame: `14765:14724` — "Pagination"
Status: **✅ Verified** (MCP inspection)

Variants (all confirmed):
- **Type**: Basic, With Search Input, Number
- **Only icon button**: True (compact), False (with labels)
- **Round**: True (pill shape), False (square corners)
- **_BasePaginationItem State**: Normal, Hover, Focus, Disable (selected/unselected)

---

## Component: Progress

Figma page: `❖ Progress`
Page ID: `1161:20445`
Frames: `17260:19786` — "Progress Bar" · `2011:62366` — "Progress circle"
Status: **✅ Verified** (MCP inspection)

**Progress Bar:**
- **Type**: Solid blue, Blue gradient, Orange+purple Gradient
- **Label & Helper Text**: True, False
- Height: 10–12px bar

**Progress circle:**
- **Range Style**: Regular, Bold
- **Progress**: 10%–100%
- Size: 160×160px

Note: The `_BaseProgressBar` symbols are marked "🚫 Don't Change" — do not modify the base.

---

## Component: Regular Search Input

Figma page: `❖ Regular Search Input`
Page ID: `1333:24062`
Frame: `14549:147723` — "Search"
Status: **✅ Verified** (MCP inspection)

Variants (all confirmed):
- **Slate**: Default, Hover, Focus
- **Type**: Underline, Basic
- **Size**: xSmall (32px h), Small (40px h), Medium (48px h), Large (54px h)

---

## Component: Switch & Toggle

Figma page: `❖ Switch & Toggle`
Page ID: `1050:18030`
Frame 1: `14643:30883` — "Toggle"
Frame 2: `14643:35651` — "Toggle with Label"
Status: **✅ Verified** (MCP inspection)

**Toggle:**
- **Type**: Dot (standard switch), With Icon (icon inside knob), Button (segmented pill)
- **Pressed**: True, False
- **State**: Normal, Hover, Focus, Disable
- Size: 36×20px (Dot and With Icon), 132×28px (Button/segmented)

**Toggle with Label:**
- **Type**: Icon, Dot
- **Pressed**: True, False
- **State**: Normal, Hover, Focus, Disable
- **Label Position**: Left, Right

---

## Component: Tooltips

Figma page: `❖ Tooltips`
Page ID: `1161:20444`
Frame: `2002:65452` — "Tooltips"
Status: **✅ Verified** (MCP inspection)

Variants (all confirmed):
- **Size**: Small (28–33px h), Medium (36–42px h), Large (84–94px h)
- **Theme**: Light, Dark, Blue
- **Arrow**: Bottom Right, Bottom Center, Bottom Left, Top Right, Top Center, Top Left, Left Side, Right Side

---

## Component: Context Menu

Figma page: `❖ Context Menu`
Page ID: `17368:2110`
Frame: `20382:23923` — "Context Menu"
Status: **✅ Verified** (MCP inspection)

Variants:
- **Type**: Light (single variant visible at `20382:23921`)
- Size: 264×493px

---

## Component: Tabs

Figma page: `❖ Tabs`
Page ID: `1333:24058`
Frames: `14998:31094` — "Tabs" · `14996:29795` — "_BaseTabitem"
Status: **✅ Verified** (MCP inspection)

**Tabs (complete tab bar) types:**
- Fill, Fill-small, Default, Double Sided Border, Left Border

**_BaseTabitem types:**
- Fill, Fill-small, Default, Double Sided Border, Border Bottom, Border Left
- **State**: Default, Hover, Selected, Disabled

---

## Component: Date Picker

Figma page: `❖ Date Picker`
Page ID: `1467:24996`
Status: **✅ Verified** (MCP inspection)

**Main frames:**
- `14400:35519` — "Date Picker" (input trigger, 400×76)
- `14400:34671` — `_BaseDatePickerDropdown / Signle Month` (typo: "Signle")
- `22995:6927` — `_BaseDatePickerDropdown / Range - Multiple Months`
- `22981:30337` — `_BaseDatePickerDropdown / Year & Month List`
- `22969:24366` — `_BaseDateSelector` (month navigation strip)
- `1864:62830` — `_BaseCalendarDate` (day cell matrix)
- `5015:106879` — `_BaseCalendarMonth`
- `14387:9638` — `_BaseCalendarDay` (`Type=3 Word`, `Type=1 Word`)
- `14387:11465` — `_BaseActiveDot` (`Color=Blue|Green|Yellow|Red|Gray|White`)
- `22981:38382` — "dropdown button"
- `22981:38567` — "Period Range"

**Date Picker (field) variants:**
- **State**: Default, Click, Active

**_BaseDatePickerDropdown / Single Month:**
- **Type**: Basic, Range
- **Size**: Medium, small

**_BaseDatePickerDropdown / Range - Multiple Months:**
- **Size**: Large, small

**_BaseDatePickerDropdown / Year & Month List:**
- **Type**: Months, Years

**_BaseDateSelector:**
- **Type**: Center, Left side
- **Size**: Medium (56px h), Small (36px h)
- **Dropdown - month**: true, false

**_BaseCalendarDate (day cell) — key properties:**
- **State**: Default, Hover, Active - Default Style, Active - Custom Style, Disable
- **Connection**: Default, Left Rounded ⬅️, Square 🟦, Right Rounded ➡️ (range spanning)
- **Style**: Rounded, Circle
- **Size**: Small (36×36), Medium (48×48)

**_BaseCalendarMonth:**
- **Type**: Default, Hover, Disable

**dropdown button:**
- **size**: Medium (36px h), Small (24px h)
- **State**: Default, Hover, Focus (Medium) · Figma uses `State=State4/State5/State6` for Small — preserve exact names when selecting

**Period Range:**
- **State**: Default, Hover, Active, Disabled

---

## Component: Slider / Range

Figma page: `❖ Slider / Range`
Page ID: `1467:24998`
Status: **✅ Verified** (MCP inspection)

**Frames:**
- `14816:4878` — "Basic Slider"
- `14805:4669` — "Double Slider"
- `14778:46719` — "_BaseSliderControl"
- `14778:45136` — "_BaseLineGraph"

**Basic Slider:**
- **Control**: 25%, 50%, 75%, 100%
- **Weight**: Bold (10px track), Thin (4px track)

**Double Slider (range):**
- **Left Control** / **Right Control** pairs: 0%–25%, 0%–50%, …, 75%–100% (all combinations shown in file)
- **Weight**: Bold, Thin

**_BaseSliderControl:**
- **Color**: Color, Light
- **Icon**: True, False
- **Size**: Medium (24×24), Small (18×18)

**_BaseLineGraph:**
- **Type**: Thin Line, Bold Line, Thin Line 02
- **Active**: true, false

---

## Component: Steps

Figma page: `❖ Steps`
Page ID: `1467:25002`
Status: **✅ Verified** (MCP inspection)

**Frames & symbols:**
- `15139:58793` — "Step" (composed stepper)
- `15130:56377` — "_BaseIndicatorStep"
- `15119:55100` — "_BaseStepLine"
- `15139:58868` — "_BaseBasicStep" (standalone symbol)

**Step (composed) variants:**
- **Amount**: 2, 3, 4, 5, 6
- **Type**: Basic (20px h), Basic-fill (32px h), Horizontal (110px h row), Vertical

**_BaseIndicatorStep:**
- **State**: Incomplete, Current, Complate ← exact Figma spelling
- **Type**: Basic, Horizontal, Vertical

**_BaseStepLine:**
- **State**: Default, Selected, Ghost
- **Type**: Horizontal, Vertical

Note: A text layer on this page incorrectly labels content as "Tabs" — the page name and symbols are **Steps**.

---

## Component: Carousel

Figma page: `❖ Carousel`
Page ID: `2411:87282`
Status: **✅ Verified** (MCP inspection)

**Frames:**
- `2470:91119` — "Carousel" (full indicator strip)
- `2470:89976` — "_BaseCarouselItem" (single dot)

**Carousel (indicator strip) variants:**
- **Type**: Rounded, Line, Point with Border, Rounded with Border
- **Number of Carousel Item**: 2, 3, 4, 5
- **Style**: Horizontal, Vertical

**_BaseCarouselItem:**
- **Select**: false, true
- **Status**: Rounded, Line, Point with Border, Rounded with Border (property names include prefix `🚫 Don't change` in Figma — preserve instance props)

This page is **carousel pagination indicators**, not a full slide deck container.

---

## Component: Table

Figma page: `❖ Table`
Page ID: `2411:87286`
Status: **✅ Verified** (MCP inspection)

**Frames:**
- `14938:8436` — "Table Cell" — dense matrix of cell primitives
- `14938:29415` — "Table header"
- `17260:61462` — "Read-made Table" — full composed examples

**Table header variants:**
- **Type**: Default, Disabled, Empty

**Read-made Table (`Property 1`):**
- Team members
- Orders
- Files uploaded
- Cash Out Transactions
- Leaderboard

**Table Cell — sample of `Type` values (all × Background White|Light gray × State Default|Hover|Active):**

Regular text, Basic, Icon + details, Brand logo + details, Avatar + details, Status badge, Badge group, Toggle, Toggle + Details, Rating, Progress, Chart, Avatar group, Only Flag, Flag + Country name, Only Checkbox, Icon & text, signle button, Double Button ← "signle" is exact Figma spelling

---

## Composite Components

---

## Component: Header & Nav

Figma page: `❖ Header & Nav`
Page ID: `24084:58112`
Frames: `24084:70668` — "Header Desktop" · `25855:3675` — "Header Mobile" · `25857:8274` — "Bottom Nav"
Status: **✅ Verified** (MCP inspection)

**Header Desktop variants:**
- **State**: Not logged in, Not logged in More Open, Not logged in Notifications open, Logged in, Dropdown Open, Directory open, Events open, More Open, Notifications Open, Notifications Empty
- **Color**: Light

**Header Mobile variants:**
- **Property 1**: Logged In, Logged In Dropdown Open, Logged In Notif Open, Logged In Notif Empty, Header Mobile Logged Out, Not Logged In, Not Logged In Notif Open

**Bottom Nav (on same page):**
- **Property 1**: Bottom Nav Default, Bottom Nav Directory, Bottom Nav Demo Day, Bottom Nav Events, Bottom Nav Logged In More, Bottom Nav Not Logged In More

---

## Component: Sidebars & Bottom Sheets

Figma page: `❖ Sidebars & Bottom Sheets`
Page ID: `25861:2872`
Status: **✅ Verified** (MCP inspection)

Context-specific sidebar instances:
- `Filters Sidebar Members Desktop` + `Filters Drawer Members Mobile`
- `Sidebar Team Filters` + `Filters Drawer Teams Mobile`
- `Sidebar Deal Filters` + `Filters Drawer Deals Mobile`
- `Sidebar Demo Day Filters` + `Filters Drawer Demo Day Mobile`
- `Sidebar Job Board Filters`
- `Sidebar Desktop` (generic, Property 1=Default/Open)
- `Sidebar Mobile` (generic, Property 1=Default/Open)

---

## Component: Cards

Figma page: `❖ Cards`
Page ID: `25865:10547`
Status: **✅ Verified** (MCP inspection)

Card groups on this page:
- `Cards Focus Area` — Card Focus Area 1–5 variants
- `Homepage Cards` — Card Investor, Card OH, Card Demo Day
- Member Card Desktop + Member Card Mobile
- Team Card Desktop + Team Card Mobile
- `Updates Desktop` — DD/Events/Forum/OH Notification variants
- `DD Landing Page Desktop` + Mobile — PL DD Upcoming/Reg Open/Active, Partner, Completed
- `Card Jobs Desktop` + Mobile — Default, Expanded
- `Card Topic` — Default, Hover, Disabled, Request Topic
- `Card OH Desktop` + Mobile — Team, Member variants
- `Comments Desktop` + Mobile — Empty, Typing, @mention, Published 1/7
- `Team Fundraising Cards` — Large, Large Empty, Large Empty Founders, Small
- `Team Fundraising Cards Investors` — Investors, Founders
- Badge OH — Status=Available to connect, Frequently Booked
- Forum Post Desktop + Mobile
- Deals Card Default (desktop + mobile instances)
- Deals Empty — Card Empty, Card Filters Empty
- Sorting (desktop + mobile)

Note: Comments are embedded in the Cards page.

---

## Component: Modals

Figma page: `❖ Modals`
Page ID: `27043:54960`
Frame: `27043:54961` and similar — "Advance Modals"
Status: **✅ Verified** (MCP inspection)

Modal compositions found:
- Form modal (Input + TextArea + Button)
- Authentication modal (Input + Alert + Checkbox + Social buttons)
- Upload modal (File Upload Area + File Upload Status + Input + TextArea + Buttons)
- Settings/onboarding modal (multiple Inputs + Checkbox Group + File Upload)

Note: These are modal compositions, not a single parameterized component. Contains close button (Round-Icon Button), header, body, action footer.

---

## Component: Alerts & Notification

Figma page: `❖ Alerts & Notification`
Page ID: `1158:20439`
Frames: `14256:4250` — "Alert" · `15295:43746` — "Basic notification" · `15290:38530` — "Notification"
Status: **✅ Verified** (MCP inspection)

**Alert:**
- **Size**: Small (32px h), Medium (52px h), Large (214px h)
- **State**: Default, Error, Info, Sucess, Warning ← "Sucess" is exact Figma spelling
- **Type**: Default, With Background

**Basic notification:**
- **Type**: Small image, Avatar, Logo, Large image

**Notification panel:**
- **Type**: Basic, with tabs

⚠️ This component is under **Composite Components** in Figma, not Primitive.

---

## Component: Upload

Figma page: `❖ Upload`
Page ID: `1333:24059`
Status: **✅ Verified** (MCP inspection) — page is under **Composite Components** in the Figma sidebar but contains upload **primitives** used inside modals and forms.

**Frames:**
- `15147:12240` — "File Upload Area"
- `15147:12322` — "Image Upload"
- `15147:12371` — "File Upload Status"

**File Upload Area:**
- **Size**: Large (440×240), Small (500×80)
- **State**: Default, Hover

**Image Upload:**
- **Property**: Default, Uploaded

**File Upload Status:**
- Three symbols all named `Property=Default` in metadata (heights ~82px, 64px, 90px) — select the correct instance by dimensions / preview in Figma, not by property name alone.

---

## Component: Drawer

Figma page: `❖ Drawer`
Page ID: `17368:2111`
Frame: `20478:23465` — "Drawer"
Status: **✅ Verified** (MCP inspection)

Variants:
- **Type**: Create event (444px w), editor (716px w), keyboard shortcuts (1392px w), footer (1376px w)

Note: This is a Composite component in Figma. The Drawer is not a general-purpose primitive — it contains specific domain content.
