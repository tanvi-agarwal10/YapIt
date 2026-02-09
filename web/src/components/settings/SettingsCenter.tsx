'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Brush, Database, Lock, Shield, UserCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';
import { SettingsPayload, useAuthStore, useSettingsStore } from '../../utils/store';

type Props = {
  onProfileUpdated?: (profile: any) => void;
  onPrivacyUpdated?: (privacy: any) => void;
};

type TabKey = 'profile' | 'security' | 'privacy' | 'notifications' | 'appearance' | 'storage';

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: 'profile', label: 'Profile', icon: UserCircle },
  { key: 'security', label: 'Account & Security', icon: Lock },
  { key: 'privacy', label: 'Privacy', icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Brush },
  { key: 'storage', label: 'Storage & Data', icon: Database },
];

const applyAppearance = (appearance: SettingsPayload['appearance']) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--accent-color', appearance.accentColor || '#7c5cff');
  root.style.setProperty('--app-font-size', `${appearance.fontSize || 16}px`);

  root.classList.toggle('theme-dark', appearance.theme === 'dark');
  root.classList.toggle('theme-neon', appearance.theme === 'neon');
  root.classList.toggle('layout-compact', !!appearance.compactLayout);
  root.classList.toggle('reduce-motion', !!appearance.reduceMotion);
};

