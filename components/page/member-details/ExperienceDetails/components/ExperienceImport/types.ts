/**
 * What reading a document gives back, and what the review hands on.
 *
 * Deliberately *not* `FormattedMemberExperience`. A parse result is a
 * **proposal**, not a record: `startDate` is allowed to be empty here and is
 * required there, `key` is a React key rather than a persisted uid, and nothing
 * in it has been agreed to yet. The apply endpoint turns one into the other.
 */

import type { ResolvedLocation } from '@/services/location.service';

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
   * Which stored parse this proposal came from.
   *
   * The apply endpoint takes it and rejects a uid that is not the member's
   * current row with a 409 — so a review left open while a newer CV was
   * uploaded in another tab fails loudly instead of writing rows nobody saw.
   *
   * Carried on the proposal rather than held beside it because the two must not
   * be able to drift: the selection under review and the import it is a review
   * *of* are one thing.
   */
  importUid: string;
  /**
   * Optional because this host never reads them.
   *
   * A CV parser returns the name and email off the top of the document, and a
   * sign-up surface that runs the importer *before* asking for either could use
   * them. The profile drawer cannot: by the time it opens there is an account,
   * and an import is not the place to rename it.
   */
  name?: string;
  email?: string;
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
  /**
   * A **resolved** place, or null for "leave the profile's alone".
   *
   * Not the string `ParsedProfile.location` carries. The member record stores
   * `{metroArea, city, country, region, continent}` and the only thing that
   * produces those is `/v1/locations/{placeId}/details`, so a location that
   * arrived as text has to be picked from the autocomplete before it can be
   * saved. The review seeds that picker with what the document said; until
   * something is picked this stays null and the profile keeps whatever it had.
   */
  location: ResolvedLocation | null;
}
