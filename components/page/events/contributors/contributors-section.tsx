'use client';

import MembersList from '@/components/page/events/contributors/members-list';
import { Treemap as TeamsTreemap } from '@/components/core/events/treemap';
import { ResponsiveContainer } from '@/components/core/events/treemap';
import { Tooltip } from '@/components/core/events/treemap';
import { ChartTooltip } from '@/components/core/events/treemap';
import { TreemapCustomContent } from '@/components/core/events/treemap';
import ShadowButton from '@/components/ui/ShadowButton';
import { useEventsAnalytics } from '@/analytics/events.analytics';
import Modal from '@/components/core/modal';
import { useRef, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { PAGE_ROUTES, CONTRIBUTE_MODAL_VIDEO_URL } from '@/utils/constants';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { EmptyState } from '@/components/common/EmptyState';
import s from './ContributorsSection.module.scss';

const FILTER_OPTIONS = [
  { label: 'All Contributors', value: 'all' },
  { label: 'Hosts', value: 'host' },
  { label: 'Speakers', value: 'speaker' },
  { label: 'Sponsors', value: 'sponsor' },
];

interface ContributorsSectionProps {
  members?: any[];
  teams?: any[];
  title?: string;
  subtitle?: string;
  guestImg?: string;
  treemapConfig?: {
    backgroundColor?: string;
    borderColor?: string;
    height?: number;
  };
  userInfo?: any;
}

export default function ContributorsSection({
  members = [],
  teams = [],
  treemapConfig = {
    backgroundColor: '#E5F7FF',
    borderColor: '#ffffff',
    height: 400,
  },
  userInfo,
}: ContributorsSectionProps) {
  const { onContributeButtonClicked, onContributtonModalCloseClicked, onContributeModalIRLProceedButtonClicked } =
    useEventsAnalytics();
  const contributeRef = useRef<HTMLDialogElement>(null);

  const methods = useForm({
    defaultValues: {
      search: '',
      filter: FILTER_OPTIONS[0],
    },
  });

  const { watch, setValue } = methods;
  const searchValue = watch('search') || '';
  const filterValue = watch('filter');
  const activeFilter = filterValue?.value || 'all';
  const activeSearch = searchValue;

  const filteredMembers = useMemo(() => {
    let result = members;

    if (activeFilter !== 'all') {
      result = result.filter((member) => {
        if (activeFilter === 'host') {
          return member.isHost || member.events?.some((event: any) => event.isHost);
        }
        if (activeFilter === 'speaker') {
          return member.isSpeaker || member.events?.some((event: any) => event.isSpeaker);
        }
        if (activeFilter === 'sponsor') {
          return member.isSponsor || member.events?.some((event: any) => event.isSponsor);
        }
        return true;
      });
    }

    if (activeSearch.trim()) {
      const query = activeSearch.toLowerCase();
      result = result.filter((member) => member.member?.name?.toLowerCase().includes(query));
    }

    return result;
  }, [members, activeFilter, activeSearch]);

  const filteredTeams = useMemo(() => {
    let result = teams;

    if (activeFilter !== 'all') {
      result = result.filter((team) => {
        if (activeFilter === 'host') {
          return team.hosts > 0;
        }
        if (activeFilter === 'speaker') {
          return team.speakers > 0;
        }
        if (activeFilter === 'sponsor') {
          console.log(team, 'team');
          return team.sponsors > 0;
        }
        return true;
      });
    }

    if (activeSearch.trim()) {
      const query = activeSearch.toLowerCase();
      result = result.filter((team) => team.name?.toLowerCase().includes(query));
    }

    return result;
  }, [teams, activeFilter, activeSearch]);

  const handleClearSearch = () => {
    setValue('search', '');
  };

  const onCloseModal = () => {
    if (contributeRef.current) {
      contributeRef.current.close();
    }
    onContributtonModalCloseClicked();
  };

  const openContributeModal = () => {
    if (contributeRef.current) {
      contributeRef.current.showModal();
    }
    onContributeButtonClicked();
  };

  return (
    <FormProvider {...methods}>
      <div id="contributors" className={s.contributorsContainer}>
        <div>
          <div className={s.contributorsHeader}>
            <div className={s.titleRow}>
              <div>
                <h1 className={s.contributorsTitle}>Event Contributors</h1>
                <p className={s.contributorsSubtitle}>Hosts, Speakers and Sponsors</p>
              </div>
              <div className={s.mobileContributeButton}>
                <ShadowButton
                  buttonColor="#156FF7"
                  shadowColor="#3DFEB1"
                  buttonWidth="121px"
                  onClick={() => {
                    openContributeModal();
                  }}
                >
                  Contribute
                </ShadowButton>
              </div>
            </div>
            <div className={s.headerActions}>
              <div className={s.searchContainer}>
                <FormField
                  name="search"
                  placeholder="Search"
                  clearable={!!searchValue}
                  onClear={handleClearSearch}
                  icon={<SearchIcon />}
                />
              </div>
              <div className={s.filterDropdown}>
                <FormSelect
                  name="filter"
                  placeholder="All contributors"
                  options={FILTER_OPTIONS}
                  icon={<FilterIcon />}
                />
              </div>
              <div className={s.desktopContributeButton}>
                <ShadowButton
                  buttonColor="#156FF7"
                  shadowColor="#3DFEB1"
                  buttonWidth="121px"
                  onClick={() => {
                    openContributeModal();
                  }}
                >
                  Contribute
                </ShadowButton>
              </div>
            </div>
          </div>

          <div className={s.sectionContainer}>
            <MembersList members={filteredMembers} userInfo={userInfo} />
          </div>
        </div>

        <div className={s.divider}></div>

        <div className={`${s.sectionContainer}`}>
          {filteredTeams.length > 0 ? (
            <div
              className={s.treemapContainer}
              style={{
                height: treemapConfig.height,
                backgroundColor: treemapConfig.backgroundColor,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <TeamsTreemap
                  data={filteredTeams.map((team) => ({
                    name: team.name,
                    size: team.hosts + team.speakers,
                    speakers: team.speakers,
                    hosts: team.hosts,
                    sponsors: team.sponsors,
                    logo: team.logo,
                    uid: team.uid,
                  }))}
                  dataKey="size"
                  content={<TreemapCustomContent />}
                  fill={treemapConfig.backgroundColor}
                >
                  <Tooltip content={ChartTooltip} />
                </TeamsTreemap>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No teams match your search"
              description="Try a different keyword or clear filters."
            />
          )}
        </div>

        <Modal modalRef={contributeRef} onClose={onCloseModal}>
          <div className={s.contributeModalContainer}>
            <div className={s.contributeModalHeader}>Ways to contribute</div>
            <div className={s.contributeModalVideoContainer}>
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: 'auto', pointerEvents: 'none', borderRadius: '10px' }}
                className={s.contributeModalVideo}
                controls={false}
              >
                <source src={CONTRIBUTE_MODAL_VIDEO_URL} type="video/webm" />
                Your browser does not support this video.
              </video>
            </div>
            <div className={s.contributeModalContent}>
              <div className={s.contributeModalContentDescription}>
                IRL Gatherings thrive when community members contribute in different ways! Here&apos;s how you can be a
                part of it.
              </div>
              <div className={s.contributeModalContentList}>
                <div className={`${s.contributeModalContentListItem} ${s.sponsor}`}>
                  <span className={s.contributeModalContentListItemIcon}>
                    <img src="/icons/sponsor_icon.svg" alt="Contribute to a gathering" />
                    <span>
                      Sponsor <span className={s.desktopView}> -</span>
                    </span>
                  </span>
                  <div className={s.contributeModalContentListItemTitle}>
                    Help make it happen by offering support or resources.
                  </div>
                </div>
                <div className={`${s.contributeModalContentListItem} ${s.speaker}`}>
                  <span className={s.contributeModalContentListItemIcon}>
                    <img src="/icons/host_icon.svg" alt="Contribute to a gathering" />
                    <span>
                      Host <span className={s.desktopView}> -</span>
                    </span>
                  </span>
                  <div className={s.contributeModalContentListItemTitle}>
                    Plan or organize a gathering for the community.
                  </div>
                </div>
                <div className={`${s.contributeModalContentListItem} ${s.host}`}>
                  <span className={s.contributeModalContentListItemIcon}>
                    <img src="/icons/speaker_icon.svg" alt="Contribute to a gathering" />
                    <span>
                      Speaker <span className={s.desktopView}> -</span>
                    </span>
                  </span>
                  <div className={s.contributeModalContentListItemTitle}>
                    Share insights and expertise by speaking at an event.
                  </div>
                </div>
                <div className={`${s.contributeModalContentListItem} ${s.attendee}`}>
                  <span className={s.contributeModalContentListItemIcon}>
                    <img src="/icons/attendee_icon.svg" alt="Contribute to a gathering" />
                    <span>
                      Attendee <span className={s.desktopView}> -</span>
                    </span>
                  </span>
                  <div className={s.contributeModalContentListItemTitle}>
                    Be part of the experience and engage with others.
                  </div>
                </div>
              </div>
            </div>
            <div className={s.contributeModalContentDescription}>
              Once you land on IRL Gatherings, Click “I&apos;m Going” & choose how you&apos;d like to contribute and
              help make these gatherings valuable for everyone!
            </div>
            <div className={s.contributeModalContentButton}>
              <button className={s.contributeModalContentButtonCancel} onClick={onCloseModal}>
                Cancel
              </button>
              <button
                className={s.contributeModalContentButtonProceed}
                onClick={() => {
                  onContributeModalIRLProceedButtonClicked();
                  window.open(PAGE_ROUTES.IRL);
                }}
              >
                Continue to IRL Gatherings
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </FormProvider>
  );
}

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 10H15M2.5 5H17.5M7.5 15H12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
