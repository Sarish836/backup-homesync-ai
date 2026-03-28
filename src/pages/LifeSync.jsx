import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, AlertTriangle } from 'lucide-react';
import { isSameDay } from 'date-fns';
import FileUploadZone from '../components/shared/FileUploadZone';
import EmptyState from '../components/shared/EmptyState';
import EventCard from '../components/events/EventCard';
import PartyEventCard from '../components/events/PartyEventCard';
import PartyPlanner from '../components/events/PartyPlanner';
import MiniCalendar from '../components/events/MiniCalendar';
import AddressSetup from '../components/shared/AddressSetup';
import { useLocationAndProfile } from '../hooks/useLocationAndProfile';

export default function LifeSync() {
  const [processing, setProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const queryClient = useQueryClient();
  const { profile, saveProfile } = useLocationAndProfile();
  const homeAddress = [profile?.home_address, profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-date', 100),
  });

  const handleFileUploaded = async (fileUrl) => {
    setProcessing(true);
    const homeAddress = profile?.home_address || '';
    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert event extraction AI. Carefully analyze this flyer, invitation, or note.

You MUST extract ALL of the following — do not leave any blank if the information exists anywhere in the image:
- Event name (required)
- Date: look for any date, day of week, or time reference. Output in YYYY-MM-DD format. Today is ${new Date().toISOString().split('T')[0]}.
- Time: look for any start time (e.g. "3:00 PM", "7pm", "noon"). Always extract if present.
- Location: extract the FULL address or venue name. Look everywhere in the image including footers, small text, map references.
- Description: a 1-2 sentence summary of what the event is.
- Checklist: generate a "Don't Forget" list of 3-6 practical items the attendee should bring or prepare. Base it on the event type (e.g. birthday party → gift, card; sports event → comfortable shoes, water bottle; formal dinner → dress code reminder). Always provide at least 3 checklist items.

${homeAddress ? `TRAVEL TIME: The user lives at "${homeAddress}". Estimate driving time in minutes from their home to the event. Calculate what time they must leave to arrive on time (factor in start time). Provide leave_by_time like "2:15 PM".` : ''}

IMPORTANT: Never leave date, time, location, or checklist empty if the information can be inferred or estimated from context.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD format" },
          time: { type: "string" },
          location: { type: "string" },
          description: { type: "string" },
          travel_time_minutes: { type: "number", description: "Drive time in minutes from home" },
          leave_by_time: { type: "string", description: "What time to leave home e.g. '2:15 PM'" },
          source_type: { type: "string", enum: ["flyer", "invitation", "note"] },
          checklist: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                checked: { type: "boolean" }
              }
            }
          }
        }
      }
    });

    await base44.entities.Event.create({
      ...extracted,
      name: extracted.name || 'Untitled Event',
      file_url: fileUrl,
      checklist: (extracted.checklist || []).map(c => ({ ...c, checked: false })),
    });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    setProcessing(false);
  };

  const filteredEvents = selectedDate
    ? events.filter(e => e.date && isSameDay(new Date(e.date), selectedDate))
    : events;

  // Detect conflicts: events on the same date+time
  const conflicts = [];
  const seen = {};
  events.forEach(e => {
    if (!e.date) return;
    const key = `${e.date}|${e.time || 'notime'}`;
    if (seen[key]) {
      const existing = conflicts.find(c => c.key === key);
      if (existing) existing.events.push(e);
      else conflicts.push({ key, events: [seen[key], e] });
    } else {
      seen[key] = e;
    }
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Event Planner</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Capture events from flyers & plan gatherings</p>
      </div>

      <AddressSetup profile={profile} onSave={saveProfile} />

      <PartyPlanner
        profile={profile}
        onEventCreated={() => queryClient.invalidateQueries({ queryKey: ['events'] })}
      />

      <FileUploadZone
        onFileUploaded={handleFileUploaded}
        label="Upload a flyer, invitation, or note"
        isProcessing={processing}
        accept="image/*"
      />

      {conflicts.length > 0 && (
        <div className="space-y-2">
          {conflicts.map(conflict => (
            <div key={conflict.key} className="rounded-xl border border-yellow-400/40 bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Scheduling Conflict — pick one:</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {conflict.events.map(e => (
                  <div key={e.id} className="flex items-center gap-2 bg-white dark:bg-card rounded-lg px-3 py-2 border border-yellow-200/60">
                    <CalendarDays className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                      {e.location && <p className="text-[11px] text-muted-foreground truncate">{e.location}</p>}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">{e.time || e.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MiniCalendar
        events={events}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(selectedDate && isSameDay(d, selectedDate) ? null : d)}
      />

      {selectedDate && (
        <button
          onClick={() => setSelectedDate(null)}
          className="text-xs text-primary font-medium hover:underline"
        >
          ← Show all events
        </button>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={selectedDate ? "No events on this day" : "No events yet"}
          description="Upload a flyer or plan a party to get started"
        />
      ) : (
        <div className="space-y-3">
          {filteredEvents.map(event =>
            event.is_party
              ? <PartyEventCard key={event.id} event={event} homeAddress={homeAddress} />
              : <EventCard key={event.id} event={event} homeAddress={homeAddress} />
          )}
        </div>
      )}
    </div>
  );
}