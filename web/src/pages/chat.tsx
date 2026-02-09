'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { messageAPI, authAPI } from '../utils/api';
import { useAuthStore, useChatStore } from '../utils/store';
import { useSocket } from '../utils/socket';
import SettingsCenter from '../components/settings/SettingsCenter';
import { SettingsErrorBoundary } from '../components/settings/SettingsErrorBoundary';
import {
  Send,
  LogOut,
  User,
  Search,
  Phone,
  Info,
  Menu,
  MessageCircle,
  Sparkles,
  Users,
  Settings,
  Plus,
  Paperclip,
  Smile,
  X,
  ChevronRight,
} from 'lucide-react';

const formatClock = (value?: string | Date) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatTimestamp = (value?: string | Date) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
};

const getId = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
};

export default function Chat() {
  const router = useRouter();
  const { userId, username, displayName, avatar, clearAuth } = useAuthStore();
  const { messages, users, selectedUser, typingUsers, setMessages, setUsers, selectUser, addMessage } = useChatStore();
  const { isConnected, sendMessage, emitTyping, emitStopTyping, emitProfileUpdated, emitPrivacyUpdated } = useSocket();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [activeNav, setActiveNav] = useState<'discover' | 'chats' | 'friends' | 'settings'>('chats');
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const serverNav = useMemo(
    () => [
      { icon: Sparkles, label: 'Discover', key: 'discover' },
      { icon: MessageCircle, label: 'Chats', key: 'chats' },
      { icon: Users, label: 'Friends', key: 'friends' },
      { icon: Settings, label: 'Settings', key: 'settings' },
    ],
    []
  );
  const emojiSet = useMemo(
    () => ['😀', '😂', '😍', '😎', '🥳', '🤖', '🔥', '✨', '💜', '💙', '⚡', '🎉'],
    []
  );

  // Only run on client - check auth once
  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Fetch users
  useEffect(() => {
    if (!isClient || !userId) return;

    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await authAPI.getAllUsers();
        const normalized = response.data.users.map((u: any) => ({
          ...u,
          id: u.id || u._id,
        }));
        setUsers(normalized.filter((u: any) => getId(u.id) !== getId(userId)));
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isClient, userId, setUsers]);

  // Fetch messages when selected user changes
  useEffect(() => {
    if (!isClient || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const response = await messageAPI.getMessages(selectedUser.id);
        setMessages(
          response.data.messages.map((msg: any) => ({
            ...msg,
            isOwn: getId(msg.senderId) === getId(userId),
          }))
        );
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [isClient, selectedUser, userId, setMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedUser) {
      inputRef.current?.focus();
    }
  }, [selectedUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser || isUploading) return;

    sendMessage(selectedUser.id, messageText);
    addMessage({
      content: messageText,
      senderId: userId,
      receiverId: selectedUser.id,
      isOwn: true,
      timestamp: new Date(),
    });

    setMessageText('');
    emitStopTyping(selectedUser.id);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    clearAuth();
    router.push('/');
  }, [clearAuth, router]);

  const handleTyping = () => {
    if (selectedUser && !isTyping) {
      setIsTyping(true);
      emitTyping(selectedUser.id, username || 'User');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        emitStopTyping(selectedUser.id);
      }, 3000);
    }
  };

  // Don't render anything until client-side to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  const activePreview = (user: any) => {
    if (user.lastMessage) return user.lastMessage;
    if (selectedUser?.id === user.id && messages.length > 0) {
      return messages[messages.length - 1]?.content || 'Start a conversation';
    }
    return 'Start a conversation';
  };

  const visibleMessages = selectedUser
    ? messages.filter((msg: any) => {
        const senderId = getId(msg.senderId);
        const receiverId = getId(msg.receiverId);
        const currentId = getId(userId);
        const otherId = getId(selectedUser.id);
        return (
          (senderId === currentId && receiverId === otherId) ||
          (senderId === otherId && receiverId === currentId)
        );
      })
    : [];

  const filteredMessages = searchText.trim()
    ? visibleMessages.filter((msg: any) =>
        msg.content?.toLowerCase().includes(searchText.trim().toLowerCase())
      )
    : visibleMessages;

  const handleAttachClick = () => {
    if (!selectedUser) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedUser) return;
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addMessage({
        content: `📎 ${file.name}`,
        senderId: userId,
        receiverId: selectedUser?.id,
        isOwn: true,
        timestamp: new Date(),
      });
      event.target.value = '';
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await messageAPI.uploadAttachment(formData);
      const attachment = response.data.attachment;

      sendMessage(selectedUser.id, '', attachment);
      addMessage({
        content: '',
        senderId: userId,
        receiverId: selectedUser.id,
        isOwn: true,
        timestamp: new Date(),
        attachment,
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => `${prev}${emoji}`);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="relative flex h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
        <div className="pointer-events-none absolute inset-0 bg-radial-glow-2" />
        <div className="pointer-events-none absolute inset-0 bg-radial-glow-3" />

        {sidebarOpen && (
          <button
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[22rem] transform transition duration-300 lg:static lg:w-[24rem] ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex h-full">
            <div className="flex w-20 flex-col items-center gap-4 border-r border-white/5 bg-panel/90 py-6">
              <button
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-glow transition hover:scale-105"
                title="New server"
              >
                <Plus size={20} />
              </button>
              <div className="flex flex-1 flex-col items-center gap-4">
                {serverNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setActiveNav(item.key as typeof activeNav)}
                      className={`group flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                        activeNav === item.key
                          ? 'bg-white/10 text-white shadow-glow'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:shadow-glow'
                      }`}
                      title={item.label}
                    >
                      <Icon size={20} />
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto flex flex-col items-center gap-3 pb-2">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple/90 to-neon-blue/90 text-xs font-semibold text-white">
                    {avatar ? (
                      <img src={avatar} alt="You" className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      getInitials(displayName || username || 'You')
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-panel ${
                      isConnected ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">You</span>
              </div>
            </div>

            <div className="flex w-[16rem] flex-col border-r border-white/5 bg-panel-2/80 backdrop-blur-xl">
              <div className="px-4 pb-4 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">YapIt</p>
                    <h1 className="text-lg font-semibold text-white">Messages</h1>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl bg-white/5 p-2 text-slate-300 transition hover:text-white hover:shadow-glow"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {isConnected ? 'Connected' : 'Offline'}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-6 app-scrollbar">
                {activeNav !== 'chats' ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          {activeNav}
                        </span>
                        <ChevronRight size={16} className="text-slate-500" />
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {activeNav === 'settings' ? 'Open the settings center in main panel.' : `This section is ready for ${activeNav} content.`}
                      </p>
                    </div>
                    {activeNav !== 'settings' && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                        Coming soon.
                      </div>
                    )}
                  </div>
                ) : isLoadingUsers ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3 skeleton">
                        <div className="h-11 w-11 rounded-2xl bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 rounded-full bg-white/10" />
                          <div className="h-2 w-16 rounded-full bg-white/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    No conversations yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user: any) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          selectUser(user);
                          setSidebarOpen(false);
                        }}
                        className={`group w-full rounded-2xl border px-3 py-3 text-left transition hover-lift ${
                          selectedUser?.id === user.id
                            ? 'border-white/20 bg-white/10 shadow-glow'
                            : 'border-transparent bg-white/5 hover:border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/80 to-neon-blue/80 text-xs font-semibold text-white">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.displayName || user.username} className="h-full w-full object-cover" />
                              ) : (
                                getInitials(user.displayName || user.username)
                              )}
                            </div>
                            <span
                              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-panel-2 ${
                                user.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-white">{user.displayName || user.username}</p>
                              <span className="text-[11px] text-slate-400">{formatClock(user.lastSeen)}</span>
                            </div>
                            <p className="truncate text-xs text-slate-400">{activePreview(user)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="glass-header sticky top-0 z-20">
            <div className="flex items-center justify-between px-4 py-3 lg:px-6">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl bg-white/5 p-2 text-slate-300 transition hover:text-white lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu size={18} />
                </button>
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/70 to-neon-blue/70 text-white">
                    {selectedUser?.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.displayName || selectedUser.username || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : selectedUser ? (
                      <span className="text-xs font-semibold text-white">
                        {getInitials(selectedUser.displayName || selectedUser.username)}
                      </span>
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  {selectedUser?.isOnline && (
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-panel bg-emerald-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {selectedUser ? (selectedUser.displayName || selectedUser.username) : 'Select a conversation'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedUser
                      ? selectedUser.isOnline
                        ? 'Online now'
                        : 'Offline'
                      : 'Choose a chat to start messaging'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { icon: Search, label: 'Search', onClick: () => setShowSearch(true) },
                  { icon: Phone, label: 'Call', onClick: () => setShowCall(true) },
                  { icon: Info, label: 'Info', onClick: () => setShowInfo(true) },
                ].map(
                  (action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        disabled={!selectedUser}
                        onClick={action.onClick}
                        className="rounded-xl bg-white/5 p-2 text-slate-300 transition hover:scale-105 hover:text-white disabled:opacity-40"
                        title={action.label}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </header>

          {activeNav === 'settings' ? (
            <SettingsErrorBoundary>
              <SettingsCenter
                onProfileUpdated={(profile) => {
                  emitProfileUpdated(profile);
                }}
                onPrivacyUpdated={(privacy) => {
                  emitPrivacyUpdated(privacy);
                }}
              />
            </SettingsErrorBoundary>
          ) : selectedUser ? (
            <>
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-white/5 to-transparent px-4 py-6 lg:px-6 app-scrollbar">
                <div className="flex flex-col gap-3">
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                          <div className="w-[60%] rounded-2xl bg-white/5 px-4 py-3 skeleton">
                            <div className="h-3 w-3/4 rounded-full bg-white/10" />
                            <div className="mt-2 h-2 w-1/2 rounded-full bg-white/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    filteredMessages.map((msg: any, idx: number) => {
                      const isOwn = typeof msg.isOwn === 'boolean'
                        ? msg.isOwn
                        : getId(msg.senderId) === getId(userId);
                      const timeValue = msg.timestamp || msg.createdAt;
                      const attachment = msg.attachment;
                      return (
                        <div
                          key={msg.id || idx}
                          className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} animate-message-in`}
                          style={{ animationDelay: `${Math.min(idx, 10) * 18}ms` }}
                        >
                          <div
                            className={`relative max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft ${
                              isOwn
                                ? 'bg-gradient-to-br from-neon-purple/90 to-neon-blue/90 text-white'
                                : 'bg-white/5 text-slate-100 border border-white/10'
                            }`}
                          >
                            {attachment?.url && attachment?.type?.startsWith('image') ? (
                              <div className="space-y-2">
                                <img
                                  src={attachment.url}
                                  alt={attachment.name || 'Attachment'}
                                  className="max-h-64 w-full rounded-xl object-cover"
                                />
                                {msg.content ? <p>{msg.content}</p> : null}
                              </div>
                            ) : (
                              <p>{msg.content}</p>
                            )}
                            <span className="mt-2 block text-[11px] text-slate-200/70 opacity-0 transition group-hover:opacity-100">
                              {formatTimestamp(timeValue)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form
                onSubmit={handleSendMessage}
                className="glass-header sticky bottom-0 z-20 px-4 py-4 lg:px-6"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-white/20 focus-within:shadow-glow">
                  <button
                    type="button"
                    onClick={handleAttachClick}
                    className="rounded-xl p-2 text-slate-400 transition hover:text-white"
                    title="Attach"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmoji((prev) => !prev)}
                    className="rounded-xl p-2 text-slate-400 transition hover:text-white"
                    title="Emoji"
                  >
                    <Smile size={18} />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent px-2 text-sm text-white placeholder:text-slate-400 outline-none caret-neon-blue"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || !isConnected || isUploading}
                    className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-4 py-2 text-white shadow-glow transition hover:scale-105 disabled:opacity-40"
                  >
                    <Send size={18} />
                  </button>
                </div>
                {selectedUser && typingUsers.has(String(selectedUser.id)) && (
                  <p className="mt-2 text-xs text-slate-400 animate-fade-in">
                    {selectedUser.displayName || selectedUser.username} is typing...
                  </p>
                )}
                {isUploading && (
                  <p className="mt-2 text-xs text-slate-400 animate-fade-in">
                    Uploading image...
                  </p>
                )}
              </form>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
              {showEmoji && (
                <div className="absolute bottom-24 left-8 z-30 w-60 rounded-2xl border border-white/10 bg-panel-2/95 p-3 shadow-soft">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Emoji</span>
                    <button
                      className="rounded-lg p-1 text-slate-400 hover:text-white"
                      onClick={() => setShowEmoji(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {emojiSet.map((emoji) => (
                      <button
                        key={emoji}
                        className="rounded-lg bg-white/5 p-2 text-lg transition hover:scale-105"
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6">
              <div className="glass-panel max-w-md rounded-3xl p-8 text-center shadow-soft">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">YapIt</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Your neon chat hub
                </h3>
                <p className="mt-3 text-sm text-slate-400">
                  Pick a conversation from the left to start messaging.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSearch && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[90%] max-w-lg rounded-3xl border border-white/10 bg-panel-2/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Search messages</h3>
              <button
                className="rounded-xl p-2 text-slate-400 hover:text-white"
                onClick={() => setShowSearch(false)}
              >
                <X size={18} />
              </button>
            </div>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Type to filter messages..."
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20 focus:shadow-glow"
            />
            <p className="mt-3 text-xs text-slate-400">
              Showing {filteredMessages.length} result{filteredMessages.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      )}

      {showInfo && selectedUser && (
        <div className="fixed inset-y-0 right-0 z-40 w-[22rem] border-l border-white/10 bg-panel-2/95 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Chat info</h3>
            <button
              className="rounded-xl p-2 text-slate-400 hover:text-white"
              onClick={() => setShowInfo(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">User</p>
              <p className="mt-2 text-base font-semibold text-white">{selectedUser.displayName || selectedUser.username}</p>
              <p className="text-xs text-slate-400">
                {selectedUser.isOnline ? 'Online now' : 'Offline'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              Shared media and settings can live here.
            </div>
          </div>
        </div>
      )}

      {showCall && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[90%] max-w-md rounded-3xl border border-white/10 bg-panel-2/95 p-6 text-center shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple/80 to-neon-blue/80 text-white shadow-glow">
              <Phone size={22} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Calling {selectedUser.displayName || selectedUser.username}</h3>
            <p className="mt-2 text-sm text-slate-400">This is a UI-only action for now.</p>
            <button
              className="mt-6 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:shadow-glow"
              onClick={() => setShowCall(false)}
            >
              End call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
