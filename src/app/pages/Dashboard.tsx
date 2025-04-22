"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Dashboard from '../_components/Dashboard';
import { Task } from '../_types/task';
import { Event } from '../_types/event';
import { Test } from '../_types/test';
import { Loader2, AlertCircle, Calendar } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 並列で3つのデータを取得して効率化
      const [tasksResponse, eventsResponse, testsResponse] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('events').select('*'),
        supabase.from('tests').select('*')
      ]);
      
      // エラーチェック
      if (tasksResponse.error) throw new Error(`課題の取得に失敗: ${tasksResponse.error.message}`);
      if (eventsResponse.error) throw new Error(`イベントの取得に失敗: ${eventsResponse.error.message}`);
      if (testsResponse.error) throw new Error(`テストの取得に失敗: ${testsResponse.error.message}`);
      
      // データ設定
      setTasks(tasksResponse.data || []);
      setEvents(eventsResponse.data || []);
      setTests(testsResponse.data || []);
      
      // タスク状態の取得
      const { data: statusData, error: statusError } = await supabase
        .from('user_task_status')
        .select('*')
        .eq('user_id', user.id);
        
      if (statusError) throw new Error(`タスク状態の取得に失敗: ${statusError.message}`);
      
      // タスク状態を設定
      const statuses: {[key: string]: boolean} = {};
      if (statusData) {
        statusData.forEach((status) => {
          statuses[status.task_id] = status.is_completed;
        });
      }
      
      setTaskStatuses(statuses);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('データ取得エラー:', error);
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, isCompleted: boolean) => {
    if (!user) return;
    
    try {
      // ローカル状態を先に更新して即時反映
      setTaskStatuses(prev => ({
        ...prev,
        [taskId]: isCompleted
      }));
      
      // データベース更新をチェック
      const { data, error } = await supabase
        .from('user_task_status')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 は "not found" エラーコード
        throw error;
      }
      
      // 存在すれば更新、なければ新規作成
      if (data) {
        await supabase
          .from('user_task_status')
          .update({ is_completed: isCompleted })
          .eq('user_id', user.id)
          .eq('task_id', taskId);
      } else {
        await supabase
          .from('user_task_status')
          .insert([
            { user_id: user.id, task_id: taskId, is_completed: isCompleted }
          ]);
      }
      
    } catch (error) {
      console.error('タスク状態の更新エラー:', error);
      // エラー時に元の状態に戻す
      setTaskStatuses(prev => ({
        ...prev,
        [taskId]: !isCompleted
      }));
      setError('タスク状態の更新に失敗しました。後でもう一度お試しください。');
    }
  };

  // 日付フォーマット用関数
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800">ダッシュボード</h1>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : '更新'}
          </button>
        </div>
        {lastUpdated && (
          <p className="text-sm text-gray-500 flex items-center">
            <Calendar size={14} className="mr-1" />
            最終更新: {formatDateTime(lastUpdated)}
          </p>
        )}
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <p className="font-medium">エラーが発生しました</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Loader2 size={36} className="animate-spin mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600">データを読み込んでいます...</p>
        </div>
      ) : user ? (
        <Dashboard
          tasks={tasks}
          events={events}
          tests={tests}
          userId={user.id}
          taskStatuses={taskStatuses}
          onTaskStatusChange={handleTaskStatusChange}
        />
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-xl font-medium text-gray-800 mb-2">ログインしてください</p>
          <p className="text-gray-500">ダッシュボードを表示するにはログインが必要です</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;