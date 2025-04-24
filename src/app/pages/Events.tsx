"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Event } from '../_types/event';
import EventForm from '../_components/EventForm';
import { format } from 'date-fns';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sortOrder, setSortOrder] = useState<'date_time' | 'title'>('date_time');
  const [filter, setFilter] = useState({
    title: '',
    venue: '',
    isImportant: false,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filter, sortOrder]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('events').select('*');
      if (error) throw error;
      if (data) setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Apply title filter
    if (filter.title) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(filter.title.toLowerCase())
      );
    }

    // Apply venue filter
    if (filter.venue) {
      filtered = filtered.filter(event => 
        event.venue.toLowerCase().includes(filter.venue.toLowerCase())
      );
    }

    // Apply importance filter
    if (filter.isImportant) {
      filtered = filtered.filter(event => event.is_important);
    }

    // Apply sorting
    if (sortOrder === 'date_time') {
      filtered.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
    } else if (sortOrder === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (filterName: string, value: string | boolean) => {
    setFilter(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as 'date_time' | 'title');
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchEvents();
  };

  return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">イベント・行事</h1>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
          >
            {showForm ? 'フォームを閉じる' : '新しいイベントを追加'}
          </button>
        </div>
        
        {showForm && (
            <div className="mb-6">
              <EventForm onSubmit={handleFormSuccess} />
            </div>
        )}
        
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                イベント名でフィルター
              </label>
              <input
                type="text"
                value={filter.title}
                onChange={(e) => handleFilterChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="イベント名を入力"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会場でフィルター
              </label>
              <input
                type="text"
                value={filter.venue}
                onChange={(e) => handleFilterChange('venue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="会場名を入力"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                並び替え
              </label>
              <select
                value={sortOrder}
                onChange={handleSortChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="date_time">日時順</option>
                <option value="title">イベント名順</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.isImportant}
                  onChange={(e) => handleFilterChange('isImportant', e.target.checked)}
                  className="h-4 w-4 text-green-600"
                />
                <span className="ml-2 text-sm text-gray-700">重要なもののみ表示</span>
              </label>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>読み込み中...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p>イベントはありません</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map(event => (
              <div 
                key={event.id} 
                className={`bg-white p-4 rounded-lg shadow ${event.is_important ? 'border-l-4 border-green-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  {event.is_important && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">重要</span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">会場:</span> {event.venue}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">日時:</span> {format(new Date(event.date_time), 'yyyy/MM/dd HH:mm')}
                </p>
                {event.duration && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">所要時間:</span> {event.duration}
                  </p>
                )}
                {event.description && (
                  <div className="mb-2">
                    <p className="font-medium text-gray-700">概要:</p>
                    <p className="text-gray-600 text-sm">{event.description}</p>
                  </div>
                )}
                {event.items && (
                  <div className="mb-2">
                    <p className="font-medium text-gray-700">持ち物・服装:</p>
                    <p className="text-gray-600 text-sm">{event.items}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  );
};

export default Events;