import { get, getAccess, postAccess, patchAccess, deleteAccess } from '@/helper/api';

export interface Post {
  id: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  commentsCount: number;
  likedByCurrentUser?: boolean;
}

export interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
  reactions: Record<string, { count: number; users: any[]; likedByCurrentUser: boolean }>;
  likedByCurrentUser?: boolean;
}

export interface QueryPostsParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'likes';
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePostData {
  content: string;
  imageUrl?: string;
}

export interface CreateCommentData {
  content: string;
  parentId?: string;
}

export interface CreateReactionData {
  emoji: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
}

// Get posts with pagination
export const getPosts = async (params?: QueryPostsParams): Promise<{ data: Post[]; pagination: any }> => {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = params.page.toString();
  if (params?.limit) queryParams.limit = params.limit.toString();
  if (params?.sortBy) queryParams.sortBy = params.sortBy;
  if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

  try {
    return await getAccess('posts', queryParams);
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Get single post
export const getPost = async (id: string): Promise<Post> => {
  try {
    return await getAccess(`posts/${id}`);
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

// Create post
export const createPost = async (data: CreatePostData, imageFile?: File): Promise<Post> => {
  const formData = new FormData();
  formData.append('content', data.content);
  if (imageFile) {
    formData.append('image', imageFile);
  }
  if (data.imageUrl) {
    formData.append('imageUrl', data.imageUrl);
  }

  try {
    return await postAccess('posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to create post');
    }
    throw error;
  }
};

// Update post
export const updatePost = async (id: string, data: Partial<CreatePostData>, imageFile?: File): Promise<Post> => {
  const formData = new FormData();
  if (data.content) formData.append('content', data.content);
  if (imageFile) {
    formData.append('image', imageFile);
  }
  if (data.imageUrl) {
    formData.append('imageUrl', data.imageUrl);
  }

  return await patchAccess(`posts/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Update post status (admin/editor only)
export const updatePostStatus = async (id: string, status: string): Promise<Post> => {
  return await patchAccess(`posts/${id}/status`, { status });
};

// Delete post
export const deletePost = async (id: string): Promise<void> => {
  return await deleteAccess(`posts/${id}`);
};

// Like/Unlike post
export const likePost = async (id: string): Promise<{ liked: boolean; likes: number }> => {
  return await postAccess(`posts/${id}/like`, {});
};

// React to post
export const reactPost = async (
  postId: string,
  data: CreateReactionData,
): Promise<{ reacted: boolean; emoji: string }> => {
  return await postAccess(`posts/${postId}/reactions`, data);
};

// Get post reactions
export const getPostReactions = async (postId: string): Promise<any> => {
  try {
    return await getAccess(`posts/${postId}/reactions`);
  } catch (error) {
    console.error('Error fetching post reactions:', error);
    throw error;
  }
};

// Get post likes
export const getPostLikes = async (id: string): Promise<any[]> => {
  return await get(`posts/${id}/likes`);
};

// Get comments
export const getComments = async (postId: string): Promise<Comment[]> => {
  try {
    return await getAccess(`posts/${postId}/comments`);
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Add comment
export const addComment = async (postId: string, data: CreateCommentData, imageFile?: File): Promise<Comment> => {
  if (imageFile) {
    const formData = new FormData();
    formData.append('content', data.content);
    formData.append('image', imageFile);
    return await postAccess(`posts/${postId}/comments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  return await postAccess(`posts/${postId}/comments`, data);
};

// Reply comment
export const replyComment = async (
  postId: string,
  commentId: string,
  data: CreateCommentData,
  imageFile?: File,
): Promise<Comment> => {
  if (imageFile) {
    const formData = new FormData();
    formData.append('content', data.content);
    formData.append('image', imageFile);
    return await postAccess(`posts/${postId}/comments/${commentId}/replies`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  return await postAccess(`posts/${postId}/comments/${commentId}/replies`, data);
};

// Update comment
export const updateComment = async (
  postId: string,
  commentId: string,
  data: { content: string },
): Promise<Comment> => {
  return await patchAccess(`posts/${postId}/comments/${commentId}`, data);
};

// Delete comment
export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  return await deleteAccess(`posts/${postId}/comments/${commentId}`);
};

// React to comment
export const reactComment = async (
  postId: string,
  commentId: string,
  data: CreateReactionData,
): Promise<{ reacted: boolean; emoji: string }> => {
  return await postAccess(`posts/${postId}/comments/${commentId}/reactions`, data);
};

// Get comment reactions
export const getCommentReactions = async (postId: string, commentId: string): Promise<any> => {
  try {
    return await getAccess(`posts/${postId}/comments/${commentId}/reactions`);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    throw error;
  }
};

