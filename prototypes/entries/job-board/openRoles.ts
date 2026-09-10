/**
 * The **open role** — a team's standing invitation to people it has no posting
 * for.
 *
 * The board answers one question well ("is there a role here for me?") and has
 * no answer at all when the honest reply is no. Today that reader leaves: every
 * control on a team's card is attached to a specific posting, so someone who
 * wants to work at libp2p and doesn't match any of its three openings has
 * nothing to press. The open role is the row they press.
 *
 * **It is a role, not a new kind of object.** That is the whole design. The
 * board already carries an interest signal (`JobInterestBanner` in production,
 * `InterestStrip` here, the `interested` set on the board), a card that lists a
 * team's roles, and a row shape for each of them. An open role reuses all of it:
 * it is the last row of the team's card, it takes the same press, and the signal
 * it produces lands in the same place. Nothing here invents a second way to tell
 * a team you want to work with them.
 *
 * **What it deliberately is not:** an `IJobRole`. A posting carries a title, a
 * seniority, a date and an apply URL, and an open role has none of those — it
 * has no age (so no clock and no `New`), no one level, and no ad to link to.
 * Typing it as a role would mean four fields that are permanently null and a row
 * that has to special-case each one. It is its own small record, and the row
 * reads it directly.
 *
 * **Mocked, not submitted.** In the product a lead would post one from *Submit a
 * job* — the form's fields would drop the title, seniority and posting link and
 * ask for the three below instead. That half is not built here; the two teams
 * that have one are seeded in `MOCK_OPEN_ROLES`, so this pass is about what a
 * reader meets.
 */

/** What a team offers when it has no posting to offer. */
export interface OpenRole {
  teamUid: string;
  /**
   * The areas this team will read a speculative application for — the row's
   * first meta part, and the interest form's one required question.
   *
   * A closed list, and this is where it comes from: a free-text "what do you
   * do?" produces answers nobody can route. These are the rail's own role
   * categories, so a team's open role speaks the vocabulary the board already
   * filters by.
   */
  areas: string[];
  /**
   * Where they hire — the row's second meta part, same slot a posting uses.
   *
   * No `workMode` beside it: a posting row doesn't render one either (its
   * location list already says `Remote` where that is the answer), and a field
   * nothing reads is a field that drifts.
   */
  locations: string[];
  /**
   * The team's own sentence about who they want to hear from, shown on the
   * interest form under its title.
   *
   * It is on the form and not on the row on purpose: the row is scanned in a
   * list of postings and has room for facts, not for a pitch. Someone who
   * presses has asked to read it.
   */
  blurb: string;
}

/**
 * What the reader sends back.
 *
 * Two fields, and both had to earn their place against something that already
 * asks the question. **Areas** is not a duplicate of the profile's job-search
 * preferences: those say what someone wants *in general*, and this says which of
 * *this team's* doors to knock on — the thing that decides who reads it. **Note**
 * is the one part no record holds, because it is about this team specifically.
 *
 * Everything else a team needs — name, current role, experience, skills, the CV
 * — is already on the profile, which travels with the signal. Asking for it here
 * would be asking someone to retype what the account exists to hold.
 */
export interface OpenInterest {
  teamUid: string;
  areas: string[];
  /** Optional. Empty string when they sent it without one. */
  note: string;
  /** ISO, stamped at send — the row reports it the way an applied row does. */
  sentAt: string;
}

/**
 * Seeded on two of the six teams, not all of them.
 *
 * A row on every card would read as board furniture — something the product puts
 * there rather than something a team chose — and it would make the offer
 * meaningless on the teams that would never honour it. Two is also what makes
 * the state visible in review: Protocol Labs (the top card, and the network's
 * own org) has one, Filecoin Foundation directly under it does not.
 */
export const MOCK_OPEN_ROLES: Record<string, OpenRole> = {
  'protocol-labs': {
    teamUid: 'protocol-labs',
    areas: ['Engineering', 'Research', 'Product'],
    locations: ['Remote'],
    blurb:
      'We hire ahead of our postings. If you have built distributed systems, worked on protocol research, or shipped developer products, tell us what you are after — we open roles as the work lands.',
  },
  libp2p: {
    teamUid: 'libp2p',
    areas: ['Engineering', 'Marketing'],
    locations: ['Remote'],
    blurb:
      'The maintainers read every note. We are a small core team, so a role usually starts as a conversation about what you would own rather than as a posting.',
  },
};

export const openRoleFor = (teamUid: string): OpenRole | undefined => MOCK_OPEN_ROLES[teamUid];
