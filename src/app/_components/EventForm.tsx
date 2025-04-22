"use client";
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Button from './Button';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface EventFormProps {
  onSuccess: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
// formDataの初期化
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    date_time: '',         // dateTime → date_time
    duration: '',
    assigned_to: [] as string[],
    description: '',
    items: '',
    is_important: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from('users').select('id, name, email');
        if (error) throw error;
        if (data) setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleUserSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, assigned_to: selectedOptions });  // assignedTo → assigned_to
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const eventId = uuidv4();
      const newEvent = {
        id: eventId,
        ...formData,
        created_by: user.id,        // createdBy → created_by
        created_at: new Date().toISOString()  // createdAt → created_at
      };

      if (newEvent.assigned_to.length === 0) {  // assignedTo → assigned_to
        newEvent.assigned_to = users.map(u => u.id);  // assignedTo → assigned_to
      }
      
      const { error } = await supabase.from('events').insert([newEvent]);
      
      if (error) throw error;
      
      onSuccess();
      setFormData({
        title: '',
        venue: '',
        date_time: '',
        duration: '',
        assigned_to: [],  // assignedTo → assigned_to
        description: '',
        items: '',
        is_important: false,  // isImportant → is_important
      });
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">新しいイベントを追加</h2>
      
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          イベント名 *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
          会場 *
        </label>
        <input
          type="text"
          id="venue"
          name="venue"
          value={formData.venue}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
      <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-1">
          日時（集合時刻） *
        </label>
        <input
          type="datetime-local"
          id="date_time"         // dateTime → date_time
          name="date_time"       // dateTime → date_time
          value={formData.date_time}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
          所要時間
        </label>
        <input
          type="text"
          id="duration"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          placeholder="例: 2時間"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
          メンバー（未選択の場合は全員）
        </label>
        <select
          id="assignedTo"
          name="assigned_to"  // assignedTo → assigned_to
          multiple
          value={formData.assigned_to}  // assignedTo → assigned_to
          onChange={handleUserSelection}
          className="..."
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          イベント概要
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="items" className="block text-sm font-medium text-gray-700 mb-1">
          持ち物・服装
        </label>
        <textarea
          id="items"
          name="items"
          value={formData.items}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isImportant"
            checked={formData.is_important}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600"
          />
          <span className="ml-2 text-sm text-gray-700">重要</span>
        </label>
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? '送信中...' : 'イベントを追加'}
      </Button>
    </form>
  );
};

export default EventForm;