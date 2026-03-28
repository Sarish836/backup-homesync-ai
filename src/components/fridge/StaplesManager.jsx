import React, { useState } from 'react';
import { Plus, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function StaplesManager({ profile, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const [newItem, setNewItem] = useState('');
  const staples = profile?.household_staples || [];

  const addStaple = async () => {
    if (!newItem.trim()) return;
    const updated = [...staples, { name: newItem.trim(), quantity: '' }];
    await onSave({ household_staples: updated });
    setNewItem('');
  };

  const removeStaple = async (idx) => {
    const updated = staples.filter((_, i) => i !== idx);
    await onSave({ household_staples: updated });
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Household Staples</span>
          {staples.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{staples.length}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{expanded ? 'hide' : 'manage'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <p className="text-xs text-muted-foreground">Items you always want to have in stock. We'll flag if they're missing from your fridge photo.</p>

              <div className="flex flex-wrap gap-1.5">
                {staples.map((s, idx) => (
                  <span key={idx} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-lg">
                    {s.name}
                    <button onClick={() => removeStaple(idx)} className="text-muted-foreground hover:text-destructive ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add a staple (e.g. milk, eggs...)"
                  className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => e.key === 'Enter' && addStaple()}
                />
                <Button size="sm" onClick={addStaple} disabled={!newItem.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}