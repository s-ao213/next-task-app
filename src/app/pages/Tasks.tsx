"use client";
import React, { useState, useEffect, useCallback } from 'react';
import TaskForm from '../_components/TaskForm';
import TaskItem from '../_components/TaskItem';
import { Task, UserTaskStatus } from '../_types/task';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Filter from '../_components/Filter';
import { ClipboardList, ClipboardX, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import Button from '../_components/Button';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTaskStatuses, setUserTaskStatuses] = useState<UserTaskStatus[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 現在の日時をコンポーネントレベルで定義
  const now = new Date();
  
  // フィルター状態
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [completionFilter, setCompletionFilter] = useState<string[]>([]);
  const [importantFilter, setImportantFilter] = useState<string[]>([]);
  const [showExpired, setShowExpired] = useState<boolean>(true); // falseからtrueに変更
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchKeyword] = useState<string>('');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  
  // 編集・削除関連の状態
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // useEffectで期限切れ表示設定が変わったときにタスクを再取得
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [showExpired]);

  // 教科フィルター変更時の処理
  useEffect(() => {
    if (subjectFilter.length === 1) {
      setSelectedSubject(subjectFilter[0]);
    } else {
      setSelectedSubject('');
    }
  }, [subjectFilter]);

  // 完了状態フィルター変更時の処理
  useEffect(() => {
    setHideCompleted(completionFilter.includes('completed'));
  }, [completionFilter]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // 自分に割り振られた課題を取得するクエリ
      let query = supabase
        .from('tasks')
        .select('*')
        .or(`assigned_to.cs.{"${user.id}"}, is_for_all.eq.true`)
        .order('deadline', { ascending: true });
      
      // 期限切れの課題を表示しない場合のフィルター
      if (!showExpired) {
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD形式
        query = query.gte('deadline', today);
      }
      
      const { data: tasksData, error: tasksError } = await query;
      
      if (tasksError) throw tasksError;
      
      // ユーザーのタスク完了状態を取得
      const { data: statusData, error: statusError } = await supabase
        .from('user_task_status')
        .select('*')
        .eq('user_id', user.id);
      
      if (statusError) throw statusError;
      
      setTasks(tasksData || []);
      setUserTaskStatuses(statusData || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, showExpired]);

  // 期限切れの課題表示設定を切り替え
  const toggleExpiredTasks = () => {
    setShowExpired(!showExpired);
  };

  const handleTaskStatusChange = (taskId: string, isCompleted: boolean) => {
    setUserTaskStatuses(prev => {
      const existingIndex = prev.findIndex(
        status => status.user_id === user?.id && status.task_id === taskId
      );
      
      if (existingIndex >= 0) {
        // Update existing status
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          is_completed: isCompleted
        };
        return updated;
      } else {
        // Add new status
        return [
          ...prev,
          {
            user_id: user?.id || '',
            task_id: taskId,
            is_completed: isCompleted
          }
        ];
      }
    });
  };

  const isTaskCompleted = (taskId: string): boolean => {
    const status = userTaskStatuses.find(
      status => status.user_id === user?.id && status.task_id === taskId
    );
    return status ? status.is_completed : false;
  };

  // 教科のフィルターオプションを動的に生成
  const getSubjectOptions = () => {
    const subjectSet: { [key: string]: boolean } = {};
    tasks.forEach(task => {
      subjectSet[task.subject] = true;
    });
    
    return Object.keys(subjectSet).map(subject => ({
      value: subject,
      label: subject
    }));
  };

  // 編集ボタンがクリックされた時のハンドラー
  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditing(true);
    setShowForm(true);
    // ページの上部にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 削除ボタンがクリックされた時のハンドラー
  const handleDeleteClick = (taskId: string) => {
    setDeleteConfirmId(taskId);
  };

  // タスク削除の確認時のハンドラー
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId || !user) return;
    
    try {
      setDeleteLoading(true);

      // カスタム関数を呼び出してタスクとその依存関係を削除
      const { data, error } = await supabase
        .rpc('delete_task_with_dependencies', {
          task_id_param: deleteConfirmId
        });
      
      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
      
      console.log('Delete result:', data);
      
      // UI更新
      setTasks(prev => prev.filter(task => task.id !== deleteConfirmId));
      setUserTaskStatuses(prev => prev.filter(status => status.task_id !== deleteConfirmId));
      setDeleteConfirmId(null);
      
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('タスクの削除に失敗しました。詳細はコンソールを確認してください。');
    } finally {
      setDeleteLoading(false);
    }
  };

  // フォームの表示/非表示と新規/編集モードの切り替え
  const handleAddNewClick = () => {
    if (showForm && isEditing) {
      // 編集中の場合は新規追加モードに切り替え
      setSelectedTask(null);
      setIsEditing(false);
    } else {
      // フォームの表示/非表示を切り替え
      setSelectedTask(null);
      setIsEditing(false);
      setShowForm(!showForm);
    }
  };

  // フォーム送信成功時のコールバック
  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedTask(null);
    setIsEditing(false);
    fetchTasks();
  };

  // ユーザーのタスク状態をマップ形式に変換
  const taskStatuses = userTaskStatuses.reduce((acc, status) => {
    if (status.user_id === user?.id) {
      acc[status.task_id] = status.is_completed;
    }
    return acc;
  }, {} as {[key: string]: boolean});

  // 表示するタスクをフィルタリング - 修正版
  const filteredTasks = tasks.filter(task => {
    // 基本的なフィルタリング（科目、キーワードなど）
    const matchesSubject = !selectedSubject || task.subject === selectedSubject;
    const matchesKeyword = !searchKeyword || 
      task.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchKeyword.toLowerCase()));
    
    // 期限切れタスクの表示設定
    let withinDeadline = true;
    if (!showExpired) {
      // 期限未設定または2099年の場合は期限内とみなす
      if (!task.deadline || task.deadline.startsWith('2099-')) {
        withinDeadline = true;
      } else {
        const deadline = new Date(task.deadline);
        withinDeadline = deadline >= now;
      }
    }
    
    // 完了済みの表示設定
    const completionMatch = !hideCompleted || !taskStatuses[task.id];
    
    return matchesSubject && matchesKeyword && withinDeadline && completionMatch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <ClipboardList className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl md:text-3xl font-bold">課題一覧</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={toggleExpiredTasks}
            variant={showExpired ? "primary" : "secondary"}
            className="w-full sm:w-auto"
          >
            <Calendar className="h-4 w-4 mr-1" />
            {showExpired ? '期限切れを非表示' : '期限切れも表示'}
          </Button>
          
          <Button
            onClick={handleAddNewClick}
            variant={showForm ? "secondary" : "primary"}
            className="w-full sm:w-auto"
          >
            {showForm && !isEditing ? '閉じる' : isEditing ? '新規追加に切替' : '課題を追加'}
          </Button>
        </div>
      </header>
      
      {showForm && (
        <div className="mb-6">
          <TaskForm 
            onSubmit={handleFormSuccess} 
            initialTask={isEditing ? (selectedTask || undefined) : undefined}
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
              <h3 className="text-lg font-bold">課題を削除しますか？</h3>
            </div>
            <p className="text-gray-600 mb-6">
              この課題を削除すると、関連する全ての情報が完全に削除されます。この操作は元に戻せません。
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
        
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <div className="card-header">
              <h2 className="text-xl font-semibold">フィルター</h2>
            </div>
            <div className="card-body space-y-4">
              <Filter
                title="教科"
                options={getSubjectOptions()}
                selectedValues={subjectFilter}
                onChange={setSubjectFilter}
              />
              
              <Filter
                title="完了状態"
                options={[
                  { value: 'completed', label: '完了済み' },
                  { value: 'uncompleted', label: '未完了' }
                ]}
                selectedValues={completionFilter}
                onChange={setCompletionFilter}
              />
              
              <Filter
                title="重要度"
                options={[
                  { value: 'important', label: '重要' }
                ]}
                selectedValues={importantFilter}
                onChange={setImportantFilter}
                multiSelect={false}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="mb-4 text-gray-400">
                <ClipboardX className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-500">条件に一致する課題はありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map(task => (
                <div key={task.id}>
                  <TaskItem
                    task={task}
                    isCompleted={isTaskCompleted(task.id)}
                    userId={user?.id || ''}
                    onStatusChange={handleTaskStatusChange}
                    onEdit={() => handleEditClick(task)}
                    onDelete={() => handleDeleteClick(task.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;