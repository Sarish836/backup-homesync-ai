import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PartyPopper, Users, ShoppingCart, ChevronDown, ChevronUp, ExternalLink, DollarSign, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function PartyEventCard({ event }) {
  const [expanded, setExpanded] = useState(false);
  const totalGuests = (event.num_adults || 0) + (event.num_kids || 0);

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
            <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">Party</Badge>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{event.num_adults || 0} adults, {event.num_kids || 0} kids</span>
            </div>
            {event.party_theme && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>🎨 {event.party_theme}</span>
              </div>
            )}
            {event.estimated_food_cost && (
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{event.estimated_food_cost}</span>
              </div>
            )}
          </div>

          {/* Expand toggle */}
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
                {/* Food Plan */}
                {event.food_plan?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ShoppingCart className="w-3.5 h-3.5" /> Food Plan
                    </p>
                    <div className="space-y-1.5">
                      {event.food_plan.map((item, i) => (
                        <div key={i} className="flex justify-between items-start text-xs bg-muted/40 rounded-lg px-3 py-2">
                          <span className="font-medium text-foreground">{item.item}</span>
                          <div className="text-right ml-2 shrink-0">
                            <span className="text-primary font-semibold">{item.quantity}</span>
                            {item.notes && <p className="text-muted-foreground text-[10px]">{item.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grocery Stores */}
                {event.grocery_stores?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Nearest Stores & Estimated Costs
                    </p>
                    <div className="space-y-2">
                      {event.grocery_stores.map((store, i) => (
                        <div key={i} className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{store.store}</p>
                            <p className="text-[11px] text-muted-foreground">{store.address}</p>
                            {store.distance_miles && (
                              <p className="text-[11px] text-muted-foreground">{store.distance_miles} miles away</p>
                            )}
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <p className="font-bold text-primary text-sm">{store.estimated_total}</p>
                            {store.maps_url && (
                              <a
                                href={store.maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary flex items-center gap-0.5 justify-end mt-0.5 hover:underline"
                              >
                                Directions <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
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