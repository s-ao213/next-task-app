"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SubmissionMethod } from '../_types/task';
import Button from './Button';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface TaskFormProps {
  onSuccess: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    deadline: '',
    submissionMethod: SubmissionMethod.GOOGLE_CLASSROOM,
    assignedTo: [] as string[],
    isImportant: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from('users').select('id, name, email');
        if (error) throw error;
        if (data) setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleUserSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, assignedTo: selectedOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const taskId = uuidv4();
      const newTask = {
        id: taskId,
        ...formData,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };
      
      // If no users are selected, assign to all users
      if (newTask.assignedTo.length === 0) {
        newTask.assignedTo = users.map(u => u.id);
      }
      
      const { error } = await supabase.from('tasks').insert([newTask]);
      
      if (error) throw error;
      
      onSuccess();
      setFormData({
        subject: '',
        title: '',
        description: '',
        deadline: '',
        submissionMethod: SubmissionMethod.GOOGLE_CLASSROOM,
        assignedTo: [],
        isImportant: false,
      });
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">新しい課題を追加</h2>
      
      <div className="mb-4">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          教科 *
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          課題名 *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          課題概要
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
          提出期限 *
        </label>
        <input
          type="datetime-local"
          id="deadline"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="submissionMethod" className="block text-sm font-medium text-gray-700 mb-1">
          提出方法
        </label>
        <select
          id="submissionMethod"
          name="submissionMethod"
          value={formData.submissionMethod}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {Object.values(SubmissionMethod).map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
          メンバー（未選択の場合は全員）
        </label>
        <select
          id="assignedTo"
          name="assignedTo"
          multiple
          value={formData.assignedTo}
          onChange={handleUserSelection}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          size={Math.min(5, users.length)}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>
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
        {isSubmitting ? '送信中...' : '課題を追加'}
      </Button>
    </form>
  );
};

export default TaskForm;