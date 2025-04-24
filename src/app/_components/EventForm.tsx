"use client";
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Calendar, Users, Search, Check, X } from 'lucide-react';
import { ja } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// 日本語ロケールを登録
registerLocale('ja', ja);

interface Event {
  id?: string;
  title: string;
  venue: string;
  duration?: string;
  date_time: string;
  description?: string;
  items?: string;
  assigned_to: string[];
  is_important?: boolean;
  is_for_all?: boolean;
}

interface EventFormProps {
  onSubmit: () => void;
  initialEvent?: Event;
  isEditing?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, initialEvent, isEditing = false }) => {
  const { user, getUserByStudentId } = useAuth();
  
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [venue, setVenue] = useState(initialEvent?.venue || '');
  const [duration, setDuration] = useState(initialEvent?.duration || '');
  const [dateTime, setDateTime] = useState<Date | null>(
    initialEvent?.date_time ? new Date(initialEvent.date_time) : null
  );
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [items, setItems] = useState(initialEvent?.items || '');
  const [isImportant, setIsImportant] = useState(initialEvent?.is_important || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [assignType, setAssignType] = useState<'all' | 'specific'>(
    initialEvent?.is_for_all === false ? 'specific' : 'all'
  );
  const [studentId, setStudentId] = useState('');
  const [assignedUser, setAssignedUser] = useState<{ id: string, name: string } | null>(null);
  const [studentIdError, setStudentIdError] = useState('');

  const handleStudentIdSearch = async () => {
    if (!studentId.trim()) {
      setStudentIdError('出席番号を入力してください');
      return;
    }
    
    setStudentIdError('');
    setIsSubmitting(true);
    
    try {
      const result = await getUserByStudentId(studentId);
      
      if (result.error) {
        setStudentIdError(result.error.message);
        setAssignedUser(null);
        return;
      }
      
      if (result.user) {
        setAssignedUser({
          id: result.user.id,
          name: result.user.name
        });
      }
    } catch {
      setStudentIdError('ユーザーの検索中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAssignedUser = () => {
    setAssignedUser(null);
    setStudentId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (!title.trim()) {
        throw new Error('タイトルを入力してください');
      }

      if (!venue.trim()) {
        throw new Error('場所を入力してください');
      }

      if (!dateTime) {
        throw new Error('日時を選択してください');
      }

      type EventData = {
        title: string;
        venue: string;
        duration: string | null;
        date_time: string;
        description: string | null;
        items: string | null;
        is_important: boolean;
        created_by: string | undefined;
        is_for_all: boolean;
        assigned_to: string[];
        created_at?: string;
      };

      const eventData: EventData = {
        title: title.trim(),
        venue: venue.trim(),
        duration: duration.trim() || null,
        date_time: dateTime.toISOString(),
        description: description.trim() || null,
        items: items.trim() || null,
        is_important: isImportant,
        created_by: user?.id,
        is_for_all: assignType === 'all',
        assigned_to: assignType === 'specific' && assignedUser 
          ? [assignedUser.id]
          : []
      };

      let result;
      if (isEditing && initialEvent?.id) {
        result = await supabase
          .from('events')
          .update(eventData)
          .eq('id', initialEvent.id);
      } else {
        eventData.created_at = new Date().toISOString();
        result = await supabase
          .from('events')
          .insert([eventData]);
      }

      if (result.error) throw result.error;
      
      setSuccess(isEditing ? 'イベントを更新しました' : '新しいイベントを作成しました');
      
      if (!isEditing) {
        setTitle('');
        setVenue('');
        setDuration('');
        setDateTime(null);
        setDescription('');
        setItems('');
        setIsImportant(false);
        setAssignType('all');
        setStudentId('');
        setAssignedUser(null);
      }
      
      onSubmit();
    } catch (err) {
      console.error('イベント保存エラー:', err);
      setError(err instanceof Error ? err.message : 'イベントの保存中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          イベントタイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
          required
        />
      </div>
      
      <div>
        <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
          場所 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-1">
            日時 <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <DatePicker
              selected={dateTime}
              onChange={(date) => setDateTime(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="yyyy/MM/dd HH:mm"
              locale="ja"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholderText="日時を選択"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            所要時間
          </label>
          <input
            type="text"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="例：1時間30分"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          詳細
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
        />
      </div>
      
      <div>
        <label htmlFor="items" className="block text-sm font-medium text-gray-700 mb-1">
          持ち物・服装など
        </label>
        <textarea
          id="items"
          rows={2}
          value={items}
          onChange={(e) => setItems(e.target.value)}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
        />
      </div>
      
      <div className="flex items-center">
        <input
          id="isImportant"
          type="checkbox"
          checked={isImportant}
          onChange={(e) => setIsImportant(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="isImportant" className="ml-2 block text-sm text-gray-900">
          重要なイベントとしてマーク
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          割り当て対象
        </label>
        <div className="flex items-center space-x-4 mb-3">
          <label className="flex items-center">
            <input
              type="radio"
              checked={assignType === 'all'}
              onChange={() => {
                setAssignType('all');
                setAssignedUser(null);
                setStudentId('');
              }}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">全員</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={assignType === 'specific'}
              onChange={() => setAssignType('specific')}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">特定のユーザー</span>
          </label>
        </div>
        
        {assignType === 'specific' && (
          <div className="pl-2 border-l-2 border-gray-200 mt-3">
            <div className="flex items-center mb-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="出席番号を入力"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <Button
                type="button"
                onClick={handleStudentIdSearch}
                disabled={isSubmitting}
                className="ml-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-1">検索</span>
              </Button>
            </div>
            
            {studentIdError && (
              <p className="text-red-500 text-xs mt-1">{studentIdError}</p>
            )}
            
            {assignedUser && (
              <div className="mt-2 p-2 border rounded bg-green-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">選択ユーザー:</span> {assignedUser.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAssignedUser}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="pt-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              保存中...
            </>
          ) : (
            isEditing ? 'イベントを更新' : 'イベントを作成'
          )}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;