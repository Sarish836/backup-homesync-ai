import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ScanText, CalendarDays, Refrigerator, Wrench, UserCircle, Shield, Home, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../hooks/useTheme';
import OnboardingModal from './shared/OnboardingModal.jsx';

const ADMIN_EMAILS = ['shreyassamal05@gmail.com', 'sarishdinesh@gmail.com', 'pmohanty.live@gmail.com', 'samarthravi30@gmail.com'];

const baseTabs = [
  { path: '/', icon: ScanText, label: 'Docs' },
  { path: '/event-planner', icon: CalendarDays, label: 'Events' },
  { path: '/fridge', icon: Refrigerator, label: 'Pantry' },
  { path: '/home', icon: Home, label: 'Home', isHome: true },
  { path: '/fix-it', icon: Wrench, label: 'Repair' },
  { path: '/profile', icon: UserCircle, label: 'Profile' },
];
// Home is index 2 (middle of 6 tabs) — already centered

function ThemedLayout() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = React.useState(null);
  React.useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const list = await base44.entities.UserProfile.list();
      return list[0] || null;
    },
  });
  useTheme(profile?.theme || 'purple', profile?.dark_mode || false);

  const needsOnboarding = !profileLoading && profile === null;
  const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email);
  const tabs = isAdmin ? [...baseTabs, { path: '/admin', icon: Shield, label: 'Admin' }] : baseTabs;

  const handleOnboardingComplete = async (form) => {
    const user = currentUser || await base44.auth.me();
    await base44.entities.UserProfile.create({
      username: form.name,
      home_address: form.home_address || '',
      skip_address: form.skip_address || false,
      created_by: user.email,
    });
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };

  const location = useLocation();
  const fontSize = { small: '13px', medium: '15px', large: '17px' }[profile?.font_size] || '15px';

  const clearHistory = async () => {
    const path = location.pathname;
    if (!confirm('Clear all history for this tab?')) return;
    if (path === '/') {
      const bills = await base44.entities.Bill.list();
      const docs = await base44.entities.BankingDocument.list();
      await Promise.all([
        ...bills.map(b => base44.entities.Bill.delete(b.id)),
        ...docs.map(d => base44.entities.BankingDocument.delete(d.id)),
      ]);
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['banking-documents'] });
    } else if (path === '/event-planner') {
      const events = await base44.entities.Event.list();
      await Promise.all(events.map(e => base44.entities.Event.delete(e.id)));
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } else if (path === '/fridge') {
      const scans = await base44.entities.FridgeScan.list();
      await Promise.all(scans.map(s => base44.entities.FridgeScan.delete(s.id)));
      queryClient.invalidateQueries({ queryKey: ['fridge-scans'] });
    } else if (path === '/fix-it') {
      const jobs = await base44.entities.RepairJob.list();
      await Promise.all(jobs.map(j => base44.entities.RepairJob.delete(j.id)));
      queryClient.invalidateQueries({ queryKey: ['repair-jobs'] });
    }
  };

  const showClearButton = ['/', '/event-planner', '/fridge', '/fix-it'].includes(location.pathname);

  React.useEffect(() => {
    document.documentElement.style.fontSize = fontSize;
    return () => { document.documentElement.style.fontSize = ''; };
  }, [fontSize]);

  return (
    <div className="min-h-screen h-full bg-background font-body flex flex-col" style={{ minHeight: '100dvh' }}>
      {needsOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      <header className="sticky top-0 z-40 glass border-b border-border/40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl glow-sm flex items-center justify-center" style={{background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'}}>
            <span className="text-white font-heading font-bold text-sm">M</span>
          </div>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-lg leading-tight text-gradient">MyHomeAI</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Your smart home assistant</p>
          </div>
          {showClearButton && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-6 pb-28">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto flex items-end">
          {tabs.map(({ path, icon: Icon, label, isHome }) => {
            const isActive = path === '/home' ? location.pathname === '/home' : (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));
            if (isHome) {
              return (
                <Link key={path} to={path} className="flex-1 flex flex-col items-center -mb-1">
                  <div className={`relative h-14 w-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-all ${isActive ? 'glow-primary scale-105' : 'hover:scale-105'}`}
                    style={{background:'linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))'}}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <span className={`text-[11px] font-semibold mt-1 pb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>Home</span>
                </Link>
              );
            }
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'nav-active-glow' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'font-semibold text-gradient' : ''}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function Layout() {
  return <ThemedLayout />;
}