import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  setAuth: (token: string, userId: string, username: string, displayName?: string, avatar?: string, bio?: string) => void;
  setProfile: (profile: { username?: string; displayName?: string; avatar?: string; bio?: string }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      username: null,
      displayName: null,
      avatar: null,
      bio: null,
      setAuth: (token, userId, username, displayName, avatar, bio) =>
        set({
          token,
          userId,
          username,
          displayName: displayName || username,
          avatar: avatar || null,
          bio: bio || '',
        }),
      setProfile: (profile) =>
        set((state) => ({
          username: profile.username ?? state.username,
          displayName: profile.displayName ?? state.displayName,
          avatar: profile.avatar ?? state.avatar,
          bio: profile.bio ?? state.bio,
        })),
      clearAuth: () => set({
        token: null,
        userId: null,
        username: null,
        displayName: null,
        avatar: null,
        bio: null,
      }),
    }),
    {
      name: 'yapit-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

interface ChatState {
  messages: any[];
  users: any[];
  selectedUser: any | null;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  addMessage: (message: any) => void;
  setMessages: (messages: any[]) => void;
  setUsers: (users: any[] | ((prev: any[]) => any[])) => void;
  updateUser: (userId: string, patch: Record<string, any>) => void;
  selectUser: (user: any) => void;
  setOnlineUsers: (users: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setTypingUsers: (users: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  users: [],
  selectedUser: null,
  onlineUsers: new Set(),
  typingUsers: new Set(),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setUsers: (usersOrFn) =>
    set((state) => ({
      users: typeof usersOrFn === 'function' ? usersOrFn(state.users) : usersOrFn,
    })),
  updateUser: (userId, patch) =>
    set((state) => ({
      users: state.users.map((u) =>
        String(u.id || u._id) === String(userId) ? { ...u, ...patch } : u
      ),
      selectedUser:
        state.selectedUser && String(state.selectedUser.id || state.selectedUser._id) === String(userId)
          ? { ...state.selectedUser, ...patch }
          : state.selectedUser,
    })),
  selectUser: (user) => set({ selectedUser: user }),
  setOnlineUsers: (usersOrFn) => set((state) => ({
    onlineUsers: typeof usersOrFn === 'function' ? usersOrFn(state.onlineUsers) : usersOrFn
  })),
  setTypingUsers: (usersOrFn) => set((state) => ({
    typingUsers: typeof usersOrFn === 'function' ? usersOrFn(state.typingUsers) : usersOrFn
  })),
  clearMessages: () => set({ messages: [] }),
}));

export type SettingsPayload = {
  profile: {
    username: string;
    displayName: string;
    avatar: string;
    bio: string;
    email: string;
  };
  privacy: {
    showOnlineStatus: boolean;
    showReadReceipts: boolean;
    showLastSeen: boolean;
    whoCanMessage: 'everyone' | 'friends' | 'nobody';
  };
  notifications: {
    messages: boolean;
    sound: boolean;
    pushPlaceholder: boolean;
    mutedChats: string[];
  };
  appearance: {
    theme: 'dark' | 'neon' | 'system';
    accentColor: string;
    fontSize: number;
    compactLayout: boolean;
    reduceMotion: boolean;
  };
  storage: {
    mediaAutoDownload: boolean;
    cacheVersion: number;
  };
  blockedUsers: any[];
  activeSessions: any[];
};

interface SettingsState {
  settings: SettingsPayload | null;
  loading: boolean;
  saving: boolean;
  toasts: { id: string; type: 'success' | 'error'; message: string }[];
  setSettings: (value: SettingsPayload) => void;
  mergeSection: (section: keyof SettingsPayload, value: any) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  pushToast: (type: 'success' | 'error', message: string) => void;
  removeToast: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,
  saving: false,
  toasts: [],
  setSettings: (value) => set({ settings: value }),
  mergeSection: (section, value) =>
    set((state) => {
      if (!state.settings) return state;
      return {
        settings: {
          ...state.settings,
          [section]: typeof value === 'function' ? value((state.settings as any)[section]) : {
            ...(state.settings as any)[section],
            ...value,
          },
        },
      };
    }),
  setLoading: (loading) => set({ loading }),
  setSaving: (saving) => set({ saving }),
  pushToast: (type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, 2800);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
