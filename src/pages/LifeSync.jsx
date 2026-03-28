import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
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
      prompt: `You are an event extraction AI. Analyze this image of a flyer, invitation, or handwritten note.

Extract:
- Event name
- Date (in YYYY-MM-DD format)
- Time (e.g. "3:00 PM")
- Location/address
- A brief description
- A "Don't Forget" checklist of things the attendee should bring or prepare

${homeAddress ? `TRAVEL TIME: The user's home address is "${homeAddress}". Estimate how many minutes it would take to drive from their home to the event location. Also calculate what time they need to leave home to arrive at the event on time (factor in the event start time). Provide a "leave_by_time" like "2:15 PM".` : 'Set travel_time_minutes to null if no home address is available.'}

If the date is relative (e.g., "this Saturday"), estimate based on today being ${new Date().toISOString().split('T')[0]}.`,
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
      file_url: fileUrl,
      checklist: (extracted.checklist || []).map(c => ({ ...c, checked: false })),
    });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    setProcessing(false);
  };

  const filteredEvents = selectedDate
    ? events.filter(e => e.date && isSameDay(new Date(e.date), selectedDate))
    : events;

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