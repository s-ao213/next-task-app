"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Button from './Button';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Task } from '../_types/task';
import { Loader2 } from 'lucide-react';

interface TestFormProps {
  onSuccess: () => void;
}

const TestForm: React.FC<TestFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    test_date: '',
    scope: '',
    relatedTaskId: '',
    teacher: '',
    isImportant: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    
    try {
      // バリデーション
      if (!formData.subject.trim()) {
        throw new Error('教科を入力してください');
      }
      
      if (!formData.test_date) {
        throw new Error('実施日を選択してください');
      }
      
      if (!formData.scope.trim()) {
        throw new Error('テスト範囲を入力してください');
      }

      const testId = uuidv4();
      // フォームデータをコピー
      const testData = { ...formData };
      
      // キャメルケースからスネークケースに変換
      const newTest = {
        id: testId,
        subject: testData.subject,
        test_date: testData.test_date,
        scope: testData.scope,
        related_task_id: testData.relatedTaskId || null,
        teacher: testData.teacher || null,
        is_important: testData.isImportant,
        created_by: user.id,
        created_at: new Date().toISOString()
      };
      
      console.log('保存するテストデータ:', newTest);  // デバッグ用
      
      const { error } = await supabase.from('tests').insert([newTest]);
      
      if (error) {
        console.error('テスト保存エラー詳細:', error);  // 詳細なエラー情報を表示
        throw error;
      }
      
      // フォームリセット
      setFormData({
        subject: '',
        test_date: '',
        scope: '',
        relatedTaskId: '',
        teacher: '',
        isImportant: false
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error adding test:', err);
      console.error('エラー詳細:', JSON.stringify(err, null, 2));  // オブジェクトを文字列化して詳細表示
      setError(err instanceof Error ? err.message : 'テストの追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card overflow-hidden">
      <div className="card-header bg-gradient-to-r from-red-50 to-white">
        <h2 className="text-xl font-semibold text-red-700">新しいテスト・小テストを追加</h2>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="card-body space-y-4">
        <div>
          <label htmlFor="subject" className="form-label">
            教科 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
          
          <div>
            <label htmlFor="test_date" className="form-label">
              実施日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="test_date"
              name="test_date"
              value={formData.test_date}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        
        <div className="mb-4">
          <label htmlFor="scope" className="block text-sm font-medium text-gray-700 mb-1">
            範囲 <span className="text-red-500">*</span>
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
        
        {/* テストは常に全員に割り当てられることを表示 */}
        <div className="p-2 bg-blue-50 rounded border border-blue-100">
          <p className="text-sm text-blue-700">
            ※ テスト・小テストは自動的に全員に割り当てられます
          </p>
        </div>
        
        <div className="card-footer flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                送信中...
              </>
            ) : 'テストを追加'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default TestForm;