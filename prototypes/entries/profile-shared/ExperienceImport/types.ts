/**
 * What reading a document gives back, and what the review hands on.
 *
 * Deliberately *not* the job board's `ExperienceEntry`. This folder is shared
 * (like `PlTeamOnlyPill` beside it), so it cannot depend on one prototype's
 * record type — and the two records are not the same thing anyway: a parse
 * result is a *proposal*, which is why `startDate` is allowed to be empty here
 * and is required there. The consumer maps one to the other on Save, which is
 * also the moment it mints its own uids.
 */

/* `ImportSource` ('resume' | 'linkedin') used to live here, naming which door a
   document arrived through. There is one door now, so there is nothing to name:
   both labels always led to the same drop area and the same parser, so the
   second one was a choice with no consequence. */

export interface ParsedExperience {
  /** React key only. Never persisted — the consumer mints its own on Save. */
  key: string;
  /** Production `title` — labelled "Role". */
  title: string;
  /** Production `company` — labelled "Team or Organization". */
  company: string;
  description: string;
  /**
   * 'YYYY-MM', or **empty when the document didn't say**.
   *
   * The common failure, not an edge case: plenty of CVs write "2021 – present"
   * with no month, and LinkedIn PDFs drop the month on older roles. The record
   * this feeds requires a start date, so an empty one is the single thing that
   * can block Save — which is why the review asks for it inline rather than
   * discovering it after the fact.
   */
  startDate: string;
  /** 'YYYY-MM'. Null while `isCurrent`. */
  endDate: string | null;
  isCurrent: boolean;
  location: string;
}

export interface ParsedProfile {
  /**
   * Optional because not every document carries them — never because a surface
   * declines to look.
   *
   * A real CV parser returns the name and email off the top of the document —
   * Mercor collects exactly those two alongside the resume in step 1 of its
   * wizard, and production's own onboarding `ProfileStep` is those same two
   * fields in that same order. The review renders them under the rule it
   * already applies to role and location: asked for only when the profile is
   * still missing them (`currentName` / `currentEmail`), so the job board —
   * which has an account by the time the importer runs — is never offered its
   * own name back, and onboarding is.
   *
   * **What is deliberately not here.** A phone number: `IMember` has no phone
   * field at all, so a parsed one would have nowhere to land, and confirming a
   * fact the record cannot hold is asking a question for nothing. A LinkedIn or
   * GitHub URL: those are social links owned by the Contact Details card, and
   * taking one means taking all of them — at which point the review has stopped
   * reviewing a work history and become a second sign-up form.
   */
  name?: string;
  email?: string;
  /** The headline the document leads with. Feeds the profile's required Role. */
  role: string;
  location: string;
  skills: string[];
  experiences: ParsedExperience[];
}

/**
 * What the person actually agreed to add, after the review.
 *
 * `name` and `email` are always present, and always carry whatever the card was
 * holding when Save was pressed — the confirmed value where it asked, the host's
 * own current value where it didn't. Consumers apply the same rule to them as to
 * `role`: fill a blank, never overwrite an answer given by hand.
 */
export interface ImportSelection {
  experiences: ParsedExperience[];
  skills: string[];
  name: string;
  email: string;
  role: string;
  location: string;
}
