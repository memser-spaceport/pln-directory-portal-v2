export interface IGuideCommentAuthor {
  uid: string;
  name: string;
  officeHours: string | null;
  profileImage: string | null;
}

export interface IGuideComment {
  uid: string;
  articleUid: string;
  parentUid: string | null;
  content: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  likedByMe: boolean;
  author: IGuideCommentAuthor;
  replies: IGuideComment[];
}

export interface IGuideCommentsResponse {
  data: IGuideComment[];
  total: number;
}
