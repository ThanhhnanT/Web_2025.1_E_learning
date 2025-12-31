'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Avatar, Tooltip, Empty, Spin } from 'antd';
import { PlusOutlined, CommentOutlined, HeartOutlined, UserOutlined, HeartFilled, LikeOutlined, SmileOutlined, FrownOutlined, FireOutlined, ThunderboltOutlined } from '@ant-design/icons';
import CreatePostModal from '@/components/CreatePostModal';
import PostDetailModal from '@/components/PostDetailModal';
import ReactPicker from '@/components/ReactPicker';
import { Post, User, Comment } from '@/types/blog';
import { getUserId } from '@/lib/helper'; 
import { getUserProfile } from '@/helper/api';
import {
  getPosts,
  createPost,
  likePost,
  reactPost,
  getPostReactions,
  getPost,
  getComments,
  addComment,
  replyComment,
  reactComment,
  type Post as ApiPost,
} from '@/service/posts';
import { connectSocket, disconnectSocket, onSocketEvent, offSocketEvent, joinPostRoom, leavePostRoom } from '@/lib/socket';
import { useMessageApi } from '@/components/providers/Message';

const BlogPage: React.FC = () => {
  const message = useMessageApi();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState<Comment[]>([]);
  const [postPreviewComments, setPostPreviewComments] = useState<Record<string, Comment[]>>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Convert API Post to UI Post format
  const convertApiPostToPost = (apiPost: ApiPost): Post => {
    if (!apiPost) {
      throw new Error('Invalid post data');
    }

    const user = apiPost.user || {};
    const userId = user.id || (user as any)._id?.toString() || '';
    const userName = user.name || 'Unknown User';
    const userAvatar = user.avatar_url || user.avatar || '';

    return {
      id: apiPost.id || (apiPost as any)._id?.toString() || '',
      user: {
        id: userId,
        name: userName,
        avatar: userAvatar,
      },
      content: apiPost.content || '',
      imageUrl: apiPost.imageUrl,
      createdAt: apiPost.createdAt || new Date().toISOString(),
      likes: apiPost.likes || 0,
      likedByCurrentUser: apiPost.likedByCurrentUser || false,
      comments: [], // Comments are loaded separately
      commentsCount: apiPost.commentsCount || 0, // Add commentsCount from API
      reactions: apiPost.reactions || {}, // Add reactions from API
    };
  };

  // Convert API Comment to UI Comment format
  const convertApiCommentToComment = (apiComment: any): Comment => {
    if (!apiComment) {
      throw new Error('Invalid comment data');
    }

    const user = apiComment.user || {};
    const userId = user.id || user._id?.toString() || '';
    const userName = user.name || 'Unknown User';
    const userAvatar = user.avatar_url || user.avatar || '';
    const commentId = apiComment.id || apiComment._id?.toString() || '';

    // Ensure content is a string and not an ID
    let content = '';
    if (apiComment.content !== undefined && apiComment.content !== null) {
      content = String(apiComment.content);
    }
    
    // Validate that content is not an ID (check against comment ID, user ID, or parent ID)
    const parentId = apiComment.parentId ? String(apiComment.parentId) : '';
    if (content === commentId || content === userId || content === parentId || 
        content === user._id?.toString() || content === user.id) {
      console.warn('Comment content appears to be an ID, setting to empty:', {
        content,
        commentId,
        userId,
        parentId,
        apiComment
      });
      content = '';
    }

    return {
      id: commentId,
      user: {
        id: userId,
        name: userName,
        avatar: userAvatar,
      },
      content: content,
      createdAt: apiComment.createdAt || new Date().toISOString(),
      replies: apiComment.replies ? apiComment.replies.map(convertApiCommentToComment) : [],
      reactions: apiComment.reactions || {},
      likedByCurrentUser: apiComment.likedByCurrentUser || false,
    };
  };

  // Load posts from API
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPosts({ page: pagination.page, limit: pagination.limit });
      const convertedPosts = await Promise.all(
        response.data.map(async (apiPost) => {
          const post = convertApiPostToPost(apiPost);
          // Load reactions for each post
          try {
            const reactions = await getPostReactions(post.id);
            return { ...post, reactions };
          } catch (error) {
            console.error(`Error loading reactions for post ${post.id}:`, error);
            return { ...post, reactions: {} };
          }
        })
      );
      setPosts(convertedPosts);
      setPagination(response.pagination);
      
      // Load preview comments (1-2 comments) for each post
      const previewCommentsMap: Record<string, Comment[]> = {};
      await Promise.all(
        convertedPosts.map(async (post) => {
          try {
            const comments = await getComments(post.id);
            const convertedComments = comments.map(convertApiCommentToComment);
            // Only take first 2 comments for preview
            previewCommentsMap[post.id] = convertedComments.slice(0, 2);
          } catch (error) {
            console.error(`Error loading preview comments for post ${post.id}:`, error);
            previewCommentsMap[post.id] = [];
          }
        })
      );
      setPostPreviewComments(previewCommentsMap);
    } catch (error) {
      console.error('Error loading posts:', error);
      message.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Load comments for a post
  const loadPostComments = useCallback(async (postId: string) => {
    try {
      const comments = await getComments(postId);
      const convertedComments = comments.map(convertApiCommentToComment);
      setSelectedPostComments(convertedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      message.error('Không thể tải bình luận');
    }
  }, []);

  // Initialize
  useEffect(() => {
    async function init() {
      const userId = getUserId();

      try {
        if (userId) {
          try {
            const profile = await getUserProfile();
            setCurrentUser({
              id: profile.id || profile._id?.toString() || userId,
              name: profile.name,
              avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
            });
          } catch (err: any) {
            // Only log if it's not a network error
            if (err?.response) {
              console.warn("Không lấy được profile, dùng fallback", err.response?.data || err.message);
            }
            setCurrentUser({ id: userId, name: 'User', avatar: '' });
          }
        } else {
          setCurrentUser({
            id: "guest",
            name: "Khách (Ẩn danh)",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
          });
        }

        await loadPosts();

        // Connect to socket
        connectSocket();
      } catch (error) {
        console.error("Error loading init data", error);
      }
    }

    init();

    return () => {
      disconnectSocket();
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    const handlePostCreated = (newPost: ApiPost) => {
      try {
        const convertedPost = convertApiPostToPost(newPost);
        setPosts((prev) => [convertedPost, ...prev]);
      } catch (error) {
        console.error('Error converting post from socket:', error, newPost);
      }
    };

    const handlePostUpdated = (updatedPost: ApiPost) => {
      try {
        const convertedPost = convertApiPostToPost(updatedPost);
        setPosts((prev) =>
          prev.map((p) => (p.id === convertedPost.id ? convertedPost : p))
        );
        if (selectedPost?.id === convertedPost.id) {
          setSelectedPost(convertedPost);
        }
      } catch (error) {
        console.error('Error converting updated post from socket:', error, updatedPost);
      }
    };

    const handlePostDeleted = (data: { postId: string }) => {
      setPosts((prev) => prev.filter((p) => p.id !== data.postId));
      if (selectedPost?.id === data.postId) {
        setIsDetailModalOpen(false);
        setSelectedPost(null);
      }
    };

    const handlePostLiked = (data: { postId: string; liked: boolean; likes: number; userId?: string }) => {
      // Only update likes count, not likedByCurrentUser
      // Because likedByCurrentUser is specific to each user
      // Only update if it's the current user's action
      const isCurrentUser = currentUser && data.userId && currentUser.id === data.userId;
      
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === data.postId) {
            return {
              ...p,
              likes: data.likes,
              // Only update likedByCurrentUser if it's the current user's action
              ...(isCurrentUser && { likedByCurrentUser: data.liked }),
            };
          }
          return p;
        })
      );
      if (selectedPost?.id === data.postId) {
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                likes: data.likes,
                // Only update likedByCurrentUser if it's the current user's action
                ...(isCurrentUser && { likedByCurrentUser: data.liked }),
              }
            : null
        );
      }
    };

    const handleCommentCreated = (data: { postId: string; comment: any }) => {
      try {
        const newComment = convertApiCommentToComment(data.comment);
        const parentId = data.comment.parentId;
        
        // If this is a reply (has parentId), add it to the parent comment's replies array
        if (parentId) {
          if (selectedPost?.id === data.postId) {
            setSelectedPostComments((prev) =>
              prev.map((c) => {
                // Check if this comment is the parent or if any of its replies contain the parent
                if (c.id === parentId) {
                  return { ...c, replies: [...(c.replies || []), newComment] };
                }
                // Recursively check replies
                const findAndUpdateParent = (comment: Comment): Comment => {
                  if (comment.id === parentId) {
                    return { ...comment, replies: [...(comment.replies || []), newComment] };
                  }
                  if (comment.replies && comment.replies.length > 0) {
                    return {
                      ...comment,
                      replies: comment.replies.map(findAndUpdateParent),
                    };
                  }
                  return comment;
                };
                return findAndUpdateParent(c);
              })
            );
          }
          
          // Update posts list - add reply to parent comment
          setPosts((prev) =>
            prev.map((p) => {
              if (p.id === data.postId) {
                const updateCommentWithReply = (comment: Comment): Comment => {
                  if (comment.id === parentId) {
                    return { ...comment, replies: [...(comment.replies || []), newComment] };
                  }
                  if (comment.replies && comment.replies.length > 0) {
                    return {
                      ...comment,
                      replies: comment.replies.map(updateCommentWithReply),
                    };
                  }
                  return comment;
                };
                return {
                  ...p,
                  comments: (p.comments || []).map(updateCommentWithReply),
                };
              }
              return p;
            })
          );
        } else {
          // This is a top-level comment
          if (selectedPost?.id === data.postId) {
            setSelectedPostComments((prev) => [...prev, newComment]);
            // Update selectedPost commentsCount
            setSelectedPost((prev) =>
              prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null
            );
          }
          
          // Update posts list - increment commentsCount
          setPosts((prev) =>
            prev.map((p) =>
              p.id === data.postId
                ? {
                    ...p,
                    commentsCount: (p.commentsCount || 0) + 1,
                    comments: [...(p.comments || []), newComment],
                  }
                : p
            )
          );
          
          // Update preview comments - add to preview if less than 2
          setPostPreviewComments((prev) => {
            const currentPreview = prev[data.postId] || [];
            if (currentPreview.length < 2) {
              return {
                ...prev,
                [data.postId]: [...currentPreview, newComment],
              };
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error converting comment from socket:', error, data);
      }
    };

    const handleCommentUpdated = (data: { postId: string; comment: any }) => {
      if (selectedPost?.id === data.postId) {
        const updatedComment = convertApiCommentToComment(data.comment);
        setSelectedPostComments((prev) =>
          prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
        );
      }
    };

    const handleCommentDeleted = (data: { postId: string; commentId: string }) => {
      if (selectedPost?.id === data.postId) {
        setSelectedPostComments((prev) => prev.filter((c) => c.id !== data.commentId));
        // Update selectedPost commentsCount
        setSelectedPost((prev) =>
          prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount || 0) - 1) } : null
        );
      }
      // Update posts list - decrement commentsCount
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? {
                ...p,
                commentsCount: Math.max(0, (p.commentsCount || 0) - 1),
                comments: p.comments?.filter((c) => c.id !== data.commentId) || [],
              }
            : p
        )
      );
    };

    const handleCommentReaction = (data: { postId: string; commentId: string; reacted: boolean; emoji: string; userId?: string }) => {
      const isCurrentUser = currentUser && data.userId && currentUser.id === data.userId;
      
      if (selectedPost?.id === data.postId) {
        setSelectedPostComments((prev) =>
          prev.map((c) => {
            if (c.id === data.commentId) {
              const currentReactions = c.reactions || {};
              
              // If current user reacted, remove all their previous reactions first
              if (isCurrentUser && data.reacted) {
                Object.keys(currentReactions).forEach((emoji) => {
                  if (currentReactions[emoji].likedByCurrentUser) {
                    currentReactions[emoji] = {
                      ...currentReactions[emoji],
                      count: Math.max(0, currentReactions[emoji].count - 1),
                      likedByCurrentUser: false,
                    };
                  }
                });
              }
              
              const currentCount = currentReactions[data.emoji]?.count || 0;
              return {
                ...c,
                reactions: {
                  ...currentReactions,
                  [data.emoji]: {
                    count: data.reacted ? currentCount + 1 : Math.max(0, currentCount - 1),
                    users: [],
                    likedByCurrentUser: isCurrentUser ? data.reacted : (currentReactions[data.emoji]?.likedByCurrentUser || false),
                  },
                },
                likedByCurrentUser: isCurrentUser ? data.reacted : (c.likedByCurrentUser || false),
              };
            }
            return c;
          })
        );
      }
    };

    const handlePostReaction = (data: { postId: string; reacted: boolean; emoji: string; userId?: string }) => {
      const isCurrentUser = currentUser && data.userId && currentUser.id === data.userId;
      
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === data.postId) {
            const currentReactions = p.reactions || {};
            
            // If current user reacted, remove all their previous reactions first
            if (isCurrentUser && data.reacted) {
              Object.keys(currentReactions).forEach((emoji) => {
                if (currentReactions[emoji].likedByCurrentUser) {
                  currentReactions[emoji] = {
                    ...currentReactions[emoji],
                    count: Math.max(0, currentReactions[emoji].count - 1),
                    likedByCurrentUser: false,
                  };
                }
              });
            }
            
            const currentCount = currentReactions[data.emoji]?.count || 0;
            return {
              ...p,
              reactions: {
                ...currentReactions,
                [data.emoji]: {
                  count: data.reacted ? currentCount + 1 : Math.max(0, currentCount - 1),
                  users: [],
                  likedByCurrentUser: isCurrentUser ? data.reacted : (currentReactions[data.emoji]?.likedByCurrentUser || false),
                },
              },
            };
          }
          return p;
        })
      );
      
      if (selectedPost?.id === data.postId) {
        setSelectedPost((prev) => {
          if (!prev) return null;
          const currentReactions = prev.reactions || {};
          
          // If current user reacted, remove all their previous reactions first
          if (isCurrentUser && data.reacted) {
            Object.keys(currentReactions).forEach((emoji) => {
              if (currentReactions[emoji].likedByCurrentUser) {
                currentReactions[emoji] = {
                  ...currentReactions[emoji],
                  count: Math.max(0, currentReactions[emoji].count - 1),
                  likedByCurrentUser: false,
                };
              }
            });
          }
          
          const currentCount = currentReactions[data.emoji]?.count || 0;
          return {
            ...prev,
            reactions: {
              ...currentReactions,
              [data.emoji]: {
                count: data.reacted ? currentCount + 1 : Math.max(0, currentCount - 1),
                users: [],
                likedByCurrentUser: isCurrentUser ? data.reacted : (currentReactions[data.emoji]?.likedByCurrentUser || false),
              },
            },
          };
        });
      }
    };

    onSocketEvent('post:created', handlePostCreated);
    onSocketEvent('post:updated', handlePostUpdated);
    onSocketEvent('post:deleted', handlePostDeleted);
    onSocketEvent('post:liked', handlePostLiked);
    onSocketEvent('post:reaction', handlePostReaction);
    onSocketEvent('comment:created', handleCommentCreated);
    onSocketEvent('comment:updated', handleCommentUpdated);
    onSocketEvent('comment:deleted', handleCommentDeleted);
    onSocketEvent('comment:reaction', handleCommentReaction);

    return () => {
      offSocketEvent('post:created', handlePostCreated);
      offSocketEvent('post:updated', handlePostUpdated);
      offSocketEvent('post:deleted', handlePostDeleted);
      offSocketEvent('post:liked', handlePostLiked);
      offSocketEvent('post:reaction', handlePostReaction);
      offSocketEvent('comment:created', handleCommentCreated);
      offSocketEvent('comment:updated', handleCommentUpdated);
      offSocketEvent('comment:deleted', handleCommentDeleted);
      offSocketEvent('comment:reaction', handleCommentReaction);
    };
  }, [selectedPost]);

  // Join/leave post room when viewing post details
  useEffect(() => {
    if (isDetailModalOpen && selectedPost) {
      joinPostRoom(selectedPost.id);
      loadPostComments(selectedPost.id);
    } else if (!isDetailModalOpen && selectedPost) {
      leavePostRoom(selectedPost.id);
    }
  }, [isDetailModalOpen, selectedPost, loadPostComments]);

  const handleReactPost = async (postId: string, emoji: string) => {
    if (!currentUser || currentUser.id === 'guest') {
      message.warning('Vui lòng đăng nhập để react bài viết.');
      return;
    }

    try {
      await reactPost(postId, { emoji: emoji as any });
      // Socket event will update the UI
    } catch (error) {
      console.error('Error reacting to post:', error);
      message.error('Không thể react bài viết');
    }
  };

  const handleCreatePost = async (content: string, file: File | null) => {
    if (!currentUser || currentUser.id === 'guest') {
      message.warning('Vui lòng đăng nhập để tạo bài viết.');
      return;
    }

    try {
      await createPost({ content }, file || undefined);
      setIsCreateModalOpen(false);
      message.success('Tạo bài viết thành công!');
      // Socket event will update the UI
    } catch (error) {
      console.error('Error creating post:', error);
      message.error('Không thể tạo bài viết');
    }
  };

  const handleAddComment = async (postId: string, content: string, imageFile?: File) => {
    if (!currentUser || currentUser.id === 'guest') {
      message.warning('Vui lòng đăng nhập để bình luận.');
      return;
    }

    try {
      await addComment(postId, { content }, imageFile);
      // Socket event will update the UI
    } catch (error: any) {
      console.error('Error adding comment:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể thêm bình luận';
      message.error(errorMessage);
    }
  };

  const handleReplyComment = async (postId: string, parentId: string, content: string, imageFile?: File) => {
    if (!currentUser || currentUser.id === 'guest') {
      message.warning('Vui lòng đăng nhập để trả lời.');
      return;
    }

    try {
      await replyComment(postId, parentId, { content }, imageFile);
      // Socket event will update the UI
    } catch (error: any) {
      console.error('Error replying comment:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể trả lời bình luận';
      message.error(errorMessage);
    }
  };

  const handleReactComment = async (postId: string, commentId: string, emoji: string) => {
    if (!currentUser || currentUser.id === 'guest') {
      message.warning('Vui lòng đăng nhập để react.');
      return;
    }

    try {
      await reactComment(postId, commentId, { emoji: emoji as any });
      // Socket event will update the UI
    } catch (error) {
      console.error('Error reacting to comment:', error);
      message.error('Không thể react bình luận');
    }
  };

  const handlePostClick = async (post: Post) => {
    try {
      // Load full post details
      const fullPost = await getPost(post.id);
      const convertedPost = convertApiPostToPost(fullPost);
      setSelectedPost(convertedPost);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error loading post details:', error);
      message.error('Không thể tải chi tiết bài viết');
    }
  };

  if (loading && posts.length === 0) {
    return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" tip="Đang tải..." fullscreen /></div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 20px 50px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ margin: 0, textAlign: "center" }}>Blog Cộng Đồng</h1>
          <p style={{ color: 'gray', margin: 0 }}>
            {currentUser?.id !== 'guest' ? `Xin chào, ${currentUser?.name}!` : 'Bạn đang xem với tư cách Khách'}
          </p>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!currentUser || currentUser.id === 'guest'}
        >
          Tạo bài viết
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {posts.length === 0 ? (
          <Empty description="Chưa có bài viết nào. Hãy là người đầu tiên!" />
        ) : (
          posts.map((post) => (
            <Card 
              key={post.id} 
              hoverable
              style={{ borderRadius: 12, overflow: 'hidden' }}
              onClick={() => handlePostClick(post)}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <Avatar src={post.user.avatar} icon={<UserOutlined />} size="large" />
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontWeight: 600 }}>{post.user.name}</div>
                  <div style={{ fontSize: 12, color: 'gray' }}>{new Date(post.createdAt).toLocaleString('vi-VN')}</div>
                </div>
              </div>

              <div style={{ fontSize: 15, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{post.content}</div>

              {post.imageUrl && (
                <div style={{ marginBottom: 15, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                  <img src={post.imageUrl} alt="Post content" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 20, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                {/* React Picker with top 3 reactions */}
                {(() => {
                  const reactions = post.reactions || {};
                  const normalizedReactions: Record<string, { count: number; users: any[]; likedByCurrentUser: boolean }> = {};
                  Object.entries(reactions).forEach(([emoji, data]: [string, any]) => {
                    if (typeof data === 'number') {
                      normalizedReactions[emoji] = { count: data, users: [], likedByCurrentUser: false };
                    } else {
                      normalizedReactions[emoji] = {
                        count: data.count || 0,
                        users: data.users || [],
                        likedByCurrentUser: data.likedByCurrentUser || false,
                      };
                    }
                  });
                  
                  const totalReactions = Object.values(normalizedReactions).reduce((sum, r) => sum + r.count, 0);
                  const topReactions = Object.entries(normalizedReactions)
                    .map(([emoji, data]) => ({ emoji, ...data }))
                    .filter(r => r.count > 0)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3);
                  
                  const hasUserReaction = Object.values(normalizedReactions).some(r => r.likedByCurrentUser);
                  
                  const emojiIcons: Record<string, React.ReactNode> = {
                    like: <LikeOutlined style={{ fontSize: 16, color: '#1877f2' }} />,
                    love: <HeartFilled style={{ fontSize: 16, color: '#f33e58' }} />,
                    haha: <SmileOutlined style={{ fontSize: 16, color: '#f7b125' }} />,
                    wow: <ThunderboltOutlined style={{ fontSize: 16, color: '#f7b125' }} />,
                    sad: <FrownOutlined style={{ fontSize: 16, color: '#f7b125' }} />,
                    angry: <FireOutlined style={{ fontSize: 16, color: '#e46a62' }} />,
                  };
                  
                  return (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ display: 'inline-block' }}
                    >
                      <ReactPicker
                        currentReactions={normalizedReactions}
                        onReact={(emoji) => {
                          handleReactPost(post.id, emoji);
                        }}
                      >
                        <Button
                          type="text"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          style={{ color: hasUserReaction ? '#1877f2' : 'inherit' }}
                        >
                        {totalReactions > 0 ? (
                          <>
                            {topReactions.map((r, idx) => (
                              <span key={r.emoji} style={{ marginRight: idx < topReactions.length - 1 ? -4 : 0 }}>
                                {emojiIcons[r.emoji]}
                              </span>
                            ))}
                            <span>{totalReactions}</span>
                          </>
                        ) : (
                          <>
                            <HeartOutlined />
                            <span>Thích</span>
                          </>
                        )}
                      </Button>
                      </ReactPicker>
                    </div>
                  );
                })()}

                <Tooltip title="Bình luận">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Button 
                      type="text" 
                      icon={<CommentOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePostClick(post);
                      }}
                    >
                      {post.commentsCount || 0} bình luận
                    </Button>
                  </div>
                </Tooltip>
              </div>

              {/* Preview Comments - Show 1-2 comments */}
              {postPreviewComments[post.id] && postPreviewComments[post.id].length > 0 && (
                <div style={{ 
                  marginTop: 16, 
                  paddingTop: 16, 
                  borderTop: '1px solid #f0f0f0' 
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {postPreviewComments[post.id].map((comment) => (
                      <div key={comment.id} style={{ display: 'flex', gap: 8 }}>
                        <Avatar 
                          src={comment.user.avatar} 
                          icon={<UserOutlined />} 
                          size="small" 
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            background: '#f0f2f5', 
                            padding: '8px 12px', 
                            borderRadius: 12,
                            display: 'inline-block',
                            maxWidth: '100%'
                          }}>
                            <div style={{ 
                              fontWeight: 600, 
                              fontSize: 13, 
                              marginBottom: 4 
                            }}>
                              {comment.user.name}
                            </div>
                            <div style={{ fontSize: 14, wordBreak: 'break-word' }}>
                              {comment.content}
                            </div>
                            {comment.imageUrl && (
                              <img 
                                src={comment.imageUrl} 
                                alt="Comment" 
                                style={{ 
                                  marginTop: 8, 
                                  maxWidth: 200, 
                                  maxHeight: 200, 
                                  borderRadius: 8, 
                                  border: '1px solid #ddd',
                                  display: 'block'
                                }} 
                              />
                            )}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            gap: 12, 
                            marginTop: 4, 
                            marginLeft: 4,
                            fontSize: 12, 
                            color: '#65676b' 
                          }}>
                            <span 
                              style={{ cursor: 'pointer', fontWeight: 600 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReactComment(post.id, comment.id, 'like');
                              }}
                            >
                              Thích
                            </span>
                            <span 
                              style={{ cursor: 'pointer', fontWeight: 600 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePostClick(post);
                              }}
                            >
                              Phản hồi
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <CreatePostModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        currentUser={currentUser} 
        onSubmit={handleCreatePost}
      />

      <PostDetailModal
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPost(null);
          setSelectedPostComments([]);
        }}
        post={selectedPost}
        currentUser={currentUser || { id: 'guest', name: 'Guest', avatar: '' }}
        onAddComment={handleAddComment}
        onReplyComment={handleReplyComment}
        onReactComment={handleReactComment}
        comments={selectedPostComments}
      />
    </div>
  );
};

export default BlogPage;
