"use client";
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Calendar, Users, Search, Check, X, MapPin, Clock, Award } from 'lucide-react';
import { ja } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Event } from '../_types/event';

// 日本語ロケールを登録
registerLocale('ja', ja);

// 拡張インターフェース
interface FormEvent extends Event {
  assigned_user_name?: string;
  assigned_student_id?: string;
}

interface EventFormProps {
  onSubmit: () => void;
  initialEvent?: FormEvent;
  isEditing?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, initialEvent, isEditing = false }): JSX.Element => {
  const { user, getUserByStudentId } = useAuth();
  
  // フォーム状態
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
  
  // 割り当て関連の状態
  const [assignType, setAssignType] = useState<'all' | 'specific'>(
    initialEvent?.assigned_user_name ? 'specific' : 'all'
  );
  const [studentId, setStudentId] = useState('');
  const [assignedUser, setAssignedUser] = useState<{ id: string, name: string } | null>(
    initialEvent?.assigned_user_name ? {
      id: initialEvent.assigned_user_name,
      name: initialEvent.assigned_user_name || '指定ユーザー'
    } : null
  );
  const [studentIdError, setStudentIdError] = useState('');
  
  // 出席番号からユーザーを検索
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
      // 必須項目のみバリデーション
      if (!title.trim()) {
        throw new Error('タイトルを入力してください');
      }

      // 場所は必須ではなく任意に変更
      // if (!venue.trim()) {
      //   throw new Error('場所を入力してください');
      // }

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
        venue: venue.trim() || '未設定', // 場所が空の場合はデフォルト値
        duration: duration.trim() || null, // 任意
        date_time: dateTime.toISOString(),
        description: description.trim() || null, // 任意
        items: items.trim() || null, // 任意
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
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
      {/* フォームヘッダー */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-purple-700 flex items-center">
          <Award className="mr-2 h-6 w-6" />
          {isEditing ? 'イベントを編集' : '新しいイベントを作成'}
        </h2>
      </div>

      {/* アラートメッセージ */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <div className="text-red-500 mr-3">
            <X className="h-5 w-5" />
          </div>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start">
          <div className="text-green-500 mr-3">
            <Check className="h-5 w-5" />
          </div>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      
      {/* フォームグリッド - メインフィールド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* イベントタイトル */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            イベントタイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="focus:ring-purple-500 focus:border-purple-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
            placeholder="イベント名を入力"
            required
          />
        </div>
        
        
        {/* 場所 */}
        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
            場所 <span className="text-gray-400 text-xs">(任意)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
              placeholder="会場・場所を入力"
            />
          </div>
        </div>
        
        {/* 日時 */}
        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-1">
            日時 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
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
              className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
              placeholderText="日時を選択"
              required
            />
          </div>
        </div>
        
        {/* 所要時間 */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            所要時間 <span className="text-gray-400 text-xs">(任意)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
              placeholder="例：1時間30分"
            />
          </div>
        </div>
      </div>
      
      {/* 詳細情報エリア */}
      <div className="space-y-6 mb-6">
        {/* 詳細 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            詳細 <span className="text-gray-400 text-xs">(任意)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="focus:ring-purple-500 focus:border-purple-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
            placeholder="イベントの詳細な説明"
          />
        </div>
        
        {/* 持ち物 */}
        <div>
          <label htmlFor="items" className="block text-sm font-medium text-gray-700 mb-1">
            持ち物・服装等 <span className="text-gray-400 text-xs">(任意)</span>
          </label>
          <textarea
            id="items"
            value={items}
            onChange={(e) => setItems(e.target.value)}
            rows={3}
            className="focus:ring-purple-500 focus:border-purple-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
            placeholder="持ち物や服装の指定があれば入力"
          />
        </div>
      </div>

      {/* 重要マーク */}
      <div className="mb-6">
        <div className="flex items-center">
          <input
            id="isImportant"
            type="checkbox"
            checked={isImportant}
            onChange={(e) => setIsImportant(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="isImportant" className="ml-2 block text-sm text-gray-900">
            重要なイベントとしてマーク
          </label>
        </div>
      </div>
      
      {/* 割り当てセクション */}
      <div className="p-4 bg-gray-50 rounded-md mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-3">参加者設定</h3>
        
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <label className="flex items-center">
            <input
              type="radio"
              checked={assignType === 'all'}
              onChange={() => {
                setAssignType('all');
                setAssignedUser(null);
                setStudentId('');
              }}
              className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">全員</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              checked={assignType === 'specific'}
              onChange={() => setAssignType('specific')}
              className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">特定のユーザー</span>
          </label>
        </div>
        
        {assignType === 'specific' && (
          <div className="pl-2 border-l-2 border-purple-200 mt-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="出席番号を入力"
                  className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
                />
              </div>
              
              <Button
                type="button"
                onClick={handleStudentIdSearch}
                disabled={isSubmitting}
                className="whitespace-nowrap"
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-1" />
                )}
                <span>検索</span>
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
                    className="text-gray-500 hover:text-red-500 p-1"
                    title="選択を解除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 送信ボタン */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="min-w-[150px]"
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