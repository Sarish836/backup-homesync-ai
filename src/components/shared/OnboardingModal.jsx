import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, ArrowRight, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function OnboardingModal({ onComplete }) {
  // mode: 'auth' | 'signup'
  // If rendered, user is already authenticated (Layout only shows this when profile === null)
  // so skip the auth screen and go straight to signup steps
  const [mode, setMode] = useState('signup');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', home_address: '', skip_address: false });

  const signupSteps = [
    {
      icon: User,
      title: "What's your name?",
      subtitle: "We'll use this to personalize your experience.",
      field: 'name',
      placeholder: 'Your full name',
      type: 'text',
    },
    {
      icon: Home,
      title: "What's your home address?",
      subtitle: "Used to calculate travel times and find nearby stores. You can skip this.",
      field: 'home_address',
      placeholder: '123 Main St, City, State',
      type: 'text',
      optional: true,
    },
  ];

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleSignUp = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleNext = () => {
    if (step === signupSteps.length - 1) {
      onComplete(form);
    } else {
      setStep(s => s + 1);
    }
  };

  const current = signupSteps[step];
  const isLast = step === signupSteps.length - 1;
  // Name step requires input; address step is always optional
  const canProceed = !current?.field || current.optional || form.skip_address || form[current.field]?.trim().length > 0;

  // Auth screen
  if (mode === 'auth') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-3xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="font-heading font-bold text-3xl text-foreground text-center mb-2">
            MyHomeAI
          </h1>
          <p className="text-muted-foreground text-center text-sm mb-10 leading-relaxed">
            Your all-in-one smart home assistant
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              variant="outline"
              className="w-full h-12 rounded-xl font-semibold text-base border-2"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Button>

            <Button
              onClick={handleSignUp}
              className="w-full h-12 rounded-xl font-semibold text-base"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Your data stays private — only you can see your records.
          </p>
        </motion.div>
      </div>
    );
  }

  // Sign-up flow
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {signupSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-primary' : i < step ? 'w-3 bg-primary/40' : 'w-3 bg-border'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <current.icon className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h2 className="font-heading font-bold text-2xl text-foreground text-center mb-2">
            {current.title}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-8 leading-relaxed">
            {current.subtitle}
          </p>

          {current.field && (
            <>
              <input
                type={current.type}
                placeholder={current.placeholder}
                value={form[current.field]}
                onChange={e => setForm(f => ({ ...f, [current.field]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && canProceed && handleNext()}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm mb-3"
              />
              {current.optional && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.skip_address}
                    onChange={e => setForm(f => ({ ...f, skip_address: e.target.checked, home_address: e.target.checked ? '' : f.home_address }))}
                    className="rounded"
                  />
                  Skip — I don't want to use my address
                </label>
              )}
            </>
          )}

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="w-full h-12 rounded-xl font-semibold text-base"
          >
            {isLast ? 'Get Started' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <button
            onClick={() => { setMode('auth'); setStep(0); }}
            className="w-full text-center text-xs text-muted-foreground mt-4 hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}