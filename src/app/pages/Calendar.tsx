// src/app/pages/Calendar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Calendar from '../_components/Calendar';
import { Task } from '../_types/task';
import { Event } from '../_types/event';
import { Test } from '../_types/test';
import { format } from 'date-fns';
import { X, BookOpen, PartyPopper, ClipboardList, Calendar as CalendarIcon, Loader2, Clock, MapPin, User } from 'lucide-react';

const CalendarPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateItems, setSelectedDateItems] = useState<{
    tasks: Task[];
    events: Event[];
    tests: Test[];
  }>({
    tasks: [],
    events: [],
    tests: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      updateSelectedDateItems();
    }
  }, [selectedDate, tasks, events, tests]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');
      
      if (tasksError) throw tasksError;
      if (tasksData) setTasks(tasksData);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*');
      
      if (eventsError) throw eventsError;
      if (eventsData) setEvents(eventsData);

      // Fetch tests
      const { data: testsData, error: testsError } = await supabase
        .from('tests')
        .select('*');
      
      if (testsError) throw testsError;
      if (testsData) setTests(testsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const updateSelectedDateItems = () => {
    if (!selectedDate) return;

    const tasksForDate = tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return (
        taskDate.getFullYear() === selectedDate.getFullYear() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getDate() === selectedDate.getDate()
      );
    });

    const eventsForDate = events.filter(event => {
      const eventDate = new Date(event.date_time);
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      );
    });

    const testsForDate = tests.filter(test => {
      const testDate = new Date(test.test_date);
      return (
        testDate.getFullYear() === selectedDate.getFullYear() &&
        testDate.getMonth() === selectedDate.getMonth() &&
        testDate.getDate() === selectedDate.getDate()
      );
    });

    setSelectedDateItems({
      tasks: tasksForDate,
      events: eventsForDate,
      tests: testsForDate,
    });
  };

  const closeDetailView = () => {
    setSelectedDate(null);
  };

  const getWeekdayName = (date: Date) => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <CalendarIcon className="h-7 w-7 text-blue-600 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold">カレンダー</h1>
      </div>
        
      {loading ? (
        <div className="text-center py-16 flex flex-col items-center bg-white rounded-lg shadow-lg">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 text-lg">カレンダーを読み込み中...</p>
        </div>
      ) : (
        <div>
          {/* カレンダーコンポーネント - 表形式のグリッドに改善されたもの */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <Calendar 
              tasks={tasks} 
              events={events} 
              tests={tests} 
              onDateClick={handleDateClick} 
            />
          </div>
          
          {/* 選択された日の詳細表示 */}
          {selectedDate && (
            <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 border border-gray-200">
              {/* 選択日ヘッダー - 改善されたデザイン */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-white text-blue-600 h-10 w-10 rounded-full flex items-center justify-center mr-3 shadow-md">
                    <span className="font-bold">{selectedDate.getDate()}</span>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">
                      {format(selectedDate, 'yyyy年MM月dd日')} ({getWeekdayName(selectedDate)})
                    </h2>
                    <p className="text-blue-100 mt-1">
                      {selectedDateItems.tasks.length + selectedDateItems.events.length + selectedDateItems.tests.length} 件の予定
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeDetailView}
                  className="text-white hover:bg-blue-700 p-2 rounded-full transition-colors duration-200"
                  aria-label="閉じる"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* 選択日のコンテンツ */}
              <div className="p-4 md:p-6">
                {selectedDateItems.tasks.length === 0 && 
                selectedDateItems.events.length === 0 && 
                selectedDateItems.tests.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-600 mb-2">予定はありません</p>
                    <p className="text-sm text-gray-500">この日に予定を追加してください</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* 課題の表示 */}
                    {selectedDateItems.tasks.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg text-blue-600 mb-4 flex items-center border-b pb-2">
                          <BookOpen className="mr-2 h-5 w-5" /> 課題 ({selectedDateItems.tasks.length})
                        </h3>
                        <ul className="space-y-3">
                          {selectedDateItems.tasks.map(task => (
                            <li key={task.id} className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 border border-blue-100">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-blue-800 text-lg">{task.title}</p>
                                  <p className="text-sm text-blue-600 mt-1">{task.subject}</p>
                                  {task.description && <p className="text-sm text-gray-600 mt-2">{task.description}</p>}
                                  <div className="flex items-center mt-2 text-sm text-gray-600">
                                    <span className="flex items-center mr-4">
                                      <Clock size={14} className="mr-1" /> 
                                      {format(new Date(task.deadline), 'HH:mm')}
                                    </span>
                                    <span className="flex items-center">
                                      <span className="mr-1">提出方法:</span> {task.submission_method}
                                    </span>
                                  </div>
                                </div>
                                {task.is_important && (
                                  <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium">重要</span>
                                )}
                              </div>
                              <div className="mt-3 pt-2 border-t border-blue-100">
                                <a href={`/tasks?id=${task.id}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                                  詳細を見る
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* イベントの表示 */}
                    {selectedDateItems.events.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg text-green-600 mb-4 flex items-center border-b pb-2">
                          <PartyPopper className="mr-2 h-5 w-5" /> イベント ({selectedDateItems.events.length})
                        </h3>
                        <ul className="space-y-3">
                          {selectedDateItems.events.map(event => (
                            <li key={event.id} className="bg-gradient-to-r from-green-50 to-white p-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 border border-green-100">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-green-800 text-lg">{event.title}</p>
                                  <div className="flex flex-wrap gap-y-2 mt-2">
                                    <div className="flex items-center mr-4 text-sm text-gray-600">
                                      <Clock size={14} className="mr-1" /> 
                                      {format(new Date(event.date_time), 'HH:mm')}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                      <MapPin size={14} className="mr-1" /> 
                                      {event.venue}
                                    </div>
                                  </div>
                                  {event.duration && (
                                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                                      <span className="mr-1">所要時間:</span> {event.duration}
                                    </p>
                                  )}
                                  {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
                                </div>
                                {event.is_important && (
                                  <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium">重要</span>
                                )}
                              </div>
                              <div className="mt-3 pt-2 border-t border-green-100">
                                <a href={`/events?id=${event.id}`} className="text-sm text-green-600 hover:text-green-800 hover:underline flex items-center">
                                  詳細を見る
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* テストの表示 */}
                    {selectedDateItems.tests.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg text-red-600 mb-4 flex items-center border-b pb-2">
                          <ClipboardList className="mr-2 h-5 w-5" /> テスト ({selectedDateItems.tests.length})
                        </h3>
                        <ul className="space-y-3">
                          {selectedDateItems.tests.map(test => (
                            <li key={test.id} className="bg-gradient-to-r from-red-50 to-white p-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 border border-red-100">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-red-800 text-lg">{test.subject}</p>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600 flex items-center">
                                      <span className="font-medium mr-2">範囲:</span> {test.scope}
                                    </p>
                                    {test.teacher && (
                                      <p className="text-sm text-gray-600 flex items-center">
                                        <User size={14} className="mr-1" />
                                        <span className="font-medium mr-2">担当教員:</span> {test.teacher}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {test.is_important && (
                                  <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium">重要</span>
                                )}
                              </div>
                              <div className="mt-3 pt-2 border-t border-red-100">
                                <a href={`/tests?id=${test.id}`} className="text-sm text-red-600 hover:text-red-800 hover:underline flex items-center">
                                  詳細を見る
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;