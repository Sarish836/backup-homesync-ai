import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PartyPopper, Users, ShoppingCart, ChevronDown, ChevronUp, ExternalLink, DollarSign, MapPin, Trash2, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function PartyEventCard({ event, homeAddress }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const totalGuests = (event.num_adults || 0) + (event.num_kids || 0);

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;
    await base44.entities.Event.delete(event.id);
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const getMapsUrl = (storeAddress, storeName) => {
    const dest = storeAddress || storeName;
    const origin = homeAddress || '';
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <PartyPopper className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">{event.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {event.date && format(new Date(event.date), 'MMM d, yyyy')}
                  {event.time && ` at ${event.time}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              <Badge variant="secondary" className="text-[10px]">Party</Badge>
              <button onClick={handleDelete} className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{event.num_adults || 0} adults, {event.num_kids || 0} kids</span>
            </div>
            {event.party_theme && (
              <span className="text-xs text-muted-foreground">🎨 {event.party_theme}</span>
            )}
            {event.estimated_food_cost && (
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{event.estimated_food_cost}</span>
              </div>
            )}
          </div>

          {(event.food_plan?.length > 0 || event.grocery_stores?.length > 0) && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? 'Hide details' : 'View food plan & stores'}
            </button>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {event.food_plan?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ShoppingCart className="w-3.5 h-3.5" /> Food Plan
                    </p>
                    <div className="space-y-1.5">
                      {event.food_plan.map((item, i) => (
                        <div key={i} className={`flex justify-between items-start text-xs rounded-lg px-3 py-2 ${
                          item.source === 'restaurant' ? 'bg-accent/10 border border-accent/20' : 'bg-muted/40'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            {item.source === 'restaurant' && <Utensils className="w-3 h-3 text-accent-foreground shrink-0" />}
                            <span className="font-medium text-foreground">{item.item}</span>
                            {item.source === 'restaurant' && (
                              <span className="text-[10px] bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded-full">Restaurant</span>
                            )}
                          </div>
                          <div className="text-right ml-2 shrink-0">
                            <span className="text-primary font-semibold">{item.quantity}</span>
                            {item.notes && <p className="text-muted-foreground text-[10px]">{item.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.grocery_stores?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Nearest Stores & Costs
                    </p>
                    <div className="space-y-2">
                      {event.grocery_stores.map((store, i) => (
                        <div key={i} className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{store.store}</p>
                            <p className="text-[11px] text-muted-foreground">{store.address}</p>
                            {store.distance_miles && <p className="text-[11px] text-muted-foreground">{store.distance_miles} miles away</p>}
                            {store.hours && <p className="text-[11px] text-muted-foreground">🕐 {store.hours}</p>}
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <p className="font-bold text-primary text-sm">{store.estimated_total}</p>
                            <a
                              href={getMapsUrl(store.address, store.store)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary flex items-center gap-0.5 justify-end mt-0.5 hover:underline"
                            >
                              Directions <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}