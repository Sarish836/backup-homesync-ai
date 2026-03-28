import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, CheckSquare, Square, Navigation, Car } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function EventCard({ event }) {
  const queryClient = useQueryClient();

  const toggleChecklist = async (idx) => {
    const newChecklist = [...(event.checklist || [])];
    newChecklist[idx] = { ...newChecklist[idx], checked: !newChecklist[idx].checked };
    await base44.entities.Event.update(event.id, { checklist: newChecklist });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  const eventDate = event.date ? new Date(event.date) : null;
  const isUpcoming = eventDate && eventDate >= new Date(new Date().toDateString());

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-heading font-semibold text-foreground">{event.name}</h3>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
              )}
            </div>
            {isUpcoming && <Badge className="bg-primary/10 text-primary border-0 text-[10px] shrink-0">Upcoming</Badge>}
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            {eventDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {format(eventDate, 'MMM d, yyyy')} {event.time && `at ${event.time}`}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[180px]">{event.location}</span>
              </span>
            )}
          </div>

          {/* Travel time reminder */}
          {(event.travel_time_minutes || event.leave_by_time) && (
            <div className="mt-3 p-2.5 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-2">
              <Car className="w-4 h-4 text-primary shrink-0" />
              <div className="text-xs">
                {event.leave_by_time && (
                  <span className="font-semibold text-foreground">Leave by {event.leave_by_time}</span>
                )}
                {event.travel_time_minutes && (
                  <span className="text-muted-foreground ml-1">· ~{event.travel_time_minutes} min drive</span>
                )}
              </div>
            </div>
          )}

          {mapsUrl && (
            <Button size="sm" variant="outline" className="mt-2 h-8 text-xs w-full" asChild>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-3.5 h-3.5 mr-1.5" /> Open in Google Maps
              </a>
            </Button>
          )}

          {/* Checklist */}
          {event.checklist?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Don't Forget</p>
              <div className="space-y-1.5">
                {event.checklist.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleChecklist(idx)}
                    className="flex items-center gap-2 w-full text-left text-sm hover:bg-muted/50 rounded-lg p-1.5 transition-colors"
                  >
                    {item.checked ? (
                      <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}>
                      {item.item}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}