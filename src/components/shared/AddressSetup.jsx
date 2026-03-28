import React, { useState } from 'react';
import { MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddressSetup({ profile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState(profile?.home_address || '');

  const handleSave = async () => {
    await onSave({ home_address: address });
    setEditing(false);
  };

  if (!profile?.home_address && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-primary/40 text-sm text-primary hover:bg-primary/5 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        <span>Set your home address for smarter features</span>
      </button>
    );
  }

  if (editing) {
    return (
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your home address..."
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <Button size="sm" onClick={handleSave} disabled={!address.trim()}>
          <Check className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <MapPin className="w-3.5 h-3.5 text-primary" />
      <span>{profile.home_address}</span>
      <span className="text-primary/60 ml-1">· edit</span>
    </button>
  );
}