"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Layout from '../_components/Layout';
import Dashboard from '../_components/Dashboard';
import { Task } from '../_types/task';
import { Event } from '../_types/event';
import { Test } from '../_types/test';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');
      
      if (tasksError) throw tasksError;
      if (tasksData) setTasks(tasksData);
      
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*');
      
      if (eventsError) throw eventsError;
      if (eventsData) setEvents(eventsData);
      
      // Fetch tests
      const { data: testsData, error: testsError } = await supabase
        .from('tests')
        .select('*');
      
      if (testsError) throw testsError;
      if (testsData) setTests(testsData);
      
      // Fetch task statuses for current user
      const { data: statusData, error: statusError } = await supabase
        .from('user_task_status')
        .select('*')
        .eq('userId', user.id);
      
      if (statusError) throw statusError;
      
      const statuses: {[key: string]: boolean} = {};
      if (statusData) {
        statusData.forEach((status) => {
          statuses[status.taskId] = status.isCompleted;
        });
      }
      
      setTaskStatuses(statuses);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, isCompleted: boolean) => {
    if (!user) return;
    
    try {
      // Check if a status record already exists
      const { data, error } = await supabase
        .from('user_task_status')
        .select('*')
        .eq('userId', user.id)
        .eq('taskId', taskId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error code
        throw error;
      }
      
      if (data) {
        // Update existing record
        await supabase
          .from('user_task_status')
          .update({ isCompleted })
          .eq('userId', user.id)
          .eq('taskId', taskId);
      } else {
        // Create new record
        await supabase
          .from('user_task_status')
          .insert([
            { userId: user.id, taskId, isCompleted }
          ]);
      }
      
      // Update local state
      setTaskStatuses(prev => ({
        ...prev,
        [taskId]: isCompleted
      }));
      
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <p>読み込み中...</p>
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
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p>ログインしてください</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;