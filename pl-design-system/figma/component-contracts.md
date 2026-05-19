# Component Contracts

Per-component rules for AI agents. Each contract defines what the component is, how to use it, and what to never do with it.

---

# Component: Button

Canonical Figma component: `Primitive Components / Button` (node `802:20272`, verified via MCP)

Category: Primitive

Purpose:
The primary interactive trigger for all user actions. Used for form submission, navigation triggers, modal opens, confirmations, and destructive actions.

Variants (Figma-verified):
- **Type**: Default (Brand), Success, Warning, Error, Neutral, Light/Ghost
- **Style**: Fill, Border, Light
- **Size**: Tiny (24px), Extra Small (32px), Small (36px), Medium (40px), Large (48px), Extra Large (56px), Big (58px)
- **State**: Normal, Hover, Focus, Active, Disable

States: Normal · Hover · Focus · Active · Disabled

Usage:
- Primary actions: Fill + Brand/Default type
- Secondary actions: Border or Light style
- Destructive: Fill + Error type
- Success confirmations: Fill + Success type
- Only one primary (Fill + Brand) button per section

Rules:
- Always instantiate from Figma library
- Preserve variant, size, and state properties
- Do not hardcode colors or radii
- Do not combine Fill + Error for non-destructive actions

Do:
- Use `Type=Default, Style=Fill` for primary CTA
- Use `Style=Border` for secondary actions
- Match button size to context (form: Medium/Large, compact UI: Small/Tiny)

Do not:
- Draw a custom button with raw CSS
- Use more than one primary Fill button per section
- Create new Type or Style variants
- Override internal button typography

AI instruction:
When generating UI, instantiate the Button component from the Figma library with the correct Type, Style, Size, and State. If unavailable, stop and report:
`Missing canonical component: Button`

---

# Component: Link Button

Canonical Figma component: `Primitive Components / Link Button`
Category: Primitive
Purpose: Text-only interactive link styled as a button. No background fill.
Variants: TODO: verify via MCP
Status: TODO verify

AI instruction: Instantiate from Figma. Do not recreate with `<a>` + custom CSS.
If unavailable: `Missing canonical component: Link Button`

---

# Component: Icon Button

Canonical Figma component: `Primitive Components / Icon Button`
Category: Primitive
Purpose: Square or circular button containing only an icon. Used for toolbar actions, inline controls.
Variants: TODO: verify via MCP
Status: TODO verify

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Icon Button`

---

# Component: Round Icon Button

Canonical Figma component: `Primitive Components / Round Icon Button`
Category: Primitive
Purpose: Circular icon button. Used for floating actions and prominent single-action contexts.
Variants: TODO: verify via MCP
Status: TODO verify

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Round Icon Button`

---

# Component: Input

Canonical Figma component: `Primitive Components / Input`
Category: Primitive
Purpose: Single-line text entry for forms, search, tag entry, and user-controlled values.

Variants:
- Style: Default, Underline, Filled
- Type: Text, Search, Password, Tag, Avatar
- State: Default, Hover, Focus, Error, Disabled, Filled

Rules:
- Do not use a raw `<input>` + custom CSS
- Apply correct state styling — especially error state with token-based border
- Never hardcode input border-radius or typography

Do not: Recreate an input field with a plain div and custom styles.

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Input`

---

# Component: TextArea

Canonical Figma component: `Primitive Components / TextArea`
Category: Primitive
Purpose: Multi-line text entry. Used for bio fields, descriptions, comment drafts.

Variants:
- Standard textarea
- Rich text editor (with toolbar)
- Comment field
- State: Default, Focus, Error, Disabled

Rules:
- Rich text variant includes a toolbar — do not remove it or replace with a plain textarea
- Helper text uses the canonical helper slot

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: TextArea`

---

# Component: Checkbox

Canonical Figma component: `Primitive Components / Checkbox`
Category: Primitive
Purpose: Binary and indeterminate selection control.

States: Unchecked, Checked, Indeterminate, Hover, Focus, Disabled

Rules:
- Do not draw a custom checkbox with CSS
- Indeterminate state must use the canonical component — do not approximate with a dash

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Checkbox`

---

# Component: Checkbox Label

Canonical Figma component: `Primitive Components / Checkbox Label`
Category: Primitive
Purpose: Selectable row/card combining a checkbox with richer content (text, icon, avatar, image, pricing).

Variants:
- Content: Simple text, Icon, Avatar, Image, Pricing
- State: Default, Selected, Disabled

Rules:
- Use for multi-select filter lists, settings rows, and pricing option selectors
- Do not build a custom selectable card with raw div + checkbox

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Checkbox Label`

---

# Component: Checkbox Group

Canonical Figma component: `Primitive Components / Checkbox Group`
Category: Primitive
Purpose: Grouped set of checkboxes for multi-select forms.

