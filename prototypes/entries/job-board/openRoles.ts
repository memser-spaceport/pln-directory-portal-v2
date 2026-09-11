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
 * **Mocked, not submitted.** In the product a lead would switch one on from
 * *Submit a job* — no title, no seniority, no posting link, just the sentence
 * below. That half is not built here; the two teams that have one are seeded in
 * `MOCK_OPEN_ROLES`, so this pass is about what a reader meets.
 */

/**
 * What a team offers when it has no posting to offer.
 *
 * **One field, and it took a correction to get here.** The first version carried
 * `areas` (the role categories the team hires into) and `locations`, because the
 * row it renders in has a meta slot and a posting fills that slot with exactly
 * those two facts. Both were cut. A borrowed component's slots are not a list of
 * questions to answer — the row's job here is to ask one, and a line of
 * categories under it turns an invitation back into a small posting.
 */
export interface OpenRole {
  teamUid: string;
  /**
   * The team's own sentence about who they want to hear from, shown on the
   * interest form under its title.
   *
   * On the form and not on the row: the row is one line in a list of postings
   * and its line is the question. Someone who presses has asked to read the
   * answer.
   */
  blurb: string;
}

/**
 * What the reader sends back: one message, and nothing else.
 *
 * **The structured half is gone.** This used to carry `areas` too — a required
 * pick from the team's own categories, defended on the grounds that a
 * speculative application with no direction cannot be routed. Routing is the
 * product's convenience, not the reader's question, and the person answering
 * "what are you looking for?" was being made to answer it twice: once as a
 * taxonomy the team maintains, once in their own words. The words were always
 * the part worth reading.
 *
 * Everything else a team needs — name, current role, experience, skills, the CV
 * — is already on the profile, which travels with the signal. Asking for it here
 * would be asking someone to retype what the account exists to hold.
 */
export interface OpenInterest {
  teamUid: string;
  /** Optional. Empty string when they sent it without one — the press itself is
   *  the signal, exactly as production's per-role interest is a bare press. */
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
    blurb:
      'We hire ahead of our postings. If you have built distributed systems, worked on protocol research, or shipped developer products, tell us what you are after — we open roles as the work lands.',
  },
  libp2p: {
    teamUid: 'libp2p',
    blurb:
      'The maintainers read every note. We are a small core team, so a role usually starts as a conversation about what you would own rather than as a posting.',
  },
};

export const openRoleFor = (teamUid: string): OpenRole | undefined => MOCK_OPEN_ROLES[teamUid];
