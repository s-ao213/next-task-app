"use client";
import React, { useState, useEffect } from 'react';
import TaskForm from '../_components/TaskForm';
import TaskItem from '../_components/TaskItem';
import { Task, UserTaskStatus } from '../_types/task';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Filter from '../_components/Filter';
import { ClipboardList, ClipboardX, Loader2, Calendar } from 'lucide-react';
import Button from '../_components/Button';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTaskStatuses, setUserTaskStatuses] = useState<UserTaskStatus[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // フィルター状態
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [completionFilter, setCompletionFilter] = useState<string[]>([]);
  const [importantFilter, setImportantFilter] = useState<string[]>([]);
  const [showExpired, setShowExpired] = useState<boolean>(false); // 期限切れの課題を表示するかどうかのフラグ

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // 現在の日付を取得
      const now = new Date();
      
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
  };

  // 期限切れの課題表示設定を切り替え
  const toggleExpiredTasks = () => {
    setShowExpired(!showExpired);
  };

  // useEffectで期限切れ表示設定が変わったときにタスクを再取得
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [showExpired]);

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

  const filteredTasks = tasks.filter(task => {
    // 教科フィルターの適用
    if (subjectFilter.length > 0 && !subjectFilter.includes(task.subject)) {
      return false;
    }
    
    // 完了状態フィルターの適用
    if (completionFilter.length > 0) {
      const isCompleted = isTaskCompleted(task.id);
      if (completionFilter.includes('completed') && !isCompleted) {
        return false;
      }
      if (completionFilter.includes('uncompleted') && isCompleted) {
        return false;
      }
    }
    
    // 重要フィルターの適用
    if (importantFilter.length > 0 && importantFilter.includes('important') && !task.is_important) {
      return false;
    }
    
    return true;
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
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "secondary" : "primary"}
            className="w-full sm:w-auto"
          >
            {showForm ? '閉じる' : '課題を追加'}
          </Button>
        </div>
      </header>
      
      {showForm && (
        <div className="mb-6">
          <TaskForm onSubmit={() => { 
              fetchTasks();
            setShowForm(false);
          }} />
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
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={isTaskCompleted(task.id)}
                  userId={user?.id || ''}
                  onStatusChange={handleTaskStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;