import { IAdvisor, IAvailabilitySlot, IBookableSlot, IBooking, ITimeRequest } from '@/types/advisors.types';

// Reference date: today is 2026-04-01
// We'll compute "next 14 days" dynamically in getMockBookableSlots

const makeMember = (
  id: string,
  name: string,
  email: string,
  bio: string,
  skills: { uid: string; title: string }[],
  location: { city: string; country: string; region: string; continent: string; metroArea: string }
) =>
  ({
    id,
    name,
    email,
    bio,
    image: null,
    skills,
    location,
    teams: [],
    mainTeam: null,
    officeHours: null,
    projectContributions: [],
    openToWork: false,
    isVerified: true,
    preferences: {},
    accessLevel: 'L2',
    scheduleMeetingCount: null,
    teamLead: false,
    linkedinProfile: null,
  } as any);

// ---------------------------------------------------------------------------
// Availability slot helpers
// ---------------------------------------------------------------------------

let slotIdCounter = 1;
const makeSlot = (
  advisorId: string,
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  startTime: string,
  endTime: string,
  timezone: string
): IAvailabilitySlot => ({
  id: `slot-${slotIdCounter++}`,
  advisorId,
  dayOfWeek,
  startTime,
  endTime,
  slotDuration: 30,
  timezone,
});

// ---------------------------------------------------------------------------
// MOCK_ADVISORS
// ---------------------------------------------------------------------------