Rules:
- Use for filter panels, settings groups, multi-select forms
- Validation state must use canonical error styling

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Checkbox Group`

---

# Component: Alerts & Notification

Canonical Figma component: `Primitive Components / Alerts & Notification`
Category: Primitive
Purpose: System feedback about the result of user actions or system states.

Variants:
- Type: Info, Success, Warning, Error, Neutral
- Style: Alert (inline), Banner (full-width), Toast (transient), Notification Card (persistent)
- Actionable: with/without action button

Rules:
- Use Info for neutral context, not Success
- Do not use multiple alert types simultaneously in the same view
- Toasts are transient — do not make them persistent

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Alerts & Notification`

---

# Component: Badges & Tags

Canonical Figma component: `Primitive Components / Badges & Tags`
Category: Primitive
Purpose: Status indicators, category labels, metadata tags.

Variants:
- Style: Filled, Outline, Soft
- Semantic: Neutral, Brand, Success, Warning, Error
- Dot: with/without leading dot

Rules:
- Use Soft style for metadata tags (not high-signal status)
- Use semantic color correctly: Success for positive, Warning for caution, Error for problems
- Do not overload cards with more than 3–4 badges
- Do not draw a custom badge with raw div + CSS

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Badges & Tags`

---

# Component: Dropdown

Canonical Figma component: `Primitive Components / Dropdown`
Category: Primitive
Purpose: Select, multi-select, and searchable select controls.

Variants:
- Type: Select, Multi-select, Searchable, Avatar, Country, Payment
- Item states: Default, Hover, Selected, Disabled, Separator

Rules:
- Do not use a custom-built `<select>` with CSS
- Avatar dropdown must use canonical avatar rendering inside items
- Country dropdown must use canonical flag + country name rendering

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Dropdown`

---

# Component: Context Menu

Canonical Figma component: `Primitive Components / Context Menu`
Category: Primitive
Purpose: Contextual action list triggered by right-click or a menu button.

Rules:
- Destructive actions (Delete, Remove) must be visually separated and styled distinctively
- Do not nest more than 2 levels deep
- Do not use context menu for primary navigation

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Context Menu`

---

# Component: Tabs

Canonical Figma component: `Primitive Components / Tabs`
Category: Primitive
Purpose: View/section switcher within a page or panel.

Variants:
- Style: Underline, Filled, Pill, Minimal
- State: Active, Hover, Disabled

Rules:
- Use Underline for page-level tabs
- Use Filled or Pill for contained/card-level tabs
- Active state is the only visual indicator of selection — do not add additional visual treatment

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Tabs`

---

# Component: Accordion

Canonical Figma component: `Primitive Components / Accordion`
Category: Primitive
Purpose: Collapsible content sections.

States: Collapsed, Expanded, Hover, Focus, Disabled
Themes: Light, Dark

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Accordion`

---

# Component: Pagination

Canonical Figma component: `Primitive Components / Pagination`
Category: Primitive
Purpose: Page navigation for lists and data tables.

Variants:
- Style: Numeric, Previous/Next only, Compact, Go-to input, Mobile

Rules:
- Match pagination style to viewport and content density
- Mobile views must use Mobile or Compact variant

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Pagination`

---

# Component: Progress

Canonical Figma component: `Primitive Components / Progress`
Category: Primitive
Purpose: Visual indicator of completion or loading state.

Variants:
- Type: Bar, Circle
- State: Active, Complete, Disabled
- With/without label and percentage

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Progress`

---

# Component: Regular Search Input

Canonical Figma component: `Primitive Components / Regular Search Input`
Category: Primitive
Purpose: Search field with clear and submit affordances.

Variants:
- Context: Standard, Global search, Sidebar search, With filters

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Regular Search Input`

---

# Component: Slider / Range

Canonical Figma component: `Primitive Components / Slider`
Category: Primitive
Purpose: Continuous value selector.

Variants:
- Type: Single value, Range (double handle)
- With/without tooltip value label
- With/without histogram/graph background

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Slider`

---

# Component: Switch & Toggle

Canonical Figma component: `Primitive Components / Switch & Toggle`
Category: Primitive
Purpose: Binary on/off control.

Variants:
- Type: Switch, Toggle with label, Segmented (light/dark mode)
- State: Active, Inactive, Disabled

Rules:
- Use Switch for settings toggles
- Use Segmented for theme/mode switching

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Switch & Toggle`

---

# Component: Carousel

Canonical Figma component: `Primitive Components / Carousel`
Category: Primitive
Purpose: Horizontally scrollable content set.

Variants:
- Indicator: Dots, Lines
- Navigation: arrows, swipe

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Carousel`

---

# Component: Tooltips

Canonical Figma component: `Primitive Components / Tooltips`
Category: Primitive
Purpose: Contextual helper text on hover/focus.

Variants:
- Placement: Top, Bottom, Left, Right

Rules:
- Keep tooltip copy short (under 80 characters)
- Do not use tooltips for critical information — always provide an accessible alternative

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Tooltips`

---

# Component: Upload

Canonical Figma component: `Primitive Components / Upload`
Category: Primitive
Purpose: File selection and upload UI.

