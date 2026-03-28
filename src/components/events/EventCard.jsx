import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, CheckSquare, Square, Navigation, Car, Trash2, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function EventCard({ event, homeAddress }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: event.name, date: event.date, time: event.time, location: event.location, description: event.description });

  const toggleChecklist = async (idx) => {
    const newChecklist = [...(event.checklist || [])];
    newChecklist[idx] = { ...newChecklist[idx], checked: !newChecklist[idx].checked };
    await base44.entities.Event.update(event.id, { checklist: newChecklist });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;
    await base44.entities.Event.delete(event.id);
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const handleSave = async () => {
    await base44.entities.Event.update(event.id, editForm);
    queryClient.invalidateQueries({ queryKey: ['events'] });
    setEditing(false);
  };

  const mapsUrl = event.location
    ? homeAddress
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(homeAddress)}&destination=${encodeURIComponent(event.location)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`
    : null;

  const eventDate = event.date ? new Date(event.date) : null;
  const isUpcoming = eventDate && eventDate >= new Date(new Date().toDateString());

  if (editing) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <CardContent className="p-4 space-y-2">
            <input className="input-field" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Event name" />
            <div className="grid grid-cols-2 gap-2">
              <input className="input-field" type="date" value={editForm.date || ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              <input className="input-field" type="time" value={editForm.time || ''} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} />
            </div>
            <input className="input-field" value={editForm.location || ''} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" />
            <textarea className="input-field resize-none h-16" value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="flex-1"><Check className="w-4 h-4 mr-1" /> Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="flex-1"><X className="w-4 h-4 mr-1" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="card-premium overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-foreground">{event.name}</h3>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {isUpcoming && <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Upcoming</Badge>}
              <button onClick={() => setEditing(true)} className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={handleDelete} className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
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

          {(event.travel_time_minutes || event.leave_by_time) && (
            <div className="mt-3 p-2.5 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-2">
              <Car className="w-4 h-4 text-primary shrink-0" />
              <div className="text-xs">
                {event.leave_by_time && <span className="font-semibold text-foreground">Leave by {event.leave_by_time}</span>}
                {event.travel_time_minutes && <span className="text-muted-foreground ml-1">· ~{event.travel_time_minutes} min drive</span>}
              </div>
            </div>
          )}

          {mapsUrl && (
            <Button size="sm" variant="outline" className="mt-2 h-8 text-xs w-full" asChild>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-3.5 h-3.5 mr-1.5" />
                {homeAddress ? `Directions from home` : 'Open in Google Maps'}
              </a>
            </Button>
          )}

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
                    {item.checked
                      ? <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                      : <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                    }
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