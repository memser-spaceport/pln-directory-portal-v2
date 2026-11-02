# LAB-3038: long tag list on News preferences

Route: `/prototypes/lab-3038-design-the-long-tag-list-on-ne`. Mock data only.

The News preferences page of production with 44 mock tags. The "Limit" switch shows the two answers to the open question of the ticket:

- **Per theme (8):** each theme shows its first 8 tags. A longer theme ends its chip row with "Show N more"; open, it reads "Show less".
- **Whole list (20):** the first 20 tags of the list in theme order, then one "Show all 44 tags" button under the themes.

In both options, a picked tag always shows, a toggled tag stays in place for the visit, a theme with 8 tags or fewer has no link (a theme that would hide only one tag shows it), and a search shows every match with no link. The "Member" switch shows a member with picks after the limit, a new member with tags from their teams, and a member with no picks.