Variants:
- Type: Drag & drop area, Compact, Image upload
- State: Default, Uploading, Complete, Failed

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Upload`

---

# Component: Empty

Canonical Figma component: `Primitive Components / Empty`
Category: Primitive
Purpose: Zero-state placeholder for lists, search results, and pages with no data.

Variants:
- Type: No data, No results (search), Error, 404, Access restricted
- With/without CTA button

Rules:
- Always use Empty state for zero-data scenarios
- Do not use empty state for error states — use the Error variant
- Include a CTA when user action can resolve the empty state

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Empty`

---

# Component: Date Picker

Canonical Figma component: `Primitive Components / Date Picker`
Category: Primitive
Purpose: Date and date range selection.

Variants:
- Type: Single date, Range, Month, Year
- With quick range presets

Status: TODO verify — code DatePicker directory is empty

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Date Picker`

---

# Component: Drawer

Canonical Figma component: `Primitive Components / Drawer`
Category: Primitive
Purpose: Slide-in panel overlay for secondary content, filters, or detail views.

Variants:
- Position: Left, Right, Bottom (Bottom Sheet on mobile)

Rules:
- Use Drawer for secondary content only — not for navigation
- Mobile uses Bottom Sheet variant
- Do not stack drawers

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Drawer`

---

# Component: Table (cells)

Canonical Figma component: `Primitive Components / Table`
Category: Primitive
Purpose: Data table cell types for structured data display.

Cell variants:
- Avatar cell, Badge cell, Progress cell, Country cell, Rating cell, Action cell, Analytics cell

Rules:
- Do not build custom table cells with raw HTML
- Use the correct cell type for the data being displayed

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Table`

---

# Component: Steps

Canonical Figma component: `Primitive Components / Steps`
Category: Primitive
Purpose: Progress indicator for multi-step flows.
Status: TODO verify exact variant names via MCP

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Steps`

---

# Product Component Contracts

---

# Component: Header & Nav

Canonical Figma component: `Product Components / Header & Nav`
Category: Product Component
Purpose: Primary application navigation. Contains logo, nav items, search, notification bell, and user avatar menu.

Variants:
- Platform: Desktop, Mobile
- With/without search bar
- With/without notification bell

Rules:
- Do not compose a custom header — use the canonical component
- Mobile header must use the mobile variant
- Active nav item state must use the canonical active treatment

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Header & Nav`

---

# Component: Sidebars & Bottom Sheets

Canonical Figma component: `Product Components / Sidebars & Bottom Sheets`
Category: Product Component
Purpose: Filter panels and secondary navigation for directory, deals, demo day, and job board pages.

Variants:
- Context: Directory, Demo Day, Deals, Job Board, Founder Guides
- Platform: Desktop sidebar, Mobile bottom sheet

Rules:
- Desktop uses sidebar
- Mobile uses bottom sheet
- Clear/Apply button behavior must use canonical button components

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Sidebars & Bottom Sheets`

---

# Component: Cards (product)

Canonical Figma component: `Product Components / Cards`
Category: Product Component
Purpose: Content preview cards for all product contexts.

Sub-types (each is a distinct Figma component):
- Focus Area Cards
- Homepage Cards
- Updates Cards
- Directory Member Cards
- Team Cards
- Forum Cards
- Deals Cards
- Demo Day Cards
- Job Board Cards
- Founder Guides Cards
- Office Hours Cards
- Topic Cards
- Comment Cards

Rules:
- Title/content must dominate
- Metadata is secondary
- Tags/badges are tertiary
- Actions are clear but not visually dominant
- Never overload a card with more than 3–4 badges
- Cards use elevation (shadow) not border

AI instruction: Instantiate the correct card sub-type from Figma. If unavailable: `Missing canonical component: [specific card type]`

---

# Component: Bottom Navigation

Canonical Figma component: `Product Components / Bottom Navigation`
Category: Product Component
Purpose: Mobile-only bottom navigation bar.

Tabs: Directory · Events · Demo Day · More

Rules:
- Mobile only — do not render on desktop
- Do not add tabs not present in the canonical component

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Bottom Navigation`

---

# Component: Comments

Canonical Figma component: `Product Components / Comments`
Category: Product Component
Purpose: Comment composer and thread display for forum and discussion contexts.

Variants:
- Composer with rich text toolbar
- Desktop comment thread
- Mobile comment thread
- Nested replies

Rules:
- Use the rich text toolbar variant for composer
- Mention suggestions must use canonical Avatar + name rendering

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Comments`

---

# Component: Tables (product)

Canonical Figma component: `Product Components / Tables`
Category: Product Component
Purpose: Domain-specific data tables.

Types:
- Member table, Orders table, Uploaded files table, Transaction table, Leaderboard

Rules:
- Use product table components — do not compose from raw table cells
- Sorting, filtering, and row actions must use canonical patterns

AI instruction: Instantiate from Figma. If unavailable: `Missing canonical component: Tables`
