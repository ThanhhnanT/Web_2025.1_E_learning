'use client';
import React, { useState, useEffect } from 'react';
import { Button, Card, Avatar, Tooltip, Empty, Spin } from 'antd';
import { PlusOutlined, CommentOutlined, HeartOutlined, UserOutlined, HeartFilled } from '@ant-design/icons';
import CreatePostModal from '@/components/CreatePostModal';
import PostDetailModal from '@/components/PostDetailModal';
import { Post, User, Comment } from '@/types/blog';
import { getUserId } from '@/lib/helper'; 
import { loadPostsFromStorage, savePostsToStorage, fileToBase64 } from '@/lib/storage'; // Kiểm tra lại đường dẫn import storage của bạn
import { getUserProfile } from '@/helper/api';

const updateCommentTree = (comments: Comment[], targetId: string, updateFn: (c: Comment) => Comment): Comment[] => {
  return comments.map(c => {
    if (c.id === targetId) {
      return updateFn(c);
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: updateCommentTree(c.replies, targetId, updateFn) };
    }
    return c;
  });
};

const sanitizeComment = (c: any): Comment => ({
  ...c,
  replies: c.replies ? c.replies.map((r: any) => sanitizeComment(r)) : [],
  reactions: c.reactions || {},
  likedByCurrentUser: c.likedByCurrentUser || false
});

const BlogPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const updateAndSave = (newPosts: Post[], currentPostId?: string) => {
    setPosts(newPosts);
    savePostsToStorage(newPosts);
    
    if (selectedPost && currentPostId && selectedPost.id === currentPostId) {
       const updatedCurrentPost = newPosts.find(p => p.id === currentPostId) || null;
       setSelectedPost(updatedCurrentPost);
    }
  };

  useEffect(() => {
    async function init() {
      const userId = getUserId();

      try {
        if (userId) {
          try {
             const profile = await getUserProfile();
             setCurrentUser({
              id: profile.id,
              name: profile.name,
              avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
            });
          } catch (err) {
            console.warn("Không lấy được profile, dùng fallback", err);
            setCurrentUser({ id: userId, name: 'User', avatar: '' });
          }
        } else {
          setCurrentUser({
            id: "guest",
            name: "Khách (Ẩn danh)",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
          });
        }
        const savedPosts = loadPostsFromStorage();
        const sanitizedPosts = savedPosts.map(p => ({
          ...p,
          comments: p.comments ? p.comments.map(c => sanitizeComment(c)) : []
        }));
        
        setPosts(
          sanitizedPosts.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (error) {
        console.error("Error loading init data", error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleLikePost = (postId: string) => {
    if (!currentUser || currentUser.id === 'guest') {
      alert('Vui lòng đăng nhập để thích bài viết.');
      return;
    }
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const isLiked = post.likedByCurrentUser;
        return {
          ...post,
          likedByCurrentUser: !isLiked,
          likes: isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    });

    updateAndSave(updatedPosts, postId);
  };

  const handleCreatePost = async (content: string, file: File | null) => {
    const postUser = currentUser || { id: 'guest', name: 'Khách', avatar: '' };

    let imageUrl = '';
    if (file) {
      try {
        imageUrl = await fileToBase64(file);
      } catch (e) {
        console.error("Lỗi xử lý ảnh", e);
      }
    }

    const newPost: Post = {
      id: Date.now().toString(),
      user: postUser,
      content: content,
      imageUrl: imageUrl || undefined,
      createdAt: new Date().toLocaleString('vi-VN'),
      likes: 0,
      likedByCurrentUser: false,
      comments: [],
    };

    const updatedPosts = [newPost, ...posts];
    updateAndSave(updatedPosts);
    setIsCreateModalOpen(false);
  };
  const handleAddComment = (postId: string, content: string) => {
    const commentUser = currentUser || { id: 'guest', name: 'Khách', avatar: '' };

    const newComment: Comment = {
      id: Date.now().toString(),
      user: commentUser,
      content,
      createdAt: new Date().toLocaleString('vi-VN'),
      replies: [],
      reactions: {},
      likedByCurrentUser: false
    };

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });

    updateAndSave(updatedPosts, postId);
  };

  const handleReplyComment = (postId: string, parentId: string, content: string) => {
    const commentUser = currentUser || { id: 'guest', name: 'Khách', avatar: '' };
    const newReply: Comment = {
      id: Date.now().toString(),
      user: commentUser,
      content,
      createdAt: new Date().toLocaleString('vi-VN'),
      replies: [],
      reactions: {},
      likedByCurrentUser: false
    };

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newComments = updateCommentTree(post.comments, parentId, (parent) => ({
          ...parent,
          replies: [...(parent.replies || []), newReply]
        }));
        return { ...post, comments: newComments };
      }
      return post;
    });
    updateAndSave(updatedPosts, postId);
  };

  const handleReactComment = (postId: string, commentId: string, emoji: string) => {
    if (!currentUser || currentUser.id === 'guest') return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newComments = updateCommentTree(post.comments, commentId, (comment) => {
          
          const isLiked = comment.likedByCurrentUser || false;
          const currentReactions = comment.reactions || {};
          const currentCount = currentReactions[emoji] || 0;

          let newCount = currentCount;
          if (isLiked) {
             newCount = Math.max(0, currentCount - 1);
          } else {
             newCount = currentCount + 1; 
          }

          return {
            ...comment,
            likedByCurrentUser: !isLiked,
            reactions: {
              ...currentReactions,
              [emoji]: newCount
            }
          };
        });
        return { ...post, comments: newComments };
      }
      return post;
    });
    
    updateAndSave(updatedPosts, postId);
  };

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" tip="Đang tải..."  fullscreen/></div>;
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
              onClick={() => { setSelectedPost(post); setIsDetailModalOpen(true); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <Avatar src={post.user.avatar} icon={<UserOutlined />} size="large" />
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontWeight: 600 }}>{post.user.name}</div>
                  <div style={{ fontSize: 12, color: 'gray' }}>{post.createdAt}</div>
                </div>
              </div>

              <div style={{ fontSize: 15, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{post.content}</div>

              {post.imageUrl && (
                <div style={{ marginBottom: 15, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                  <img src={post.imageUrl} alt="Post content" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 20, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <Tooltip title={post.likedByCurrentUser ? "Bỏ thích" : "Thích"}>
                  <Button 
                    type="text" 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleLikePost(post.id);
                    }}
                    icon={
                      post.likedByCurrentUser ? (
                        <HeartFilled style={{ color: '#ff4d4f' }} /> 
                      ) : (
                        <HeartOutlined />
                      )
                    }
                    style={{ color: post.likedByCurrentUser ? '#ff4d4f' : 'inherit' }}
                  >
                    {post.likes}
                  </Button>
                </Tooltip>

                <Tooltip title="Bình luận">
                  <Button type="text" icon={<CommentOutlined />}>
                    {post.comments.length} bình luận
                  </Button>
                </Tooltip>
              </div>
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
        onClose={() => setIsDetailModalOpen(false)}
        post={selectedPost}
        currentUser={currentUser || { id: 'guest', name: 'Guest', avatar: '' }}
        onAddComment={handleAddComment}
        onReplyComment={handleReplyComment}
        onReactComment={handleReactComment}
      />
    </div>
  );
};

export default BlogPage;