export default function SettingsCenter({ onProfileUpdated, onPrivacyUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { setProfile } = useAuthStore();
  const {
    settings,
    setSettings,
    mergeSection,
    loading,
    setLoading,
    saving,
    setSaving,
    toasts,
    pushToast,
  } = useSettingsStore();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getSettings();
        setSettings(response.data);
        applyAppearance(response.data.appearance);
      } catch (error: any) {
        pushToast('error', error?.response?.data?.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [setLoading, setSettings, pushToast]);

  const storageUsage = useMemo(() => {
    if (!settings) return 0;
    return Math.round(new Blob([JSON.stringify(settings)]).size / 1024);
  }, [settings]);

  const saveProfile = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const payload = settings.profile;
      const previous = { ...payload };

      setProfile({
        username: payload.username,
        displayName: payload.displayName,
        avatar: payload.avatar,
        bio: payload.bio,
      });

      const response = await authAPI.updateProfile(payload);
      const user = response.data.user;
      mergeSection('profile', {
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        email: user.email,
      });

      setProfile({
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
      });

      onProfileUpdated?.({
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
      });

      pushToast('success', 'Profile saved');
    } catch (error: any) {
      pushToast('error', error?.response?.data?.message || 'Profile update failed');
    } finally {
      setSaving(false);
    }
  };

  const savePrivacy = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await authAPI.updatePrivacy(settings.privacy);
      onPrivacyUpdated?.(settings.privacy);
      pushToast('success', 'Privacy updated');
    } catch (error: any) {
      pushToast('error', error?.response?.data?.message || 'Privacy update failed');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await authAPI.updateNotifications(settings.notifications);
      pushToast('success', 'Notifications updated');
    } catch (error: any) {
      pushToast('error', error?.response?.data?.message || 'Notification update failed');
    } finally {
      setSaving(false);
    }
  };

  const saveAppearance = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      applyAppearance(settings.appearance);
      localStorage.setItem('yapit-appearance', JSON.stringify(settings.appearance));
      await authAPI.updateAppearance(settings.appearance);
      pushToast('success', 'Appearance updated');
    } catch (error: any) {
      pushToast('error', error?.response?.data?.message || 'Appearance update failed');
    } finally {
      setSaving(false);
    }
  };

  const saveStorage = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await authAPI.updateStorage(settings.storage);
      pushToast('success', 'Storage settings updated');
    } catch (error: any) {
      pushToast('error', error?.response?.data?.message || 'Storage update failed');
    } finally {
      setSaving(false);
    }
  };

  const checkUsername = (value: string) => {
    setUsernameStatus('checking');
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      try {
        const response = await authAPI.checkUsernameAvailability(value);
        setUsernameStatus(response.data.available ? 'ok' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 350);
  };

  if (loading || !settings) {
    return (
      <div className="p-6 lg:p-8">
        <div className="space-y-4">
          <div className="h-10 w-48 rounded-xl bg-white/10 skeleton" />
          <div className="h-48 rounded-2xl bg-white/5 skeleton" />
          <div className="h-48 rounded-2xl bg-white/5 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col lg:flex-row">
      <aside className="w-full border-b border-white/10 p-4 lg:w-72 lg:border-b-0 lg:border-r">
        <p className="px-2 text-xs uppercase tracking-[0.2em] text-slate-400">Settings</p>
        <div className="mt-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeTab === tab.key ? 'bg-white/10 text-white shadow-glow' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 app-scrollbar">
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold">Profile Management</h2>
            <section className="glass-panel rounded-2xl p-4 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {settings.profile.avatar ? (
                    <img
                      src={settings.profile.avatar}
                      alt="avatar"
                      className="h-full w-full object-cover"
                      style={{ transform: `scale(${(settings as any)._avatarZoom || 1})` }}
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      mergeSection('profile', { avatar: String(reader.result || '') });
                    };
                    reader.readAsDataURL(file);
                  }} />
                  <button className="rounded-xl bg-white/10 px-3 py-2 text-sm" onClick={() => fileRef.current?.click()}>
                    Change photo
                  </button>
                  <div className="mt-3">
                    <label className="text-xs text-slate-400">Avatar crop / zoom</label>
                    <input
                      type="range"
                      min={1}
                      max={2}
                      step={0.05}
                      value={(settings as any)._avatarZoom || 1}
                      onChange={(e) => setSettings({ ...(settings as any), _avatarZoom: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400">Username</label>
                  <input
                    value={settings.profile.username}
                    onChange={(e) => {
                      mergeSection('profile', { username: e.target.value.slice(0, 24) });
                      if (e.target.value.trim().length >= 3) checkUsername(e.target.value.trim());
                    }}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {usernameStatus === 'checking' && 'Checking availability...'}
                    {usernameStatus === 'ok' && 'Username available ✓'}
                    {usernameStatus === 'taken' && 'Username already taken'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Display name</label>
                  <input
                    value={settings.profile.displayName}
                    onChange={(e) => mergeSection('profile', { displayName: e.target.value.slice(0, 40) })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-500">{settings.profile.displayName.length}/40</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Bio / status</label>
                <textarea
                  value={settings.profile.bio}
                  onChange={(e) => mergeSection('profile', { bio: e.target.value.slice(0, 180) })}
                  className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
                <p className="mt-1 text-xs text-slate-500">{settings.profile.bio.length}/180</p>
              </div>

              <button onClick={saveProfile} disabled={saving || usernameStatus === 'taken'} className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-4 py-2 text-sm text-white disabled:opacity-50">
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </section>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold">Account & Security</h2>
            <SecuritySection settings={settings} pushToast={pushToast} />
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold">Privacy Controls</h2>
            <section className="glass-panel rounded-2xl p-4 space-y-3">
              <ToggleRow label="Show online status" value={settings.privacy.showOnlineStatus} onChange={(v) => mergeSection('privacy', { showOnlineStatus: v })} />
              <ToggleRow label="Read receipts" value={settings.privacy.showReadReceipts} onChange={(v) => mergeSection('privacy', { showReadReceipts: v })} />
              <ToggleRow label="Last seen visibility" value={settings.privacy.showLastSeen} onChange={(v) => mergeSection('privacy', { showLastSeen: v })} />

              <div>
                <label className="text-xs text-slate-400">Who can message me</label>
                <select
                  value={settings.privacy.whoCanMessage}
                  onChange={(e) => mergeSection('privacy', { whoCanMessage: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-medium">Blocked users</p>
                <div className="mt-2 space-y-2">
                  {settings.blockedUsers?.length ? settings.blockedUsers.map((u: any) => (
                    <div key={String(u._id || u.id)} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="text-sm">{u.displayName || u.username}</span>
                      <button className="text-xs text-neon-blue" onClick={async () => {
                        try {
                          await authAPI.unblockUser(String(u._id || u.id));
                          setSettings({
                            ...settings,
                            blockedUsers: settings.blockedUsers.filter((bu: any) => String(bu._id || bu.id) !== String(u._id || u.id)),
                          });
                          pushToast('success', 'User unblocked');
                        } catch (error: any) {
                          pushToast('error', error?.response?.data?.message || 'Failed to unblock user');
                        }
                      }}>Unblock</button>
                    </div>
                  )) : <p className="text-xs text-slate-400">No blocked users</p>}
                </div>
              </div>

              <button onClick={savePrivacy} disabled={saving} className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-4 py-2 text-sm text-white">
                {saving ? 'Saving...' : 'Save privacy'}
              </button>
            </section>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <section className="glass-panel rounded-2xl p-4 space-y-3">
              <ToggleRow label="Message notifications" value={settings.notifications.messages} onChange={(v) => mergeSection('notifications', { messages: v })} />
              <ToggleRow label="Sound" value={settings.notifications.sound} onChange={(v) => mergeSection('notifications', { sound: v })} />
              <ToggleRow label="Push notifications (placeholder)" value={settings.notifications.pushPlaceholder} onChange={(v) => mergeSection('notifications', { pushPlaceholder: v })} />

              <div>
                <label className="text-xs text-slate-400">Muted chat IDs (comma separated)</label>
                <input
                  value={settings.notifications.mutedChats.join(', ')}
                  onChange={(e) => mergeSection('notifications', {
                    mutedChats: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                  })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </div>

              <button className="rounded-xl bg-white/10 px-3 py-2 text-sm" onClick={async () => {
                if (!('Notification' in window)) {
                  pushToast('error', 'Notifications are not supported in this browser');
                  return;
                }
                const result = await Notification.requestPermission();
                pushToast('success', `Notification permission: ${result}`);
              }}>
                Request desktop permission
              </button>

              <button onClick={saveNotifications} disabled={saving} className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-4 py-2 text-sm text-white">
                {saving ? 'Saving...' : 'Save notifications'}
              </button>
            </section>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold">Appearance</h2>
            <section className="glass-panel rounded-2xl p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400">Theme</label>
                <select
                  value={settings.appearance.theme}
                  onChange={(e) => {
                    const next = { ...settings.appearance, theme: e.target.value as any };
                    mergeSection('appearance', next);
                    applyAppearance(next);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <option value="dark">Dark</option>
                  <option value="neon">Neon</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Accent color</label>
                <input
                  type="color"
                  value={settings.appearance.accentColor}
                  onChange={(e) => {
                    const next = { ...settings.appearance, accentColor: e.target.value };
                    mergeSection('appearance', next);
                    applyAppearance(next);
                  }}
                  className="mt-1 h-10 w-24 rounded-lg border border-white/10 bg-white/5"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Font size ({settings.appearance.fontSize}px)</label>
                <input
                  type="range"
                  min={13}
                  max={20}
                  value={settings.appearance.fontSize}
                  onChange={(e) => {
                    const next = { ...settings.appearance, fontSize: Number(e.target.value) };
                    mergeSection('appearance', next);
                    applyAppearance(next);
                  }}
                  className="mt-1 w-full"
                />
              </div>

              <ToggleRow label="Compact layout" value={settings.appearance.compactLayout} onChange={(v) => {
                const next = { ...settings.appearance, compactLayout: v };
                mergeSection('appearance', next);
                applyAppearance(next);
              }} />

              <ToggleRow label="Reduce motion" value={settings.appearance.reduceMotion} onChange={(v) => {
                const next = { ...settings.appearance, reduceMotion: v };
                mergeSection('appearance', next);
                applyAppearance(next);
              }} />

              <button onClick={saveAppearance} disabled={saving} className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-4 py-2 text-sm text-white">
                {saving ? 'Saving...' : 'Save appearance'}
              </button>
            </section>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold">Storage & Data</h2>
            <section className="glass-panel rounded-2xl p-4 space-y-3">
              <ToggleRow label="Media auto-download" value={settings.storage.mediaAutoDownload} onChange={(v) => mergeSection('storage', { mediaAutoDownload: v })} />

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm">Estimated settings storage: {storageUsage} KB</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="rounded-xl bg-white/10 px-3 py-2 text-sm" onClick={() => {
                  localStorage.removeItem('yapit-chat-cache');
                  mergeSection('storage', { cacheVersion: settings.storage.cacheVersion + 1 });
                  pushToast('success', 'Local cache cleared');
                }}>
                  Clear cache
                </button>
                <button className="rounded-xl bg-white/10 px-3 py-2 text-sm" onClick={() => {
                  pushToast('success', 'Export placeholder triggered');
                }}>
                  Export data (placeholder)
                </button>
              </div>

              <button onClick={saveStorage} disabled={saving} className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-4 py-2 text-sm text-white">
                {saving ? 'Saving...' : 'Save storage'}
              </button>
            </section>
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-xl px-3 py-2 text-sm shadow-soft ${toast.type === 'success' ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`h-7 w-12 rounded-full p-1 transition ${value ? 'bg-neon-blue' : 'bg-slate-600'}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-white transition ${value ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

function SecuritySection({ settings, pushToast }: { settings: SettingsPayload; pushToast: (type: 'success' | 'error', message: string) => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState(settings.profile.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [dangerPassword, setDangerPassword] = useState('');

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium">Change password</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} type="password" placeholder="Current" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="New" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Confirm" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        </div>
        <button className="rounded-xl bg-white/10 px-3 py-2 text-sm" onClick={async () => {
          try {
            await authAPI.changePassword({ oldPassword, newPassword, confirmPassword });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            pushToast('success', 'Password updated');
          } catch (error: any) {
            pushToast('error', error?.response?.data?.message || 'Password update failed');
          }
        }}>Update password</button>
      </section>

      <section className="glass-panel rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium">Email update (verification placeholder)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="New email" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <input value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} type="password" placeholder="Password confirmation" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
        </div>
        <button className="rounded-xl bg-white/10 px-3 py-2 text-sm" onClick={async () => {
          try {
            await authAPI.updateEmail({ newEmail, password: emailPassword });
            pushToast('success', 'Email updated (verification pending)');
          } catch (error: any) {
            pushToast('error', error?.response?.data?.message || 'Email update failed');
          }
        }}>Update email</button>
      </section>

      <section className="glass-panel rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium">Sessions & device management</p>
        <div className="space-y-2">
          {settings.activeSessions?.length ? settings.activeSessions.map((session: any, idx: number) => (
            <div key={`${session.sessionId}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <p>{session.device || 'Unknown device'}</p>
              <p className="text-xs text-slate-400">Last active: {new Date(session.lastActiveAt || Date.now()).toLocaleString()}</p>
            </div>
          )) : <p className="text-xs text-slate-400">No active sessions tracked yet</p>}
        </div>
        <button className="rounded-xl bg-white/10 px-3 py-2 text-sm" onClick={async () => {
          try {
            await authAPI.logoutAllDevices();
            pushToast('success', 'Logged out from all devices');
          } catch (error: any) {
            pushToast('error', error?.response?.data?.message || 'Failed to logout all devices');
          }
        }}>Logout all devices</button>
      </section>

      <section className="glass-panel rounded-2xl p-4 space-y-2">
        <p className="text-sm font-medium">Two-factor authentication</p>
        <p className="text-xs text-slate-400">Coming soon — placeholder UI ready for OTP/authenticator integration.</p>
      </section>

      <section className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 space-y-3">
        <p className="text-sm font-semibold text-rose-200">Danger zone</p>
        <input value={dangerPassword} onChange={(e) => setDangerPassword(e.target.value)} type="password" placeholder="Confirm password" className="w-full rounded-xl border border-rose-300/30 bg-black/20 px-3 py-2 text-sm" />
        <button className="rounded-xl bg-rose-500/80 px-3 py-2 text-sm text-white" onClick={async () => {
          try {
            await authAPI.deleteAccount(dangerPassword);
            pushToast('success', 'Account deleted');
          } catch (error: any) {
            pushToast('error', error?.response?.data?.message || 'Account deletion failed');
          }
        }}>Delete account</button>
      </section>
    </div>
  );
}
