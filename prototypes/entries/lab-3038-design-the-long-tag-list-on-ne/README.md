# LAB-3038: long tag list on News preferences

Route: `/prototypes/lab-3038-design-the-long-tag-list-on-ne`. Mock data only.

The News preferences page of production with 44 mock tags. The "Limit" switch shows the two answers to the open question of the ticket:

- **Per theme (8):** each theme shows its first 8 tags. A longer theme ends its chip row with "Show N more"; open, it reads "Show less".
- **Whole list (20):** the first 20 tags of the list in theme order, then one "Show all 44 tags" button under the themes.

In both options, a picked tag always shows, a toggled tag stays in place for the visit, a theme with 8 tags or fewer has no link (a theme that would hide only one tag shows it), and a search shows every match with no link. The "Member" switch shows a member with picks after the limit, a new member with tags from their teams, and a member with no picks.

## Version 2 (2026-11-02)

Asked by Polina: a "Teams to follow" state for the new member. With "Member: New member", the member follows no teams. The "Teams you follow" card shows "You don't follow any teams yet." and then a "Teams to follow" list: 4 mock teams from the focus areas of the member's team (the same source as the seeded tags), each with a Follow button, and a "See all teams" link. A followed team stays in its place, shows "Following", and adds to the count in the card title. The empty line goes away after the first follow. "Has picks" and "No picks" keep the followed teams of version 1.
