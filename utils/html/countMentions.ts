/** How many members a comment mentions. The class RichTextEditor's MentionBlot
 *  stamps is the only thing distinguishing a mention from an ordinary link. */
export function countMentions(html: string): number {
  return html.match(/class="ql-mention"/g)?.length ?? 0;
}
