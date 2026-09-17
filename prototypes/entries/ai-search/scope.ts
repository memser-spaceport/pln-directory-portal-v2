import type { CannedAnswer } from './mocks';

/**
 * A scope narrows the AI Search view to one entity's records: a team or a
 * member. It is not a second assistant. The view, the answer anatomy and the
 * history are the same ones; the scope only changes what gets read, what the
 * idle state suggests, and where an answer's door leads.
 *
 * It shows as a removable chip at the left of the field (Sana pins a file
 * that way, Qatalog and Fabric label the box with its source). One corpus,
 * one entity, so a chip and not a source menu. Removing it widens the same
 * view to the network.
 *
 * The page that opens the view builds the scope from its own fixtures (see
 * `team-profile/aiSearchScope.ts`), because only that page knows which
 * sections exist and what this viewer may read.
 */
export interface AiSearchScope {
  uid: string;
  /** What the chip's picture is: a team wears a rounded square, a person a circle. */
  kind: 'team' | 'member';
  /** The entity's name as the page shows it. The chip reads "About <name>". */
  name: string;
  logo: string;
  /**
   * One question per section the page actually has, in the viewer's own
   * terms, the overview first. Sections that are absent, or that this viewer
   * can't read, give no prompt.
   */
  prompts: { text: string; icon: string }[];
  /** The scoped answer to a question: canned where the demo has one, assembled otherwise. */
  answer: (question: string) => CannedAnswer;
  /** Follow an answer's door. The view closes first. */
  onOpen: (target: string) => void;
}
