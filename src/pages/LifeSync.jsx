import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { isSameDay } from 'date-fns';
import FileUploadZone from '../components/shared/FileUploadZone';
import EmptyState from '../components/shared/EmptyState';
import EventCard from '../components/events/EventCard';
import MiniCalendar from '../components/events/MiniCalendar';

export default function LifeSync() {
  const [processing, setProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-date', 100),
  });

  const createEvent = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const handleFileUploaded = async (fileUrl) => {
    setProcessing(true);
    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an event extraction AI. Analyze this image of a flyer, invitation, or handwritten note.
Extract:
- Event name
- Date (in YYYY-MM-DD format)
- Time (e.g. "3:00 PM")
- Location/address
- A brief description
- A "Don't Forget" checklist of things the attendee should bring or prepare (e.g. "bring a dish", "wear cleats", "RSVP by Friday")

If the date is relative (e.g., "this Saturday"), estimate based on today being ${new Date().toISOString().split('T')[0]}.
Be thorough with the checklist - think about what someone attending this event would need.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD format" },
          time: { type: "string" },
          location: { type: "string" },
          description: { type: "string" },
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

    await createEvent.mutateAsync({
      ...extracted,
      file_url: fileUrl,
      checklist: (extracted.checklist || []).map(c => ({ ...c, checked: false })),
    });
    setProcessing(false);
  };

  const filteredEvents = selectedDate
    ? events.filter(e => e.date && isSameDay(new Date(e.date), selectedDate))
    : events;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Life Sync</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Capture events from flyers & invitations</p>
      </div>

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
          description="Upload a photo of a flyer or invitation to extract event details"
        />
      ) : (
        <div className="space-y-3">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}