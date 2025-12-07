export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  createdAt: string;
  replies: Comment[];
  reactions: Record<string,number>;
  likedByCurrentUser?: boolean;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  imageUrl?: string; 
  createdAt: string;
  comments: Comment[];
  likes: number;
  likedByCurrentUser?: boolean;
}