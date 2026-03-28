import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Palette, Settings, Bell, Check, LogOut, MapPin, Phone, Mail, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ACCENT_OPTIONS } from '../hooks/useTheme';

const AVATAR_COLORS = ['#2d9b6f', '#2e86c1', '#e67e22', '#8e44ad', '#c0392b', '#27ae60', '#d35400', '#2980b9'];
const FONT_SIZES = [
  { id: 'small', label: 'Small', size: '13px' },
  { id: 'medium', label: 'Medium', size: '15px' },
  { id: 'large', label: 'Large', size: '17px' },
];

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [addressForm, setAddressForm] = useState({ home_address: '', phone: '', email: '' });
  const [addressInitialized, setAddressInitialized] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const list = await base44.entities.UserProfile.list();
      return list[0] || null;
    },
  });

  // All profiles (for username uniqueness check)
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-profiles-usernames'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (updates) => {
      if (profile?.id) {
        return base44.entities.UserProfile.update(profile.id, updates);
      } else {
        return base44.entities.UserProfile.create(updates);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
  });

  const handleSave = (updates) => saveMutation.mutate(updates);

  const handleUsernameSubmit = () => {
    const val = usernameInput.trim();
    if (!val) return;
    if (val.length < 3) { setUsernameError('Must be at least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) { setUsernameError('Only letters, numbers, underscores'); return; }
    const taken = allProfiles.some(p => p.username?.toLowerCase() === val.toLowerCase() && p.id !== profile?.id);
    if (taken) { setUsernameError('Username already taken'); return; }
    setUsernameError('');
    handleSave({ username: val });
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2000);
  };

  useEffect(() => {
    if (profile?.username) setUsernameInput(profile.username);
  }, [profile?.username]);

  useEffect(() => {
    if (profile && !addressInitialized) {
      setAddressForm({
        home_address: profile.home_address || '',
        phone: profile.phone || '',
        email: user?.email || '',
      });
      setAddressInitialized(true);
    }
  }, [profile, addressInitialized]);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const avatarColor = profile?.avatar_color || '#2d9b6f';
  const fontSize = { small: '13px', medium: '15px', large: '17px' }[profile?.font_size] || '15px';

  return (
    <div className="space-y-6 pb-8" style={{ fontSize }}>
      {/* Header */}
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Profile & Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Customize your MyHomeAI experience</p>
      </div>

      {/* Dark Mode Toggle */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="card-premium bg-card rounded-2xl border border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,hsl(var(--primary)/0.15),hsl(var(--accent)/0.1))'}}>
              {profile?.dark_mode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{profile?.dark_mode ? 'Dark Mode' : 'Light Mode'}</p>
              <p className="text-xs text-muted-foreground">Toggle appearance</p>
            </div>
          </div>
          <button
            onClick={() => handleSave({ dark_mode: !profile?.dark_mode })}
            className={`relative h-7 w-13 rounded-full transition-all duration-300 ${profile?.dark_mode ? 'glow-sm' : ''}`}
            style={{width:'52px', background: profile?.dark_mode ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))' : 'hsl(var(--muted))'}}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${profile?.dark_mode ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </motion.div>

      {/* Avatar + Identity */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-premium bg-card rounded-2xl border border-border/50 p-5 flex items-center gap-4"
        style={{background:'linear-gradient(135deg,hsl(var(--card)),hsl(var(--primary)/0.04))'}}>
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold font-heading shrink-0 glow-primary"
          style={{ background: avatarColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-foreground truncate">{user?.full_name || 'Your Name'}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          {profile?.username && (
            <p className="text-xs text-primary font-medium mt-0.5">@{profile.username}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => base44.auth.logout()}>
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </Button>
      </motion.div>

      {/* Contact Info */}
      <Section icon={MapPin} title="Personal Information">
        <div className="space-y-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={addressForm.home_address}
              onChange={(e) => setAddressForm(f => ({ ...f, home_address: e.target.value }))}
              onBlur={(e) => handleSave({ home_address: e.target.value })}
              placeholder="Home address"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={addressForm.phone}
              onChange={(e) => setAddressForm(f => ({ ...f, phone: e.target.value }))}
              onBlur={(e) => handleSave({ phone: e.target.value })}
              placeholder="Phone number"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={addressForm.email}
              readOnly
              placeholder="Email"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Fields auto-save when you click away.</p>
      </Section>

      {/* Avatar Color */}
      <Section icon={User} title="Avatar Color">
        <div className="flex gap-2 flex-wrap">
          {AVATAR_COLORS.map(color => (
            <button
              key={color}
              onClick={() => handleSave({ avatar_color: color })}
              className="h-9 w-9 rounded-xl transition-transform hover:scale-110"
              style={{ background: color, outline: avatarColor === color ? '3px solid hsl(var(--primary))' : 'none', outlineOffset: '2px' }}
            />
          ))}
        </div>
      </Section>

      {/* Accent Color */}
      <Section icon={Palette} title="Accent Color">
        <div className="grid grid-cols-3 gap-2">
          {ACCENT_OPTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => handleSave({ theme: a.id })}
              className={`relative flex items-center gap-2 p-2.5 rounded-xl border text-sm font-semibold transition-all overflow-hidden ${
                (profile?.theme || 'purple') === a.id
                  ? 'border-primary text-primary'
                  : 'border-border text-foreground hover:border-primary/40'
              }`}
              style={(profile?.theme || 'purple') === a.id ? {background:`linear-gradient(135deg,${a.color}18,${a.color}08)`,borderColor:a.color} : {}}
            >
              <span className={`h-5 w-5 rounded-full shrink-0 bg-gradient-to-br ${a.gradient}`} />
              {a.label}
              {(profile?.theme || 'purple') === a.id && <span className="absolute right-2 text-[10px] text-primary">✓</span>}
            </button>
          ))}
        </div>
      </Section>

      {/* Font Size */}
      <Section icon={Settings} title="Font Size">
        <div className="flex gap-2">
          {FONT_SIZES.map(f => (
            <button
              key={f.id}
              onClick={() => handleSave({ font_size: f.id })}
              className={`flex-1 py-2 rounded-xl border text-center transition-all ${
                (profile?.font_size || 'medium') === f.id
                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                  : 'border-border bg-card text-foreground hover:bg-muted/50'
              }`}
              style={{ fontSize: f.size }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Preferences */}
      <Section icon={Bell} title="Preferences">
        <div className="space-y-3">
          <Toggle
            label="Compact card view"
            description="Show cards in a denser layout"
            value={profile?.compact_view || false}
            onChange={(v) => handleSave({ compact_view: v })}
          />
          <Toggle
            label="Notifications"
            description="Show reminders and alerts"
            value={profile?.notifications_enabled !== false}
            onChange={(v) => handleSave({ notifications_enabled: v })}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card-premium bg-card rounded-2xl border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="font-heading font-semibold text-sm text-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative h-6 w-11 rounded-full transition-all duration-300"
        style={{background: value ? 'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))' : 'hsl(var(--muted))'}}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}