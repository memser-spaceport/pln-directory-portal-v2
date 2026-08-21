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
  /** The headline the document leads with. Feeds the profile's required Role. */
  role: string;
  location: string;
  skills: string[];
  experiences: ParsedExperience[];
}

/** What the person actually agreed to add, after the review. */
export interface ImportSelection {
  experiences: ParsedExperience[];
  skills: string[];
  role: string;
  location: string;
}
