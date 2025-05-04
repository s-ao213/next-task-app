"use client";
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Calendar, Check, X, MapPin, Clock, Award } from 'lucide-react';
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
  const [, setAssignedUser] = useState<{ id: string, name: string } | null>(
    initialEvent?.assigned_user_name ? {
      id: initialEvent.assigned_user_name,
      name: initialEvent.assigned_user_name || '指定ユーザー'
    } : null
  );
  const [, setStudentIdError] = useState('');

  // 選択されたユーザーの配列を管理
  const [assignedUsers, setAssignedUsers] = useState<Array<{ id: string, name: string }>>(
    initialEvent?.assigned_user_id || []
  );

  // 出席番号からユーザーを検索

  // ユーザー追加処理
  const handleAddUser = async () => {
    if (!studentId.trim()) {
      setStudentIdError('出席番号を入力してください');
      return;
    }

    try {
      const result = await getUserByStudentId(studentId);
      if (result.error) {
        setStudentIdError(result.error.message);
        return;
      }

      if (result.user) {
        // 既に追加済みのユーザーでないか確認
        if (!assignedUsers.some(u => u.id === result.user.id)) {
          setAssignedUsers([...assignedUsers, {
            id: result.user.id,
            name: result.user.name
          }]);
        }
        setStudentId(''); // 入力フィールドをクリア
      }
    } catch (error) {
      setStudentIdError(error instanceof Error ? error.message : 'ユーザーの検索中にエラーが発生しました');
    }
  };

  // ユーザー削除処理
  const removeUser = (userId: string) => {
    setAssignedUsers(assignedUsers.filter(user => user.id !== userId));
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
        assigned_user_id: Array<{ id: string, name: string }> | null;
        created_at?: string;
      };

      const eventData: EventData = {
        title: title.trim(),
        venue: venue.trim() || '未設定', 
        duration: duration.trim() || null,
        date_time: dateTime.toISOString(),
        description: description.trim() || null,
        items: items.trim() || null, 
        is_important: isImportant,
        created_by: user?.id,
        is_for_all: assignType === 'all',
        assigned_to: assignType === 'specific' 
          ? assignedUsers.map(user => user.id)
          : [],
        assigned_user_id: null
      };

      // デバッグ用にコンソールログを追加
      console.log('保存するイベントデータ:', eventData);

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

      if (result.error) {
        console.error('保存エラー詳細:', result.error);
        throw new Error(`保存に失敗しました: ${result.error.message || JSON.stringify(result.error)}`);
      }
      
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
      setError(err instanceof Error ? err.message : `イベントの保存中にエラーが発生しました: ${JSON.stringify(err)}`);
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="出席番号を入力"
                    className="w-full pl-10 pr-3 py-2 border rounded-md"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddUser}
                  size="sm"
                >
                  追加
                </Button>
              </div>

              {/* 選択されたユーザー一覧 */}
              {assignedUsers.length > 0 && (
                <div className="mt-2 space-y-2">
                  {assignedUsers.map(user => (
                    <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() => removeUser(user.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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