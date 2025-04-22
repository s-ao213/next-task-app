"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Button from './Button';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Task } from '../_types/task';

interface TestFormProps {
  onSuccess: () => void;
}

const TestForm: React.FC<TestFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    test_date: '',         // date → test_date
    scope: '',
    relatedTaskId: '',
    teacher: '',
    isImportant: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        if (data) setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const testId = uuidv4();
      // フォームデータをコピー
      const testData = { ...formData };
      
      // キャメルケースからスネークケースに変換
      const newTest = {
        id: testId,
        subject: testData.subject,
        test_date: testData.test_date,  // date → test_date
        scope: testData.scope,
        related_task_id: testData.relatedTaskId || null,
        teacher: testData.teacher || null,
        is_important: testData.isImportant,
        created_by: user.id,
        created_at: new Date().toISOString()
      };
      
      
      const { error } = await supabase.from('tests').insert([newTest]);
      
      if (error) throw error;
      
      onSuccess();
      // フォームリセット
    } catch (error) {
      console.error('Error adding test:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">新しいテスト・小テストを追加</h2>
      
      <div className="mb-4">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          教科名 *
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
  <label htmlFor="test_date" className="block text-sm font-medium text-gray-700 mb-1">
    実施日 *
  </label>
  <input
    type="date"
    id="test_date"       // date → test_date
    name="test_date"     // date → test_date
    value={formData.test_date}  // date → test_date
    onChange={handleChange}
    required
    className="w-full px-3 py-2 border border-gray-300 rounded-md"
  />
</div>
      
      <div className="mb-4">
        <label htmlFor="scope" className="block text-sm font-medium text-gray-700 mb-1">
          範囲 *
        </label>
        <textarea
          id="scope"
          name="scope"
          value={formData.scope}
          onChange={handleChange}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="relatedTaskId" className="block text-sm font-medium text-gray-700 mb-1">
          関連する課題
        </label>
        <select
          id="relatedTaskId"
          name="relatedTaskId"
          value={formData.relatedTaskId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">なし</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.subject} - {task.title}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">
          担当教員
        </label>
        <input
          type="text"
          id="teacher"
          name="teacher"
          value={formData.teacher}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isImportant"
            checked={formData.isImportant}
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
        {isSubmitting ? '送信中...' : 'テストを追加'}
      </Button>
    </form>
  );
};

export default TestForm;