export const MOCK_ADVISORS: IAdvisor[] = [
  // 1 — Aisha Mensah  (San Francisco, DeFi / Protocol Design)
  {
    id: 'advisor-001',
    memberId: 'member-001',
    member: makeMember(
      'member-001',
      'Aisha Mensah',
      'aisha.mensah@example.com',
      'Protocol researcher and DeFi architect with 8+ years in decentralised systems. Previously led research at a top L1 foundation.',
      [
        { uid: 'sk-1', title: 'DeFi' },
        { uid: 'sk-2', title: 'Protocol Design' },
        { uid: 'sk-3', title: 'Tokenomics' },
      ],
      { city: 'San Francisco', country: 'United States', region: 'California', continent: 'North America', metroArea: 'San Francisco Bay Area' }
    ),
    bio: 'I help early-stage Web3 teams design sustainable token economies and protocol mechanics. Office hours focus on DeFi primitives, mechanism design, and go-to-market strategy for protocol launches.',
    calendarProvider: 'google',
    calendarConnected: true,
    availabilitySlots: [
      makeSlot('advisor-001', 1, '09:00', '11:00', 'America/Los_Angeles'), // Monday
      makeSlot('advisor-001', 3, '14:00', '16:00', 'America/Los_Angeles'), // Wednesday
    ],
    status: 'ACTIVE',
    createdAt: '2025-11-01T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  },

  // 2 — Carlos Reyes  (Mexico City, Growth / GTM)
  {
    id: 'advisor-002',
    memberId: 'member-002',
    member: makeMember(
      'member-002',
      'Carlos Reyes',
      'carlos.reyes@example.com',
      'Growth hacker and GTM strategist. Built and scaled user acquisition for three crypto unicorns.',
      [
        { uid: 'sk-4', title: 'Growth Strategy' },
        { uid: 'sk-5', title: 'Marketing' },
        { uid: 'sk-6', title: 'Community Building' },
      ],
      { city: 'Mexico City', country: 'Mexico', region: 'CDMX', continent: 'North America', metroArea: 'Mexico City' }
    ),
    bio: 'Specialising in zero-to-one growth for crypto products. I can help with community flywheels, referral mechanics, and content-led distribution.',
    calendarProvider: 'calendly',
    calendarConnected: true,
    availabilitySlots: [
      makeSlot('advisor-002', 2, '10:00', '12:00', 'America/Mexico_City'), // Tuesday
      makeSlot('advisor-002', 4, '10:00', '12:00', 'America/Mexico_City'), // Thursday
    ],
    status: 'ACTIVE',
    createdAt: '2025-11-10T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },

  // 3 — Priya Nair  (Bangalore, Smart Contracts / Security) — NO CALENDAR
  {
    id: 'advisor-003',
    memberId: 'member-003',
    member: makeMember(
      'member-003',
      'Priya Nair',
      'priya.nair@example.com',
      'Smart contract security researcher. Audited 60+ protocols and found critical bugs in top-10 DeFi projects.',
      [
        { uid: 'sk-7', title: 'Smart Contracts' },
        { uid: 'sk-8', title: 'Security Audits' },
        { uid: 'sk-9', title: 'Solidity' },
      ],
      { city: 'Bangalore', country: 'India', region: 'Karnataka', continent: 'Asia', metroArea: 'Bangalore' }
    ),
    bio: 'I review smart contract architectures, help teams prepare for audits, and advise on secure upgrade patterns. Calendar not yet connected — request a time to get in touch.',
    calendarProvider: null,
    calendarConnected: false,
    availabilitySlots: [],
    status: 'ACTIVE',
    createdAt: '2025-12-01T00:00:00.000Z',
    updatedAt: '2026-01-20T00:00:00.000Z',
  },

  // 4 — Marcus Webb  (London, Fundraising / VC Relations)
  {
    id: 'advisor-004',
    memberId: 'member-004',
    member: makeMember(
      'member-004',
      'Marcus Webb',
      'marcus.webb@example.com',
      'Former VC partner turned founder. Closed $120M+ in funding rounds across seed to Series B.',
      [
        { uid: 'sk-10', title: 'Fundraising' },
        { uid: 'sk-11', title: 'VC Relations' },
        { uid: 'sk-12', title: 'Pitch Deck' },
      ],
      { city: 'London', country: 'United Kingdom', region: 'England', continent: 'Europe', metroArea: 'London' }
    ),
    bio: 'I help founders craft compelling narratives, model token fundraises, and navigate VC conversations. Happy to do pitch deck reviews and warm intros.',
    calendarProvider: 'google',
    calendarConnected: true,
    availabilitySlots: [
      makeSlot('advisor-004', 1, '08:00', '10:00', 'Europe/London'), // Monday
      makeSlot('advisor-004', 5, '09:00', '11:00', 'Europe/London'), // Friday
    ],
    status: 'ACTIVE',
    createdAt: '2025-10-15T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },

  // 5 — Yuki Tanaka  (Tokyo, Storage / IPFS / Filecoin)
  {
    id: 'advisor-005',
    memberId: 'member-005',
    member: makeMember(
      'member-005',
      'Yuki Tanaka',
      'yuki.tanaka@example.com',
      'Distributed storage engineer. Core contributor to Filecoin tooling and IPFS integrations.',
      [
        { uid: 'sk-13', title: 'IPFS' },
        { uid: 'sk-14', title: 'Filecoin' },
        { uid: 'sk-15', title: 'Distributed Storage' },
      ],
      { city: 'Tokyo', country: 'Japan', region: 'Kanto', continent: 'Asia', metroArea: 'Tokyo' }
    ),
    bio: 'Deep expertise in content-addressable storage, data persistence strategies, and Filecoin deal-making. Great resource for teams building on IPFS/FVM.',
    calendarProvider: 'google',
    calendarConnected: true,
    availabilitySlots: [
      makeSlot('advisor-005', 2, '19:00', '21:00', 'Asia/Tokyo'), // Tuesday (late evening Tokyo = early morning US)
      makeSlot('advisor-005', 4, '19:00', '21:00', 'Asia/Tokyo'), // Thursday
    ],
    status: 'ACTIVE',
    createdAt: '2025-11-20T00:00:00.000Z',
    updatedAt: '2026-02-10T00:00:00.000Z',
  },

  // 6 — Fatima Al-Hassan  (Dubai, Legal / Regulatory)
  {
    id: 'advisor-006',
    memberId: 'member-006',
    member: makeMember(
      'member-006',
      'Fatima Al-Hassan',
      'fatima.alhassan@example.com',
      'Crypto-native lawyer specialising in token structuring, DAO governance, and VASP licensing across MENA and EU.',
      [
        { uid: 'sk-16', title: 'Legal' },
        { uid: 'sk-17', title: 'Regulatory Compliance' },
        { uid: 'sk-18', title: 'Token Structuring' },
      ],
      { city: 'Dubai', country: 'United Arab Emirates', region: 'Dubai', continent: 'Asia', metroArea: 'Dubai' }
    ),
    bio: 'I advise on token legal structures, regulatory strategy, and DAO formation. Familiar with VARA (Dubai), MiCA (EU), and SEC guidance. Not legal advice — but I help teams ask the right questions.',
    calendarProvider: 'calendly',
    calendarConnected: true,
    availabilitySlots: [
      makeSlot('advisor-006', 0, '10:00', '12:00', 'Asia/Dubai'), // Sunday
      makeSlot('advisor-006', 3, '14:00', '16:00', 'Asia/Dubai'), // Wednesday
    ],
    status: 'ACTIVE',
    createdAt: '2025-12-10T00:00:00.000Z',
    updatedAt: '2026-01-30T00:00:00.000Z',
  },

  // 7 — Lena Hoffmann  (Berlin, Product / UX)
  {
    id: 'advisor-007',
    memberId: 'member-007',
    member: makeMember(
      'member-007',
      'Lena Hoffmann',
      'lena.hoffmann@example.com',
      'Product designer and UX researcher who has shipped wallets, DEXs, and NFT platforms used by millions.',
      [
        { uid: 'sk-19', title: 'Product Design' },
        { uid: 'sk-20', title: 'UX Research' },
        { uid: 'sk-21', title: 'Web3 UX' },
      ],
      { city: 'Berlin', country: 'Germany', region: 'Berlin', continent: 'Europe', metroArea: 'Berlin' }
    ),
    bio: 'I focus on making crypto products accessible without sacrificing power. Happy to review onboarding flows, wallet UX, and NFT marketplace designs.',
    calendarProvider: 'google',
    calendarConnected: true,
    availabilitySlots: [
      makeSlot('advisor-007', 1, '15:00', '17:00', 'Europe/Berlin'), // Monday
      makeSlot('advisor-007', 3, '15:00', '17:00', 'Europe/Berlin'), // Wednesday
    ],
    status: 'ACTIVE',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-03-15T00:00:00.000Z',
  },

  // 8 — Kwame Asante  (Accra, Developer Relations) — NO CALENDAR
  {
    id: 'advisor-008',
    memberId: 'member-008',
    member: makeMember(
      'member-008',
      'Kwame Asante',
      'kwame.asante@example.com',
      'DevRel lead who grew developer ecosystems for two major L2s. Built SDKs, hackathon programs, and documentation pipelines.',
      [
        { uid: 'sk-22', title: 'Developer Relations' },
        { uid: 'sk-23', title: 'SDK Design' },
        { uid: 'sk-24', title: 'Technical Writing' },
      ],
      { city: 'Accra', country: 'Ghana', region: 'Greater Accra', continent: 'Africa', metroArea: 'Accra' }
    ),
    bio: 'I help protocols build thriving developer communities. Reach out about ecosystem strategy, grant programs, hackathon design, and documentation best practices.',
    calendarProvider: null,
    calendarConnected: false,
    availabilitySlots: [],
    status: 'ACTIVE',
    createdAt: '2026-01-20T00:00:00.000Z',
    updatedAt: '2026-02-28T00:00:00.000Z',
  },

  // 9 — Sofia Pereira  (São Paulo, Engineering / Scalability)
  {
    id: 'advisor-009',
    memberId: 'member-009',
    member: makeMember(
      'member-009',
      'Sofia Pereira',
      'sofia.pereira@example.com',
      'Backend engineer specialising in blockchain node infrastructure, performance optimisation, and cross-chain bridges.',
      [
        { uid: 'sk-25', title: 'Infrastructure' },
        { uid: 'sk-26', title: 'Scalability' },
        { uid: 'sk-27', title: 'Cross-chain Bridges' },
      ],
      { city: 'São Paulo', country: 'Brazil', region: 'São Paulo', continent: 'South America', metroArea: 'São Paulo' }
    ),
    bio: 'I help teams architect high-throughput decentralised systems and safely deploy cross-chain infrastructure. Strong opinions on validator set design and bridge security.',
    calendarProvider: 'google',
    calendarConnected: true,
    availabilitySlots: [
      makeSlot('advisor-009', 2, '08:00', '10:00', 'America/Sao_Paulo'), // Tuesday
      makeSlot('advisor-009', 5, '08:00', '10:00', 'America/Sao_Paulo'), // Friday
    ],
    status: 'ACTIVE',
    createdAt: '2025-12-20T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
  },

  // 10 — David Kim  (Seoul, AI × Crypto)
  {
    id: 'advisor-010',
    memberId: 'member-010',
    member: makeMember(
      'member-010',
      'David Kim',
      'david.kim@example.com',
      'ML researcher exploring the intersection of AI agents, on-chain data, and decentralised compute.',
      [
        { uid: 'sk-28', title: 'AI / ML' },
        { uid: 'sk-29', title: 'Decentralised Compute' },
        { uid: 'sk-30', title: 'Agent Networks' },
      ],
      { city: 'Seoul', country: 'South Korea', region: 'Seoul', continent: 'Asia', metroArea: 'Seoul' }
    ),
    bio: 'Interested in AI × crypto primitives: verifiable inference, agent-owned wallets, on-chain ML models. Advising teams at the cutting edge of this space.',
    calendarProvider: 'calendly',
    calendarConnected: true,
    availabilitySlots: [
      makeSlot('advisor-010', 1, '18:00', '20:00', 'Asia/Seoul'), // Monday evening
      makeSlot('advisor-010', 4, '18:00', '20:00', 'Asia/Seoul'), // Thursday evening
    ],
    status: 'ACTIVE',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// MOCK_BOOKINGS
// ---------------------------------------------------------------------------

export const MOCK_BOOKINGS: IBooking[] = [
  {
    id: 'booking-001',
    advisorId: 'advisor-001',
    founderId: 'founder-user-001',
    slotId: MOCK_ADVISORS[0].availabilitySlots[0]?.id ?? 'slot-1',
    // Next Monday from reference date 2026-04-01 → 2026-04-06
    date: '2026-04-06',
    startTime: '09:00',
    endTime: '09:30',
    preReadFileUrl: '',
    status: 'CONFIRMED',
    createdAt: '2026-03-30T10:00:00.000Z',
  },
  {
    id: 'booking-002',
    advisorId: 'advisor-002',
    founderId: 'founder-user-001',
    slotId: MOCK_ADVISORS[1].availabilitySlots[0]?.id ?? 'slot-3',
    // Next Tuesday 2026-04-07
    date: '2026-04-07',
    startTime: '10:00',
    endTime: '10:30',
    preReadFileUrl: 'https://example.com/pre-read.pdf',
    status: 'PENDING',
    createdAt: '2026-03-31T08:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// MOCK_TIME_REQUESTS
// ---------------------------------------------------------------------------

export const MOCK_TIME_REQUESTS: ITimeRequest[] = [
  {
    id: 'timereq-001',
    advisorId: 'advisor-003',
    founderId: 'founder-user-001',
    message:
      'Hi Priya! I am building a lending protocol and would love your guidance on reentrancy guards and flash-loan attack vectors. Would a 30-min call work for you?',
    status: 'PENDING',
    createdAt: '2026-03-31T14:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Returns all mock advisors */
export function getMockAdvisors(): IAdvisor[] {
  return MOCK_ADVISORS;
}

/** Returns a single advisor by id, or undefined */
export function getMockAdvisorById(id: string): IAdvisor | undefined {
  return MOCK_ADVISORS.find((a) => a.id === id);
}

/** Returns true if the given memberId belongs to any advisor */
export function isAdvisorMember(memberId: string): boolean {
  return MOCK_ADVISORS.some((a) => a.memberId === memberId);
}

/**
 * Generates IBookableSlot entries for an advisor for the next 14 days.
 *
 * For each availability slot the advisor has, we find every calendar day in
 * [today, today+13] whose day-of-week matches, then dice that slot's time
 * window into 30-minute increments. A generated slot is marked unavailable if
 * there is an existing CONFIRMED or PENDING booking for the same advisor, date,
 * and start-time.
 */
export function getMockBookableSlots(advisorId: string): IBookableSlot[] {
  const advisor = getMockAdvisorById(advisorId);
  if (!advisor || !advisor.calendarConnected || advisor.availabilitySlots.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result: IBookableSlot[] = [];

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const dow = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const dateStr = date.toISOString().slice(0, 10); // "YYYY-MM-DD"

    for (const slot of advisor.availabilitySlots) {
      if (slot.dayOfWeek !== dow) continue;

      // Parse start and end times as minutes-since-midnight
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      let cursor = sh * 60 + sm;
      const end = eh * 60 + em;

      while (cursor + 30 <= end) {
        const startHH = String(Math.floor(cursor / 60)).padStart(2, '0');
        const startMM = String(cursor % 60).padStart(2, '0');
        const endCursor = cursor + 30;
        const endHH = String(Math.floor(endCursor / 60)).padStart(2, '0');
        const endMM = String(endCursor % 60).padStart(2, '0');

        const startTime = `${startHH}:${startMM}`;
        const endTime = `${endHH}:${endMM}`;

        // Check against existing bookings
        const isBooked = MOCK_BOOKINGS.some(
          (b) =>
            b.advisorId === advisorId &&
            b.date === dateStr &&
            b.startTime === startTime &&
            (b.status === 'CONFIRMED' || b.status === 'PENDING')
        );

        result.push({
          date: dateStr,
          startTime,
          endTime,
          slotId: slot.id,
          available: !isBooked,
        });

        cursor += 30;
      }
    }
  }

  return result;
}

/** Returns all mock bookings */
export function getMockBookings(): IBooking[] {
  return MOCK_BOOKINGS;
}

/** Returns all mock time requests */
export function getMockTimeRequests(): ITimeRequest[] {
  return MOCK_TIME_REQUESTS;
}
