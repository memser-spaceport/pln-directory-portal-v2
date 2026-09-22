'use client';

/**
 * The profile's first card — ProfileDetails, read and edit.
 *
 * Production's ProfileDetails.tsx toggles one card between MemberDetailHeader
 * (read) and EditProfileForm (edit), with `.editView` turning it into a
 * full-screen sheet below tablet-landscape and a blue-washed panel above. Both
 * states are reproduced here because the whole proposal now lives inside this
 * card: there is no separate travel section, only the Location field growing a
 * time dimension (see LocationField.tsx).
 *
 * Import-safe production parts used as-is: ProfileImageInput, FormField,
 * FormMultiSelect, FormSelect, EditFormControls, EditButton, TagsList, Tooltip.
 * BioInput is not — it calls useGenerateBioWithAi (react-query) — so the bio row
 * is a plain textarea, deliberately simplified.
 */

import clsx from 'clsx';
import { useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { EditButton } from '@/components/common/profile/EditButton';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { TagsList } from '@/components/common/profile/TagsList';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';
import { FormField } from '@/components/form/FormField';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { FormSelect } from '@/components/form/FormSelect';
import { ProfileImageInput } from '@/components/page/member-details/ProfileDetails/components/ProfileImageInput';
import { MAX_NAME_LENGTH } from '@/constants/profile';
import type { IMember } from '@/types/members.types';

import profile from '@/components/page/member-details/ProfileDetails/ProfileDetails.module.scss';
import h from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
import ef from '@/components/page/member-details/ProfileDetails/components/EditProfileForm/EditProfileForm.module.scss';
import skillsCss from '@/components/page/member-details/ProfileDetails/components/ProfileSkillsInput/ProfileSkillsInput.module.scss';
import loc from '@/components/page/member-details/ProfileDetails/components/ProfileLocationInput/ProfileLocationInput.module.scss';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { SKILL_OPTIONS, TEAM_OPTIONS, type PersonCityMember, type Trip } from './mocks';
import { tripsFor } from './presence';
import { PresenceLabel } from './PresenceLabel';
import { UpcomingChip } from './UpcomingChip';
import { LocationField } from './LocationField';
import s from './LocationField.module.scss';

interface ProfileDetailsCardProps {
  member: PersonCityMember;
  bio: string;
  trips: Trip[];
  todayKey: string;
  onTripsChange: (next: Trip[]) => void;
  isOwner: boolean;
  /** open straight into the edit form with the add row showing — the members-page hand-off */
  startEditing?: boolean;
  /** stays other people can see, for "who else is there"; defaults to `trips` */
  networkTrips?: Trip[];
  /** the person reading someone else's profile — drives "You'll be there too" */
  viewer?: { homeCity: string; stays: Trip[] };
}

export function ProfileDetailsCard({
  member,
  bio,
  trips,
  todayKey,
  onTripsChange,
  isOwner,
  startEditing = false,
  networkTrips,
  viewer,
}: ProfileDetailsCardProps) {
  const [editView, setEditView] = useState(startEditing);
  const [home, setHome] = useState(member.home);
  // Set by the header's "+ Add travel dates" prompt, so the form it opens lands
  // with the add row already showing — the same destination the members-page
  // hand-off and the RSVP flow reach, from the third direction.
  const [addStayOnOpen, setAddStayOnOpen] = useState(false);

  const myTrips = tripsFor(member.id, trips);
  // A stay the product only guessed isn't on the profile until it's added.
  const shownTrips = myTrips.filter((trip) => trip.confirmed);
  const hasUpcoming = shownTrips.some((trip) => trip.endDate >= todayKey);

  const methods = useForm({
    defaultValues: {
      image: null as File | null,
      isImageDeleted: false,
      name: member.name,
      skills: member.skills.map((skill) => ({ value: skill.title, label: skill.title })),
      primaryTeamRole: member.role,
      primaryTeam: TEAM_OPTIONS.find((team) => team.label === member.teamName) ?? null,
      bio,
      // Trips aren't react-hook-form fields, so a counter carries their dirtiness
      // to EditFormControls, which gates Save on `isDirty` exactly as production does.
      revision: 0,
    },
  });
  const revision = useRef(0);
  const touch = () => {
    revision.current += 1;
    methods.setValue('revision', revision.current, { shouldDirty: true });
  };

  const closeEdit = () => {
    setEditView(false);
    setAddStayOnOpen(false);
    methods.reset();
  };

  const asMember = { name: member.name } as Partial<IMember>;

  return (
    <div className={clsx(profile.root, { [profile.editView]: editView })}>
      {editView ? (
        <FormProvider {...methods}>
          <form noValidate onSubmit={methods.handleSubmit(closeEdit)}>
            <EditFormControls onClose={closeEdit} title="Edit Profile Details" />

            <div className={ef.body}>
              <div className={ef.row}>
                <ProfileImageInput member={asMember} allowDelete />
                <FormField name="name" label="Name" isRequired placeholder="Text" max={MAX_NAME_LENGTH} />
              </div>

              {/* THE INSERT — EditProfileForm.tsx:360-362, same slot, same label,
                  same hint. Everything new is below the divider inside it. */}
              <div className={ef.row}>
                <LocationField
                  home={home}
                  onHomeChange={(next) => {
                    setHome(next);
                    touch();
                  }}
                  stays={myTrips}
                  onStaysChange={(next) => {
                    onTripsChange([...trips.filter((trip) => trip.memberId !== member.id), ...next]);
                    touch();
                  }}
                  networkTrips={networkTrips ?? trips.filter((trip) => trip.confirmed)}
                  memberId={member.id}
                  todayKey={todayKey}
                  autoOpen={startEditing || addStayOnOpen}
                />
              </div>

              <div className={ef.row}>
                <div className={skillsCss.root}>
                  <div className={skillsCss.header}>
                    <span className={skillsCss.label}>Professional skills</span>
                  </div>
                  <FormMultiSelect placeholder="Add your skills" options={SKILL_OPTIONS} name="skills" />
                  <p className={skillsCss.hint}>Sharing your skills help founders &amp; teams connect with you.</p>
                </div>
              </div>

              <div className={ef.column}>
                <div className={ef.inputsLabel}>Primary Role &amp; Team</div>
                <div className={ef.inputsWrapper}>
                  <FormField name="primaryTeamRole" placeholder="Enter your primary role" />
                  <span>@</span>
                  <FormSelect name="primaryTeam" placeholder="Search or add a team" options={TEAM_OPTIONS} />
                </div>
                <div className={ef.description}>Add your role and team so others can connect with you.</div>
              </div>

              {/* Simplified: production's BioInput is a rich-text editor wired to
                  useGenerateBioWithAi (react-query). */}
              <div className={ef.row}>
                <div className={loc.root}>
                  <div className={loc.header}>
                    <span className={loc.label}>Bio</span>
                  </div>
                  <textarea className={s.bioArea} defaultValue={bio} rows={3} />
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
      ) : (
        <>
          <div className={h.header}>
            <div className={h.headerProfile}>
              <img className={h.headerProfileImg} src={getDefaultAvatar(member.name)} alt={member.name} />
            </div>

            <div className={h.headerDetails}>
              <div>
                <div className={h.specificsHdr}>
                  <CustomTooltip trigger={<h1 className={h.specificsName}>{member.name}</h1>} content={member.name} />
                </div>
                <div className={h.roleAndLocation}>
                  {member.teamName && (
                    <>
                      <div className={h.teams}>
                        <p className={h.teamsName}>{member.teamName}</p>
                      </div>
                      <div className={clsx(h.divider, h.desktopOnly)} />
                    </>
                  )}

                  {/* MemberDetailHeader.tsx:134-147 — an empty role or location
                      is an amber "+ Your …" prompt that opens this same form,
                      not a blank. The calendar adds no prompt of its own: there
                      is one entry point to the field and it already exists. */}
                  {member.role ? (
                    <p className={h.role}>{member.role}</p>
                  ) : (
                    isOwner && (
                      <button type="button" className={h.addButton} onClick={() => setEditView(true)}>
                        + Your Role
                      </button>
                    )
                  )}
                  <div className={h.divider} />

                  {/* MemberDetailHeader.tsx:167-170 — the same slot, and it keeps
                      its production meaning: the pin is always the declared home
                      city. Travel never overwrites it; it sits beside it as one
                      chip. Same on your own profile and on someone else's, so
                      the pin means one thing everywhere. */}
                  {home.city ? (
                    <>
                      <div className={s.locationGroup}>
                        <span className={s.locationSlot}>
                          <PresenceLabel
                            presence={{ city: home.city, country: home.country }}
                            home={home}
                            variant="inline"
                          />
                        </span>
                        <UpcomingChip stays={shownTrips} todayKey={todayKey} viewer={viewer} />
                      </div>

                      {/* Nothing else on the page says a location can have dates
                          on it. Edit → Location → Other locations is three steps
                          behind a pencil, and a field you have already filled in
                          gives you no reason to open it again — so the offer has
                          to stand in the slot the answer will appear in.

                          It is the strip's own prompt, not a variant of one:
                          `h.addButton` and an `h.divider` before it, exactly as
                          `+ Your Role` and `+ Your Location` are rendered a few
                          lines up. One prompt lineage in one row — the earlier
                          blue version argued that amber means *required* and
                          travel dates aren't, which made the newest thing in the
                          strip the one item that didn't look like its
                          neighbours.

                          Owner only, and only while the chip has nothing to
                          show — once a stay is on the profile the chip is the
                          thing that says dates exist, and more of them go in the
                          list behind Edit. */}
                      {isOwner && !hasUpcoming && (
                        <>
                          <div className={h.divider} />
                          <button
                            type="button"
                            className={h.addButton}
                            onClick={() => {
                              setAddStayOnOpen(true);
                              setEditView(true);
                            }}
                          >
                            + Add travel dates
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    isOwner && (
                      <button type="button" className={h.addButton} onClick={() => setEditView(true)}>
                        + Your Location
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* MemberDetailHeader.tsx:177-181 — the Edit button is the second
                  child of headerDetails, not a trailing sibling. */}
              <div>{isOwner && <EditButton onClick={() => setEditView(true)} />}</div>
            </div>

            <div className={h.tags}>
              {member.openToWork && (
                <div className={h.funds}>
                  <span className={h.fundsLabel}>Open to Collaborate</span>
                </div>
              )}
              {member.teamLead && (
                <div className={h.funds}>
                  <span className={h.fundsLabel}>Team lead</span>
                </div>
              )}
              <TagsList tags={member.skills.map((skill) => ({ title: skill.title }))} tagsToShow={5} />
            </div>
          </div>

          {/* ProfileDetails.tsx:64 gates the bio on `hasBio` — a day-one profile
              has none, and an empty "Bio" heading is worse than no heading. */}
          {bio && (
            <div className={profile.bioContainer}>
              <div className={profile.bioTitle}>Bio</div>
              <div className={profile.bioContent}>{bio}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
