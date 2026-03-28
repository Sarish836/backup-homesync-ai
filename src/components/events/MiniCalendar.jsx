import React, { useState } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, startOfWeek, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MiniCalendar({ events = [], selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart);
  const days = eachDayOfInterval({ start: calendarStart, end: addDays(monthEnd, 6 - getDay(monthEnd)) });

  const today = new Date();

  const eventDates = events
    .filter(e => e.date)
    .map(e => new Date(e.date));

  const hasEvent = (day) => eventDates.some(d => isSameDay(d, day));

  return (
    <div className="card-premium bg-card rounded-2xl border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewDate(d => subMonths(d, 1))}
          className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h3 className="font-heading font-semibold text-sm">{format(viewDate, 'MMMM yyyy')}</h3>
        <button
          onClick={() => setViewDate(d => addMonths(d, 1))}
          className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isCurrentMonth = day.getMonth() === viewDate.getMonth();
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const dayHasEvent = hasEvent(day);

          return (
            <button
              key={i}
              onClick={() => onSelectDate?.(day)}
              className={`relative h-8 w-8 mx-auto rounded-xl text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isToday
                    ? 'bg-primary/10 text-primary font-bold'
                    : isCurrentMonth
                      ? 'text-foreground hover:bg-muted'
                      : 'text-muted-foreground/40'
              }`}
            >
              {format(day, 'd')}
              {dayHasEvent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}