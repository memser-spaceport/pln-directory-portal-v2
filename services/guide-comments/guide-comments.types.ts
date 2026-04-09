export interface IGuideComment {
  uid: string;
  parentUid?: string;
  content: string;
  authorMember: {
    uid: string;
    name: string;
    imageUrl?: string;
    mainTeamTitle?: string;
  };
  createdAt: string;
  totalLikes: number;
  isLiked: boolean;
  totalReplies: number;
}

export type NestedGuideComment = IGuideComment & { replies: NestedGuideComment[] };
