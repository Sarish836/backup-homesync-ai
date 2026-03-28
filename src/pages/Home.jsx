import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ScanText, CalendarDays, Refrigerator, Wrench, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  { path: '/', icon: ScanText, label: 'Docs', desc: 'Scan & audit bills', color: 'from-violet-500 to-purple-600' },
  { path: '/event-planner', icon: CalendarDays, label: 'Events', desc: 'Plan & organize', color: 'from-blue-500 to-indigo-600' },
  { path: '/fridge', icon: Refrigerator, label: 'Pantry', desc: 'Track ingredients', color: 'from-emerald-500 to-teal-600' },
  { path: '/fix-it', icon: Wrench, label: 'Repair', desc: 'Fix it yourself', color: 'from-orange-500 to-amber-600' },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const list = await base44.entities.UserProfile.list();
      return list[0] || null;
    },
  });

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || profile?.username || 'there';

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="relative min-h-[calc(100vh-12rem)] -mx-6 -mt-6 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80')`,
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-[calc(100vh-12rem)] px-6 pt-10 pb-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-auto"
        >
          <p className="text-white/70 text-sm font-medium">{formattedDate}</p>
          <h1 className="text-white font-heading font-bold text-3xl mt-1 leading-tight">
            {greeting()},<br />{firstName} 👋
          </h1>
          <p className="text-white/60 text-sm mt-2">What would you like to manage today?</p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
              >
                <Link to={f.path}>
                  <div className="relative overflow-hidden rounded-2xl p-4 backdrop-blur-md border border-white/20 bg-white/10 hover:bg-white/20 transition-all active:scale-95 cursor-pointer group">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-white font-heading font-bold text-sm">{f.label}</p>
                    <p className="text-white/60 text-xs mt-0.5">{f.desc}</p>
                    <ChevronRight className="absolute right-3 bottom-3 w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* MyHomeAI branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-white/40 text-xs">MyHomeAI · Your smart home assistant</p>
        </motion.div>
      </div>
    </div>
  );
}