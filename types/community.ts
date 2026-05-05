export type PostStatus = 'published' | 'draft' | 'deleted';
export type SortBy = 'latest' | 'popular' | 'commented';
export type ContentType = 'markdown' | 'text';

export interface PostAuthor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface PostImageData {
  id: string;
  url: string;
  order: number;
  fileName: string | null;
  mimeType: string | null;
  size: number | null;
}

export interface PostTagData {
  id: string;
  tag: string;
}

export interface Post {
  id: string;
  authorId: string;
  title: string | null;
  content: string;
  contentType: ContentType;
  status: PostStatus;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  images: PostImageData[];
  tags: PostTagData[];
  isLiked: boolean;
}

export interface CommentData {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  replies: CommentData[];
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PostFilterParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  tag?: string;
  authorId?: string;
  sort?: SortBy;
  keyword?: string;
}

export interface CreatePostPayload {
  title?: string;
  content: string;
  contentType?: ContentType;
  status?: PostStatus;
  images?: Array<{
    url: string;
    order: number;
    fileName?: string;
    mimeType?: string;
    size?: number;
  }>;
  tags?: string[];
  mentions?: string[];
}

export interface CreateCommentPayload {
  content: string;
  parentId?: string;
}

export interface UserSearchResult {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  email: string;
}

export interface UploadedImage {
  url: string;
  order: number;
  fileName?: string;
  mimeType?: string;
  size?: number;
  previewUrl?: string;
}
