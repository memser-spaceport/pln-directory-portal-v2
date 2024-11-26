import { render, screen, fireEvent } from "@testing-library/react";
import AllMembers from "@/components/page/team-details/all-members";
import { IMember } from "@/types/members.types";
import { ITeam } from "@/types/teams.types";
import '@testing-library/jest-dom';
import { EVENTS } from "@/utils/constants";

const mockMembers: IMember[] = [
    {
        id: "1", name: "John Doe", teams: [{
            id: 'team1',
            name: 'Team 1',
            contactMethod: 'Email',
            technologies: [{ title: 'React' }, { title: 'Node.js' }],
            industryTags: [{ title: 'Tech' }],
            fundingStage: { title: 'Seed' },
            membershipSources: [{ title: 'Source A' }],
            logoUid: 'logo123',
            maintainingProjects: [],
            contributingProjects: [],
            teamFocusAreas: []
        }],
        skills: [{ title: 'React' }],
        projectContributions: [],
        location: {
            city: "Unknown", country: "Unknown",
            metroArea: "",
            region: "",
            continent: ""
        },
        officeHours: null,
        teamLead: false,
        mainTeam: null,
        openToWork: false,
        preferences: {
            showEmail: false,
            showDiscord: false,
            showTwitter: false,
            showLinkedin: false,
            showTelegram: false,
            showGithubHandle: false,
            showGithubProjects: false
        }
    },
    {
        id: "2", name: "Jane Smith", teams: [{
            id: 'team1',
            name: 'Team 1',
            contactMethod: 'Email',
            technologies: [{ title: 'React' }, { title: 'Node.js' }],
            industryTags: [{ title: 'Tech' }],
            fundingStage: { title: 'Seed' },
            membershipSources: [{ title: 'Source A' }],
            logoUid: 'logo123',
            maintainingProjects: [],
            contributingProjects: [],
            teamFocusAreas: []
        }],
        skills: [{ title: 'React' }],
        projectContributions: [],
        location: {
            city: "Unknown", country: "Unknown",
            metroArea: "",
            region: "",
            continent: ""
        },
        officeHours: null,
        teamLead: false,
        mainTeam: null,
        openToWork: false,
        preferences: {
            showEmail: false,
            showDiscord: false,
            showTwitter: false,
            showLinkedin: false,
            showTelegram: false,
            showGithubHandle: false,
            showGithubProjects: false
        }
    },
];

const mockCallback = jest.fn();

describe("AllMembers Component", () => {
    it("should render all members", () => {
        render(<AllMembers members={mockMembers} teamId="team1" onCardClick={mockCallback} />);
        expect(screen.getByText("Members (2)")).toBeInTheDocument();
        expect(screen.getAllByText("John Doe")).toHaveLength(2);
        expect(screen.getAllByText("Jane Smith")).toHaveLength(2);
    });

    it("should filter members based on search input", () => {
        render(<AllMembers members={mockMembers} teamId="team1" onCardClick={mockCallback} />);
        const searchInput = screen.getByPlaceholderText("Search");
        fireEvent.change(searchInput, { target: { value: "John" } });
        expect(screen.getAllByText("John Doe")).toHaveLength(2);
        expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    it("should display 'No Members found.' when no members match the search input", () => {
        render(<AllMembers members={mockMembers} teamId="team1" onCardClick={mockCallback} />);
        const searchInput = screen.getByPlaceholderText("Search");
        fireEvent.change(searchInput, { target: { value: "Nonexistent" } });
        expect(screen.getByText("No Members found.")).toBeInTheDocument();
    });
    it("should display Members(2) when search input has ''", async () => {
        render(<AllMembers members={mockMembers} teamId="team1" onCardClick={mockCallback} />);
        const searchInput = screen.getByPlaceholderText("Search");
        fireEvent.change(searchInput, { target: { value: 'test' } });
        fireEvent.change(searchInput, { target: { value: '' } });
        expect(screen.getByText("Members (2)")).toBeInTheDocument();
    });

    it("should reset search input and members list when TEAM_DETAIL_ALL_MEMBERS_CLOSE event is triggered", async () => {
        render(<AllMembers members={mockMembers} teamId="team1" onCardClick={mockCallback} />);
        const searchInput = screen.getByPlaceholderText("Search");
        fireEvent.change(searchInput, { target: { value: "John" } });
        expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();

        const event = new CustomEvent(EVENTS.TEAM_DETAIL_ALL_MEMBERS_CLOSE);
        await document.dispatchEvent(event);

        expect(screen.getByText("Members (2)")).toBeInTheDocument();
    });
});