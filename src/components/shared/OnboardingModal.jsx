import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, ArrowRight, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const HexBackground = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-6l22-12.7V22.7L28 10 6 22.7v24.6L28 60z' fill='%231e40af' fill-opacity='0.18'/%3E%3Cpath d='M28 100L0 84V50l28-16 28 16v34L28 100zm0-6l22-12.7V56.7L28 44 6 56.7v24.6L28 94z' fill='%231e40af' fill-opacity='0.10'/%3E%3C/svg%3E")`,
    }}
  />
);

const signupSteps = [
  {
    icon: User,
    title: "What's your name?",
    subtitle: "We'll use this to personalize your experience.",
    field: 'name',
    placeholder: 'Your full name',
    optional: false,
  },
  {
    icon: Home,
    title: "What's your home address?",
    subtitle: "Used to calculate travel times and find nearby stores. You can skip this.",
    field: 'home_address',
    placeholder: '123 Main St, City, State',
    optional: true,
  },
];

export default function OnboardingModal({ onComplete }) {
  // If user is already authenticated (e.g. returned from Google/Apple OAuth),
  // skip the login screen and go straight to profile setup
  const [mode, setMode] = useState('auth'); // 'auth' | 'signup'
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', home_address: '', skip_address: false });

  // On mount, check if user is already logged in — if so, skip to signup steps
  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (authed) setMode('signup');
    });
  }, []);

  const handleLogin = () => base44.auth.redirectToLogin(window.location.href);
  const handleSignUp = () => { setMode('signup'); setStep(0); };

  const handleNext = () => {
    if (step < signupSteps.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete(form);
    }
  };

  const current = signupSteps[step];
  const isLast = step === signupSteps.length - 1;
  const canProceed = current.optional || form.skip_address || (form[current.field] && form[current.field].trim().length > 0);

  // ── Auth Screen ──────────────────────────────────────────────
  if (mode === 'auth') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden"
        style={{ background: 'hsl(218 40% 6%)' }}>
        <HexBackground />

        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(210 100% 56%), transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(199 100% 50%), transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-sm z-10"
        >
          {/* Glass card */}
          <div className="rounded-3xl p-8 border border-white/10"
            style={{ background: 'hsl(218 35% 12% / 0.85)', backdropFilter: 'blur(24px)' }}>

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-3xl flex items-center justify-center shadow-2xl"
                style={{ background: 'linear-gradient(135deg, hsl(210 100% 56%), hsl(199 100% 50%))' }}>
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="font-heading font-bold text-3xl text-white text-center mb-2">
              MyHomeAI
            </h1>
            <p className="text-center text-sm mb-8 leading-relaxed" style={{ color: 'hsl(215 15% 60%)' }}>
              Your all-in-one smart home assistant
            </p>

            <div className="space-y-3">
              <button
                onClick={handleLogin}
                className="w-full h-12 rounded-xl font-semibold text-base border-2 flex items-center justify-center gap-2 transition-all hover:border-white/40 hover:bg-white/5"
                style={{ borderColor: 'hsl(218 25% 30%)', color: 'hsl(210 20% 90%)', background: 'transparent' }}
              >
                <LogIn className="w-4 h-4" />
                Log In
              </button>

              <button
                onClick={handleSignUp}
                className="w-full h-12 rounded-xl font-semibold text-base flex items-center justify-center gap-2 text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, hsl(210 100% 56%), hsl(199 100% 50%))' }}
              >
                <UserPlus className="w-4 h-4" />
                Get Started
              </button>
            </div>

            <p className="text-center text-xs mt-6" style={{ color: 'hsl(215 15% 50%)' }}>
              Your data stays private — only you can see your records.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Sign-up Steps ────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden"
      style={{ background: 'hsl(218 40% 6%)' }}>
      <HexBackground />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(210 100% 56%), transparent 70%)' }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-sm z-10"
        >
          <div className="rounded-3xl p-8 border border-white/10"
            style={{ background: 'hsl(218 35% 12% / 0.85)', backdropFilter: 'blur(24px)' }}>

            {/* Progress */}
            <div className="flex justify-center gap-2 mb-8">
              {signupSteps.map((_, i) => (
                <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? '24px' : '12px',
                    background: i <= step ? 'hsl(210 100% 56%)' : 'hsl(218 25% 25%)',
                  }} />
              ))}
            </div>

            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'hsl(210 100% 56% / 0.15)', border: '1px solid hsl(210 100% 56% / 0.3)' }}>
                <current.icon className="w-8 h-8" style={{ color: 'hsl(210 100% 56%)' }} />
              </div>
            </div>

            <h2 className="font-heading font-bold text-2xl text-white text-center mb-2">
              {current.title}
            </h2>
            <p className="text-center text-sm mb-8 leading-relaxed" style={{ color: 'hsl(215 15% 60%)' }}>
              {current.subtitle}
            </p>

            <input
              type="text"
              placeholder={current.placeholder}
              value={form[current.field]}
              onChange={e => setForm(f => ({ ...f, [current.field]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && canProceed && handleNext()}
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none transition-all"
              style={{
                background: 'hsl(218 30% 18%)',
                border: '1px solid hsl(218 25% 28%)',
                color: 'hsl(210 20% 96%)',
              }}
            />

            {current.optional && (
              <label className="flex items-center gap-2 text-xs mb-6 cursor-pointer" style={{ color: 'hsl(215 15% 55%)' }}>
                <input
                  type="checkbox"
                  checked={form.skip_address}
                  onChange={e => setForm(f => ({ ...f, skip_address: e.target.checked, home_address: e.target.checked ? '' : f.home_address }))}
                  className="rounded"
                />
                Skip — I don't want to use my address
              </label>
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="w-full h-12 rounded-xl font-semibold text-base flex items-center justify-center gap-2 text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, hsl(210 100% 56%), hsl(199 100% 50%))' }}
            >
              {isLast ? 'Get Started' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setMode('auth'); setStep(0); }}
              className="w-full text-center text-xs mt-4 transition-colors hover:opacity-80"
              style={{ color: 'hsl(215 15% 50%)' }}
            >
              ← Back
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}