import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Users, Baby, Utensils, MapPin, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function PartyPlanner({ profile, onEventCreated }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    num_adults: '',
    num_kids: '',
    party_theme: '',
    food_preferences: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePlan = async () => {
    setLoading(true);
    const homeAddress = profile?.home_address || '';
    const totalGuests = (parseInt(form.num_adults) || 0) + (parseInt(form.num_kids) || 0);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a party food planning AI. Plan food for a ${form.party_theme || 'general'} themed party.

Details:
- Adults: ${form.num_adults || 0}
- Kids: ${form.num_kids || 0}
- Total guests: ${totalGuests}
- Food type wanted: ${form.food_preferences || 'general party food'}
- Party theme: ${form.party_theme || 'none'}
- Location: ${form.location || 'TBD'}
- Home address: ${homeAddress || 'not provided'}

Create:
1. A detailed food_plan list with quantities appropriate for the number of adults and kids (kids eat less, plan accordingly). Include appetizers, mains, sides, drinks, desserts.
2. grocery_stores: Find 3 nearby grocery stores to "${homeAddress || form.location || 'the area'}" with estimated total cost for all the food items, distance, and a Google Maps URL. Use real store names (Walmart, Kroger, HEB, Publix, Target, etc.)
3. estimated_food_cost: Overall estimated range like "$120 - $180"

Be specific with quantities (e.g. "4 lbs chicken", "3 bags chips").`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          food_plan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                quantity: { type: "string" },
                notes: { type: "string" }
              }
            }
          },
          grocery_stores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                store: { type: "string" },
                address: { type: "string" },
                distance_miles: { type: "string" },
                estimated_total: { type: "string" },
                maps_url: { type: "string" }
              }
            }
          },
          estimated_food_cost: { type: "string" }
        }
      }
    });

    await base44.entities.Event.create({
      name: form.name,
      date: form.date,
      time: form.time,
      location: form.location,
      source_type: 'party',
      is_party: true,
      num_adults: parseInt(form.num_adults) || 0,
      num_kids: parseInt(form.num_kids) || 0,
      party_theme: form.party_theme,
      food_preferences: form.food_preferences,
      food_plan: result.food_plan || [],
      grocery_stores: result.grocery_stores || [],
      estimated_food_cost: result.estimated_food_cost || '',
      description: `${form.party_theme} party for ${totalGuests} guests`,
    });

    setOpen(false);
    setForm({ name: '', date: '', time: '', location: '', num_adults: '', num_kids: '', party_theme: '', food_preferences: '' });
    setLoading(false);
    onEventCreated();
  };

  const canSubmit = form.name && form.num_adults;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-accent/20 flex items-center justify-center">
            <PartyPopper className="w-4 h-4 text-accent-foreground" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">Plan a Party / Gathering</p>
            <p className="text-[11px] text-muted-foreground">Get food quantities, costs & nearest stores</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-4 border-t border-border space-y-3 pt-4"
        >
          <input className="input-field" placeholder="Event name (e.g. Birthday Party)" value={form.name} onChange={e => set('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            <input className="input-field" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
          <input className="input-field" placeholder="Location / venue address" value={form.location} onChange={e => set('location', e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className="input-field pl-9" type="number" min="0" placeholder="# Adults" value={form.num_adults} onChange={e => set('num_adults', e.target.value)} />
            </div>
            <div className="relative">
              <Baby className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className="input-field pl-9" type="number" min="0" placeholder="# Kids" value={form.num_kids} onChange={e => set('num_kids', e.target.value)} />
            </div>
          </div>
          <input className="input-field" placeholder="Party theme (e.g. Hawaiian, BBQ, Birthday)" value={form.party_theme} onChange={e => set('party_theme', e.target.value)} />
          <div className="relative">
            <Utensils className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              className="input-field pl-9 resize-none h-16"
              placeholder="Food preferences (e.g. grilled meats, vegetarian, Italian...)"
              value={form.food_preferences}
              onChange={e => set('food_preferences', e.target.value)}
            />
          </div>

          <Button onClick={handlePlan} disabled={!canSubmit || loading} className="w-full h-10">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Planning your party food...</>
            ) : (
              <><MapPin className="w-4 h-4 mr-2" /> Generate Food Plan & Find Stores</>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}