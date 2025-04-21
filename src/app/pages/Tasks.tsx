"use client";
import React, { useState, useEffect } from 'react';
import Layout from '../_components/Layout';
import TaskForm from '../_components/TaskForm';
import TaskItem from '../_components/TaskItem';
import { Task, UserTaskStatus } from '../_types/task';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Filter from '../_components/Filter';

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

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch tasks assigned to the user
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .filter('assignedTo', 'cs', `{"${user.id}"}`)
        .order('deadline', { ascending: true });
      
      if (tasksError) throw tasksError;
      
      // Fetch user's task completion status
      const { data: statusData, error: statusError } = await supabase
        .from('user_task_status')
        .select('*')
        .eq('userId', user.id);
      
      if (statusError) throw statusError;
      
      setTasks(tasksData || []);
      setUserTaskStatuses(statusData || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskStatusChange = (taskId: string, isCompleted: boolean) => {
    setUserTaskStatuses(prev => {
      const existingIndex = prev.findIndex(
        status => status.userId === user?.id && status.taskId === taskId
      );
      
      if (existingIndex >= 0) {
        // Update existing status
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isCompleted
        };
        return updated;
      } else {
        // Add new status
        return [
          ...prev,
          {
            userId: user?.id || '',
            taskId,
            isCompleted
          }
        ];
      }
    });
  };

  const isTaskCompleted = (taskId: string): boolean => {
    const status = userTaskStatuses.find(
      status => status.userId === user?.id && status.taskId === taskId
    );
    return status ? status.isCompleted : false;
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
    if (importantFilter.length > 0 && importantFilter.includes('important') && !task.isImportant) {
      return false;
    }
    
    return true;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">課題一覧</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {showForm ? '閉じる' : '課題を追加'}
          </button>
        </div>
        
        {showForm && (
          <div className="mb-6">
            <TaskForm onSuccess={() => {
              fetchTasks();
              setShowForm(false);
            }} />
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">フィルター</h2>
          <div className="space-y-4">
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
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>読み込み中...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">条件に一致する課題はありません</p>
          </div>
        ) : (
          <div className="mt-6">
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
    </Layout>
  );
};

export default Tasks;