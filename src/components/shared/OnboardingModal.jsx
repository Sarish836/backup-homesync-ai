import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', home_address: '', skip_address: false });

  const steps = [
    {
      icon: Sparkles,
      title: 'Welcome to HomeSync AI',
      subtitle: 'Your all-in-one smart home assistant. Let\'s get you set up in seconds.',
      field: null,
    },
    {
      icon: User,
      title: 'What\'s your name?',
      subtitle: 'We\'ll use this to personalize your experience.',
      field: 'name',
      placeholder: 'Your full name',
      type: 'text',
    },
    {
      icon: Home,
      title: 'What\'s your home address?',
      subtitle: 'Used to calculate travel times and find nearby stores. You can skip this, but location-based features won\'t work.',
      field: 'home_address',
      placeholder: '123 Main St, City, State',
      type: 'text',
      optional: true,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete(form);
    } else {
      setStep(s => s + 1);
    }
  };

  const canProceed = !current.field || form.skip_address || form[current.field]?.trim().length > 0;

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
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-primary' : i < step ? 'w-3 bg-primary/40' : 'w-3 bg-border'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <current.icon className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Text */}
          <h2 className="font-heading font-bold text-2xl text-foreground text-center mb-2">
            {current.title}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-8 leading-relaxed">
            {current.subtitle}
          </p>

          {/* Input */}
          {current.field && (
            <>
              <input
                type={current.type}
                placeholder={current.placeholder}
                value={form[current.field]}
                onChange={e => setForm(f => ({ ...f, [current.field]: e.target.value, skip_address: false }))}
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
                  Skip — I don't want to use my address (location features won't work)
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

          {step === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Your data stays private — only you can see your records.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}