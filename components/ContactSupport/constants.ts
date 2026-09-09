/** The `?dialog=` query values, and the second half of every `openModal` call. */
export type ContactSupportDialogParam =
  | 'contactSupport'
  | 'askQuestion'
  | 'giveFeedback'
  | 'shareIdea'
  | 'reportBug';

export interface IContactSupportTopic {
  label: string;
  value: string;
  dialogParam: ContactSupportDialogParam;
}

/**
 * The one list of topics on offer.
 *
 * It feeds three things that used to be maintained separately: the header
 * menu's items, the pill row inside the support form, and the `?dialog=` deep
 * links (via `DIALOG_TO_TOPIC_MAP`, which is derived from this). The door and
 * the room can therefore never disagree about what you can send.
 */
export const CONTACT_SUPPORT_TOPICS: IContactSupportTopic[] = [
  {
    label: 'Contact support',
    value: 'Contact support',
    dialogParam: 'contactSupport',
  },
  {
    label: 'Ask a question',
    value: 'Ask a question',
    dialogParam: 'askQuestion',
  },
  {
    label: 'Give feedback',
    value: 'Give feedback',
    dialogParam: 'giveFeedback',
  },
  {
    label: 'Share an idea',
    value: 'Share an idea',
    dialogParam: 'shareIdea',
  },
  {
    label: 'Report a bug',
    value: 'Report a bug',
    dialogParam: 'reportBug',
  },
];
