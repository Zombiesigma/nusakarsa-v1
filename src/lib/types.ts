
import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  uid: string;
  username: string;
  bio: string;
  role: 'penulis' | 'pembaca' | 'admin';
  followers: number;
  following: number;
  photoURL: string;
  displayName: string;
  email: string;
  phoneNumber?: string; 
  domicile?: string;    
  status?: 'online' | 'offline';
  lastSeen?: Timestamp;
  createdAt?: Timestamp;
  deviceInfo?: string;
  notificationPreferences?: {
    onNewFollower?: boolean;
    onBookComment?: boolean;
    onBookFavorite?: boolean;
  };
};

export type MusicTrack = {
  id?: string;
  name: string;
  artist: string;
  image: string;
  url?: string;
  source: 'youtube' | 'internal';
};

export type Book = {
  id: string;
  title: string;
  genre: string;
  type: 'book' | 'poem';
  synopsis: string;
  coverUrl: string;
  fileUrl?: string; 
  viewCount: number;
  favoriteCount: number;
  chapterCount: number;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  isCompleted?: boolean;
  visibility: 'public' | 'followers_only';
  playlist?: MusicTrack[];
  collaboratorUids?: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  averageRating: number;
  ratingCount: number;
};

export type Chapter = {
    id: string;
    title: string;
    content: string; 
    order: number;
    createdAt: Timestamp;
};

export type Music = {
  id: string;
  title: string;
  artist: string;
  url: string;
  createdAt: Timestamp;
};

export type Comment = {
  id: string;
  text: string;
  rating?: number;
  gifUrl?: string;
  userId: string;
  userName: string;
  username: string;
  userAvatarUrl: string;
  likeCount: number;
  replyCount: number;
  createdAt: Timestamp;
};

export type BookCommentLike = {
  id: string;
  userId: string;
  likedAt: Timestamp;
};

export type AuthorRequest = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string; 
  domicile: string;    
  portfolio?: string;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
};

export type Notification = {
  id: string;
  type: 'comment' | 'follow' | 'favorite' | 'author_request' | 'broadcast' | 'collaboration_invite';
  text: string;
  link: string;
  actor: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
  read: boolean;
  createdAt: Timestamp;
};

export type Favorite = {
    id: string; 
    userId: string;
    addedAt: Timestamp;
};

export type Follow = {
    id: string; 
    userId: string;
    followedAt: Timestamp;
};

export type ReadingProgress = {
  id: string;
  userId: string;
  bookId: string;
  progressPercentage: number;
  lastReadAt: Timestamp;
};

export type CollaborationInvitation = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl?: string;
  ownerId: string;
  ownerName: string;
  collaboratorId: string; // The UID of the user being invited
  collaboratorEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
};
