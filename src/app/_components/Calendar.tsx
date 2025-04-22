// src/app/_components/Calendar.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Task } from '../_types/task';
import { Event } from '../_types/event';
import { Test } from '../_types/test';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BookOpen, PartyPopper, ClipboardList } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };

    // Set initial view mode
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const isTodayDate = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

return (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
    {/* カレンダーのヘッダー部分 */}
    <div className="p-4 bg-white border-b border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-4 sm:mb-0">
          <h2 className="text-xl font-bold">
            {new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(currentDate)}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-4 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-200"
          >
            今日
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="bg-white border border-gray-200 rounded-md flex">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 border-r border-gray-200"
              aria-label="前月"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100"
              aria-label="次月"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* 3. 曜日ヘッダーの改善（約120行目付近） */}
    <div className="grid grid-cols-7 bg-white border-b border-gray-200">
      {weekdays.map((day, index) => (
        <div
          key={day}
          className={`
            text-center font-medium py-2 border-r last:border-r-0 border-gray-200
            ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'}
          `}
        >
          {day}
        </div>
      ))}
    </div>

    {/* 4. カレンダー日付グリッドの改善（約140行目付近） */}
    <div className="grid grid-cols-7 border-l border-t border-gray-200">
      {calendarDays.map((day, index) => {
        const isToday = isTodayDate(day.date);
        const hasItems = day.tasks.length > 0 || day.events.length > 0 || day.tests.length > 0;
        
        return (
          <div
            key={index}
            onClick={() => onDateClick(day.date)}
            className={`
              border-r border-b border-gray-200
              ${viewMode === 'mobile' ? 'h-16' : 'min-h-32'}
              relative transition-all duration-200 cursor-pointer
              ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'hover:bg-blue-50'}
              ${isToday ? 'bg-blue-50' : 'bg-white'}
            `}
          >
            {/* 日付の表示部分 */}
            <div className={`
              p-1 md:p-2 flex justify-between items-start
            `}>
              <span className={`
                inline-flex items-center justify-center
                ${isToday ? 'h-7 w-7 bg-blue-500 text-white rounded-full' : ''}
              `}>
                {day.date.getDate()}
              </span>
              {hasItems && (
                <span className="flex space-x-1">
                  {day.tasks.length > 0 && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" title={`${day.tasks.length}件の課題`}></span>
                  )}
                  {day.events.length > 0 && (
                    <span className="h-2 w-2 rounded-full bg-green-500" title={`${day.events.length}件のイベント`}></span>
                  )}
                  {day.tests.length > 0 && (
                    <span className="h-2 w-2 rounded-full bg-red-500" title={`${day.tests.length}件のテスト`}></span>
                  )}
                </span>
              )}
            </div>

            {/* イベントのミニプレビューを表示（デスクトップ表示時のみ） */}
            {viewMode === 'desktop' && (
              <div className="px-1 text-xs space-y-1 overflow-hidden max-h-24">
                {day.tasks.slice(0, 1).map(task => (
                  <div key={task.id} className="bg-blue-100 text-blue-800 p-1 rounded truncate">
                    {task.title}
                  </div>
                ))}
                {day.events.slice(0, 1).map(event => (
                  <div key={event.id} className="bg-green-100 text-green-800 p-1 rounded truncate">
                    {event.title}
                  </div>
                ))}
                {day.tests.slice(0, 1).map(test => (
                  <div key={test.id} className="bg-red-100 text-red-800 p-1 rounded truncate">
                    {test.subject}
                  </div>
                ))}
                {(day.tasks.length + day.events.length + day.tests.length) > 3 && (
                  <div className="text-gray-500 text-center">+{(day.tasks.length + day.events.length + day.tests.length) - 3}件</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
};

export default Calendar;