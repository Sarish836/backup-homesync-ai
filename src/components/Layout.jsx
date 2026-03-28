import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Receipt, CalendarDays, Refrigerator, Wrench, UserCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../hooks/useTheme';

const tabs = [
  { path: '/', icon: Receipt, label: 'Bills' },
  { path: '/life-sync', icon: CalendarDays, label: 'Life Sync' },
  { path: '/fridge', icon: Refrigerator, label: 'Fridge' },
  { path: '/fix-it', icon: Wrench, label: 'Fix-It' },
  { path: '/profile', icon: UserCircle, label: 'Profile' },
];

function ThemedLayout() {
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const list = await base44.entities.UserProfile.list();
      return list[0] || null;
    },
  });
  useTheme(profile?.theme || 'default');

  const location = useLocation();
  const fontSize = { small: '13px', medium: '15px', large: '17px' }[profile?.font_size] || '15px';

  return (
    <div className="min-h-screen bg-background font-body flex flex-col" style={{ fontSize }}>
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-sm">HS</span>
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg leading-tight text-foreground">HomeSync AI</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Your smart home assistant</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
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