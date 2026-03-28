import React from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, startOfWeek } from 'date-fns';

export default function MiniCalendar({ events = [], selectedDate, onSelectDate }) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart);
  const days = eachDayOfInterval({ start: calendarStart, end: addDays(monthEnd, 6 - getDay(monthEnd)) });

  const eventDates = events
    .filter(e => e.date)
    .map(e => new Date(e.date));

  const hasEvent = (day) => eventDates.some(d => isSameDay(d, day));

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4">
      <h3 className="font-heading font-semibold text-sm mb-3">{format(today, 'MMMM yyyy')}</h3>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isCurrentMonth = day.getMonth() === today.getMonth();
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