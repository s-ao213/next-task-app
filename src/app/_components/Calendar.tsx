"use client";
import React, { useState, useEffect } from 'react';
import { Task } from '../_types/task';
import { Event } from '../_types/event';
import { Test } from '../_types/test';
interface CalendarProps {
  tasks: Task[];
  events: Event[];
  tests: Test[];
  onDateClick: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
  events: Event[];
  tests: Test[];
}

const Calendar: React.FC<CalendarProps> = ({ tasks, events, tests, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  useEffect(() => {
    const days = generateCalendarDays(currentDate);
    setCalendarDays(days);
  }, [currentDate, tasks, events, tests]);

  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Get the last day of the previous month
    const lastDayOfPrevMonth = new Date(year, month, 0);
    const daysInPrevMonth = lastDayOfPrevMonth.getDate();
    
    const days: CalendarDay[] = [];
    
    // Add days from the previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = daysInPrevMonth - startingDayOfWeek + i + 1;
      const prevDate = new Date(year, month - 1, prevMonthDay);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        tasks: getTasksForDate(tasks, prevDate),
        events: getEventsForDate(events, prevDate),
        tests: getTestsForDate(tests, prevDate),
      });
    }
    
    // Add days from the current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        tasks: getTasksForDate(tasks, currentDate),
        events: getEventsForDate(events, currentDate),
        tests: getTestsForDate(tests, currentDate),
      });
    }
    
    // Calculate how many days from the next month to show
    const remainingSlots = 42 - days.length; // 6 rows * 7 days = 42
    
    // Add days from the next month
    for (let i = 1; i <= remainingSlots; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        tasks: getTasksForDate(tasks, nextDate),
        events: getEventsForDate(events, nextDate),
        tests: getTestsForDate(tests, nextDate),
      });
    }
    
    return days;
  };

  const getTasksForDate = (tasks: Task[], date: Date): Task[] => {
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  const getEventsForDate = (events: Event[], date: Date): Event[] => {
    return events.filter(event => {
      const eventDate = new Date(event.date_time);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const getTestsForDate = (tests: Test[], date: Date): Test[] => {
    return tests.filter(test => {
      const testDate = new Date(test.test_date);
      return (
        testDate.getFullYear() === date.getFullYear() &&
        testDate.getMonth() === date.getMonth() &&
        testDate.getDate() === date.getDate()
      );
    });
  };

  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
  };

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
          >
            今日
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center font-medium py-2 border-b"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => (
          <div
            key={index}
            onClick={() => onDateClick(day.date)}
            className={`min-h-24 p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 ${
              !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
            } ${
              day.date.toDateString() === new Date().toDateString()
                ? 'bg-blue-50 border-blue-200'
                : ''
            }`}
          >
            <div className="text-right text-sm mb-1">{day.date.getDate()}</div>

            <div className="space-y-1 text-xs">
              {day.tasks.length > 0 && (
                <div className="bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate">
                  課題: {day.tasks.length}件
                </div>
              )}
              {day.events.length > 0 && (
                <div className="bg-green-100 text-green-800 rounded px-1 py-0.5 truncate">
                  イベント: {day.events.length}件
                </div>
              )}
              {day.tests.length > 0 && (
                <div className="bg-red-100 text-red-800 rounded px-1 py-0.5 truncate">
                  テスト: {day.tests.length}件
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;