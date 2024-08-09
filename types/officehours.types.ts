


interface SourceMember {
    name: string;
    image: {
        url: string;
    }
}

interface TargetMember {
    name: string;
    image: {
        url: string;
    }
}

interface Interaction {
    uid: string;
    type: string;
    sourceMember: SourceMember;
    targetMember: TargetMember;
}

export interface IFollowUp {
    uid: string;
    status: "PENDING" | "COMPLETED" | "CLOSED";
    type: "MEETING_INITIATED" | "MEETING_SCHEDULED";
    data: Record<string, any>;
    isDelayed: boolean;
    interactionUid: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    interaction: Interaction;
}

