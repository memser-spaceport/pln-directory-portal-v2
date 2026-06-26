# Reusable components for prototypes

A map of what you can **import directly** into a `/prototypes` entry versus what you should **copy and simplify**. Pair this with [README.md](./README.md).

## The one rule

Before importing a production component, ask: does the component **or its imports** use any of these?

- react-query (`useQuery`, `useMutation`, `useInfiniteQuery`)
- anything from `services/`
- a Zustand store (`use*Store`)
- auth / cookies / analytics side effects

**No** → import it directly: `import { Button } from '@/components/common/Button'`.
**Yes** → copy the JSX + `.module.scss` into your `prototypes/entries/<key>/` folder and feed it mock data.

When in doubt, open the file and skim its imports. The split is ~80% import-safe, so reuse is the default.

## Import-safe primitives (use directly)

### `@/components/common`
`Badge` · `Button` · `Checkbox` · `Countdown` · `Drawer` · `EmptyState` · `ExpandableDescription` · `ImageWithFallback` · `Markdown` · `Modal` · `ModalBase` · `Pagination` · `Tabs`

### `@/components/common/filters`
`FiltersSidePanel` · `FilterSection` · `SearchInput` · `SortDropdown` · `GenericRangeInput` · `GenericFilterToggle` · `MobileFilterWrapper`
> Note: `GenericCheckboxList` itself is store-bound, but its presentational row
> `@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation`
> is import-safe (used by the Gantry prototype).

### `@/components/ui`
`BackButton` · `CopyButton` · `FileUploader` · `Icons` · `MobileDrawer` · `NumberTicker` · `QuillContent` · `Spinner` · `Tag` · `Tooltip` · `AlertDialog` · `ShadowButton`

### `@/components/form`
`CurrencyInput` · `DateRangePicker` · `Dropdown` · `FormCurrencyField` · `FormField` · `FormSelect` · `FormMultiSelect` · `FormSwitch` · `FormTextArea` · `FormTagsInput` · `MonthYearSelect` · `MultiSelect` · `StandaloneMultiSelect` · `TagsInput` · `Input` (`@/components/common/form/Input`)
> Form components need a `FormProvider` (react-hook-form) wrapper, but no backend — see the Gantry prototype for the pattern.

### `@/components/icons`
All icon exports (`CheckIcon`, `CloseIcon`, `PlusIcon`, `SpinnerIcon`, …) are import-safe.

## Needs copy / simplify (data-bound)

| Component | Why |
| --- | --- |
| `GenericCheckboxList` | filter store + data |
| `RichTextEditor` | `useMembersSearch`, image-upload service |
| `LocationSelect` | react-query + geolocation API |
| `TagContainer` (`@/components/ui/tag-container`) | `useMemberContactsAccess` |
| `SearchWithSuggestions` (`@/components/form/suggestions`) | `getSuggestions` service |
| `VideoPlayer` | watch-progress hooks + analytics |
| `DemoDayCard`, `LogosGrid` | demo-day analytics hooks |
| `FilterTagInput` | borderline — check before importing |
| `FounderTable`, `FoundersTableSection`, `FoundersFilterRail`, `FounderColumnChooser` | react-query (`useGetFounders`/`useGetFounderFilters`) + column store + analytics — copy JSX, import the matching `.module.scss` (see `founder-db`) |
| `FounderDrawer`, `ReviewActionsPanel` | `useGetFounderById` + review mutations + analytics |

> Import-safe within Founder DB (used directly by the `founder-db` clone and the `founder-db-reach-out` shortlist): `KpiSummaryStrip`, `FounderReviewStateBadge`, `exportFoundersCsv`, `DashboardPagesLayout`, `LabOsBadge`, and the `FUND_LABEL`/`getFundTag` helpers from `@/services/founders/constants` & `types`. The `tagRow`/`fundTag` classes from `FounderTable.module.scss` are also import-safe for fund chips.

For these: copy the component's `.tsx` + `.module.scss` into your entry folder, strip the hooks, and replace data with `mocks.ts`.

---
_Generated from a component audit. If a component isn't listed, open its file and apply the one rule above._
