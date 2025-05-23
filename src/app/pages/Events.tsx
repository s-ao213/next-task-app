"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { Event } from '../_types/event';
import EventForm from '../_components/EventForm';
import { format } from 'date-fns';
import { Loader2, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import Button from '../_components/Button';

const Events: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sortOrder, setSortOrder] = useState<'date_time' | 'title'>('date_time');
  const [filter, setFilter] = useState({
    title: '',
    venue: '',
    isImportant: false,
  });
  
  // 編集・削除関連の状態
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Events.tsxのfetchEventsを最適化
  const fetchEvents = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      
      // 直接eventsテーブルを使用
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .gte('date_time', new Date().toISOString())
        .or(`assigned_to.cs.{${userId}},is_for_all.eq.true`)
        .order('date_time', { ascending: true });

      if (error) throw error;

      setEvents(eventsData || []);
      setFilteredEvents(eventsData || []);
    } catch (error) {
      console.error('イベント取得エラー:', error);
      setError('イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // リアルタイム更新の実装
  useEffect(() => {
    const channel = supabase
      .channel('events_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, () => {
        if (user) {
          fetchEvents(user.id);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchEvents, user]);

  // リアルタイムサブスクリプションを最適化
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('events_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `assigned_to=cs.{${user.id}}`  // フィルターを追加
      }, () => {
        fetchEvents(user.id);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchEvents]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          // ユーザー情報取得後にイベントを取得
          await fetchEvents(user.id);
        }
      } catch (error) {
        console.error('初期化エラー:', error);
      }
    };
    
    initializeData();
  }, [fetchEvents]);

  // メモ化されたフィルタリング関数
  const filteredEventsMemo = useMemo(() => {
    return events.filter(event => {
      const matchesTitle = !filter.title || 
        event.title.toLowerCase().includes(filter.title.toLowerCase());
      const matchesVenue = !filter.venue || 
        event.venue.toLowerCase().includes(filter.venue.toLowerCase());
      const matchesImportant = !filter.isImportant || event.is_important;
      
      return matchesTitle && matchesVenue && matchesImportant;
    }).sort((a, b) => {
      if (sortOrder === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
    });
  }, [events, filter, sortOrder]);

  useEffect(() => {
    setFilteredEvents(filteredEventsMemo);
  }, [filteredEventsMemo]);

  const handleFilterChange = (filterName: string, value: string | boolean) => {
    setFilter(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as 'date_time' | 'title');
  };

  // handleFormSuccessの修正
  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedEvent(null);
    setIsEditing(false);
    if (user) {
      fetchEvents(user.id);  // ユーザーIDを渡す
    }
  };

  // 編集ボタンがクリックされた時のハンドラー
  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setShowForm(true);
    // ページの上部にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // イベント削除ボタンのクリックハンドラー
  const handleDeleteClick = (eventId: string) => {
    if (!eventId) return;
    console.log('削除ボタンがクリックされたイベントID:', eventId);
    setDeleteConfirmId(eventId);
  };

  // handleDeleteConfirmの修正
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    
    try {
      setDeleteLoading(true);
      console.log('削除するイベントID:', deleteConfirmId);

      // 物理削除の実行
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) {
        console.error('削除エラー:', error);
        throw error;
      }

      // UIの更新
      setEvents(prevEvents => prevEvents.filter(event => event.id !== deleteConfirmId));
      setFilteredEvents(prevFiltered => prevFiltered.filter(event => event.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      
      // 成功メッセージ
      alert('イベントを削除しました');

    } catch (error) {
      console.error('イベント削除エラー:', error);
      alert('イベントの削除に失敗しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  // フォーム表示/非表示の切り替え
  const handleAddNewClick = () => {
    if (showForm && isEditing) {
      // 編集中の場合は新規追加モードに切り替え
      setSelectedEvent(null);
      setIsEditing(false);
    } else {
      // フォームの表示/非表示を切り替え
      setSelectedEvent(null);
      setIsEditing(false);
      setShowForm(!showForm);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">イベント・行事</h1>
        <Button
          onClick={handleAddNewClick}
          variant={showForm ? "secondary" : "primary"}
          className="w-full sm:w-auto"
        >
          {showForm && !isEditing ? '閉じる' : isEditing ? '新規追加に切替' : '新しいイベントを追加'}
        </Button>
      </div>
      
      {showForm && (
        <div className="mb-6">
          <EventForm 
            onSubmit={handleFormSuccess} 
            initialEvent={isEditing ? (selectedEvent ?? undefined) : undefined}
            isEditing={isEditing}
          />
        </div>
      )}
      
      {/* 削除確認モーダル */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle className="mr-2" />
              <h3 className="text-lg font-bold">イベントを削除しますか？</h3>
            </div>
            <p className="text-gray-600 mb-6">
              このイベントを削除すると、関連する全ての情報が完全に削除されます。この操作は元に戻せません。
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4"
              >
                キャンセル
              </Button>
              <Button 
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    削除中...
                  </>
                ) : '削除する'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* フィルターフォームの部分を修正 */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="filter-title" className="block text-sm font-medium text-gray-700 mb-1">
              イベント名でフィルター
            </label>
            <input
              id="filter-title"  // idを追加
              type="text"
              value={filter.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="イベント名を入力"
            />
          </div>
          
          <div className="flex-1">
            <label htmlFor="filter-venue" className="block text-sm font-medium text-gray-700 mb-1">
              会場でフィルター
            </label>
            <input
              id="filter-venue"  // idを追加
              type="text"
              value={filter.venue}
              onChange={(e) => handleFilterChange('venue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="会場名を入力"
            />
          </div>
          
          <div className="flex-1">
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
              並び替え
            </label>
            <select
              id="sort-order"  // idを追加
              value={sortOrder}
              onChange={handleSortChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="date_time">日時順</option>
              <option value="title">イベント名順</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <label htmlFor="filter-important" className="flex items-center">
              <input
                id="filter-important"
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
      
      {error ? (
        <div className="text-center py-8 text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin mx-auto mb-2" />
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
              
              <div className="mt-4 border-t pt-3 flex justify-between">
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditClick(event)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="編集"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => event.id && handleDeleteClick(event.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="削除"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                {/* 通知設定のボタンも追加できます（実装は後回し） */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
