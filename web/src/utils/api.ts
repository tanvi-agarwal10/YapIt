import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data: { username: string; email: string; password: string; confirmPassword: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  getProfile: () => apiClient.get('/auth/profile'),
  getAllUsers: () => apiClient.get('/auth/users'),
  getSettings: () => apiClient.get('/auth/settings'),
  checkUsernameAvailability: (username: string) =>
    apiClient.get(`/auth/username-available/${encodeURIComponent(username)}`),
  updateProfile: (data: {
    username?: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
  }) => apiClient.put('/auth/profile', data),
  updatePrivacy: (data: any) => apiClient.put('/auth/privacy', data),
  updateNotifications: (data: any) => apiClient.put('/auth/notifications', data),
  updateAppearance: (data: any) => apiClient.put('/auth/appearance', data),
  updateStorage: (data: any) => apiClient.put('/auth/storage', data),
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    apiClient.put('/auth/security/password', data),
  updateEmail: (data: { newEmail: string; password: string }) =>
    apiClient.put('/auth/security/email', data),
  logoutAllDevices: () => apiClient.post('/auth/security/logout-all'),
  deleteAccount: (password: string) => apiClient.delete('/auth/security/delete', { data: { password } }),
  unblockUser: (userId: string) => apiClient.delete(`/auth/block/${userId}`),
};

export const messageAPI = {
  getMessages: (otherUserId: string) =>
    apiClient.get(`/messages/${otherUserId}`),
  sendMessage: (data: { receiverId: string; content: string }) =>
    apiClient.post('/messages/send', data),
  uploadAttachment: (data: FormData) =>
    apiClient.post('/messages/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  markAsRead: (messageId: string) =>
    apiClient.put(`/messages/${messageId}/read`),
};

export default apiClient;
