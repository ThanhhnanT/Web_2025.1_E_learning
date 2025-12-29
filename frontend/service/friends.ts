import { getAccess, postAccess, patchAccess, deleteAccess } from '@/helper/api';

const API_DOMAIN = process.env.API || 'http://localhost:8888/';

export interface FriendRequest {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  receiverId: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  _id: string;
  name: string;
  email: string;
  avatar_url?: string;
  friendsSince: string;
}

export interface FriendshipStatus {
  status: 'friends' | 'pending' | 'none';
  isSender?: boolean;
  friendship?: any;
  request?: FriendRequest;
}

// Send friend request
export const sendFriendRequest = async (
  receiverId: string,
  note?: string,
): Promise<FriendRequest> => {
  try {
    console.log('Calling sendFriendRequest with:', { receiverId, note });
    const result = await postAccess('friends/requests', { receiverId, note });
    console.log('sendFriendRequest result:', result);
    return result;
  } catch (error: any) {
    console.error('sendFriendRequest error:', error);
    console.error('Error details:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
    });
    throw error;
  }
};

// Get friend requests (received)
export const getFriendRequests = async (): Promise<FriendRequest[]> => {
  return await getAccess('friends/requests');
};

// Get sent friend requests
export const getSentFriendRequests = async (): Promise<FriendRequest[]> => {
  return await getAccess('friends/requests/sent');
};

// Accept friend request
export const acceptFriendRequest = async (requestId: string): Promise<FriendRequest> => {
  try {
    console.log('Calling acceptFriendRequest with requestId:', requestId);
    const result = await patchAccess(`friends/requests/${requestId}`, { status: 'accepted' });
    console.log('acceptFriendRequest result:', result);
    return result;
  } catch (error: any) {
    console.error('acceptFriendRequest error:', error);
    console.error('Error details:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
    });
    throw error;
  }
};

// Reject friend request
export const rejectFriendRequest = async (requestId: string): Promise<FriendRequest> => {
  return await patchAccess(`friends/requests/${requestId}`, { status: 'rejected' });
};

// Cancel friend request
export const cancelFriendRequest = async (requestId: string): Promise<FriendRequest> => {
  return await deleteAccess(`friends/requests/${requestId}`);
};

// Get friends list (current user)
export const getFriends = async (): Promise<Friend[]> => {
  return await getAccess('friends');
};

// Get friends list of a specific user
export const getUserFriends = async (userId: string): Promise<Friend[]> => {
  return await getAccess(`friends/user/${userId}`);
};

// Remove friend
export const removeFriend = async (friendId: string): Promise<void> => {
  return await deleteAccess(`friends/${friendId}`);
};

// Check friendship status
export const checkFriendshipStatus = async (userId: string): Promise<FriendshipStatus> => {
  return await getAccess(`friends/status/${userId}`);
};

