"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Layout from '../_components/Layout';
import Calendar from '../_components/Calendar';
import { Task } from '../_types/task';
import { Event } from '../_types/event';
import { Test } from '../_types/test';
import { format } from 'date-fns';

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
      const eventDate = new Date(event.dateTime);
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      );
    });

    const testsForDate = tests.filter(test => {
      const testDate = new Date(test.date);
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">カレンダー</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <p>読み込み中...</p>
          </div>
        ) : (
          <div>
            <Calendar 
              tasks={tasks} 
              events={events} 
              tests={tests} 
              onDateClick={handleDateClick} 
            />
            
            {selectedDate && (
              <div className="mt-6 bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {format(selectedDate, 'yyyy年MM月dd日')}の予定
                  </h2>
                  <button 
                    onClick={closeDetailView}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                {selectedDateItems.tasks.length === 0 && 
                 selectedDateItems.events.length === 0 && 
                 selectedDateItems.tests.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">予定はありません</p>
                ) : (
                  <div className="space-y-6">
                    {selectedDateItems.tasks.length > 0 && (
                      <div>
                        <h3 className="font-medium text-blue-600 mb-2">課題</h3>
                        <ul className="space-y-2">
                          {selectedDateItems.tasks.map(task => (
                            <li key={task.id} className="bg-blue-50 p-3 rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{task.subject} - {task.title}</p>
                                  {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                                  <p className="text-sm text-gray-600 mt-1">提出方法: {task.submissionMethod}</p>
                                </div>
                                {task.isImportant && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">重要</span>
                                )}
                              </div>
                              <div className="mt-2">
                                <a href={`/tasks?id=${task.id}`} className="text-sm text-blue-600 hover:underline">詳細を見る</a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedDateItems.events.length > 0 && (
                      <div>
                        <h3 className="font-medium text-green-600 mb-2">イベント</h3>
                        <ul className="space-y-2">
                          {selectedDateItems.events.map(event => (
                            <li key={event.id} className="bg-green-50 p-3 rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-sm text-gray-600 mt-1">会場: {event.venue}</p>
                                  {event.duration && <p className="text-sm text-gray-600">所要時間: {event.duration}</p>}
                                  {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                                </div>
                                {event.isImportant && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">重要</span>
                                )}
                              </div>
                              <div className="mt-2">
                                <a href={`/events?id=${event.id}`} className="text-sm text-green-600 hover:underline">詳細を見る</a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedDateItems.tests.length > 0 && (
                      <div>
                        <h3 className="font-medium text-red-600 mb-2">テスト</h3>
                        <ul className="space-y-2">
                          {selectedDateItems.tests.map(test => (
                            <li key={test.id} className="bg-red-50 p-3 rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{test.subject}</p>
                                  <p className="text-sm text-gray-600 mt-1">範囲: {test.scope}</p>
                                  {test.teacher && <p className="text-sm text-gray-600">担当教員: {test.teacher}</p>}
                                </div>
                                {test.isImportant && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">重要</span>
                                )}
                              </div>
                              <div className="mt-2">
                                <a href={`/tests?id=${test.id}`} className="text-sm text-red-600 hover:underline">詳細を見る</a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CalendarPage;