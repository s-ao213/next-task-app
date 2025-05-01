"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Button from './Button';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Task } from '../_types/task';
import { Test } from '../_types/test';
import { Loader2, BookOpen, CalendarCheck, AlertTriangle, ClipboardList, School } from 'lucide-react';

interface TestFormProps {
  onSuccess: () => void;
  initialTest?: Test;
  isEditing?: boolean;
}

const TestForm: React.FC<TestFormProps> = ({ onSuccess, initialTest, isEditing = false }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    subject: initialTest?.subject || '',
    test_date: initialTest?.test_date ? initialTest.test_date.split('T')[0] : '',
    scope: initialTest?.scope || '',
    relatedTaskId: initialTest?.related_task_id || '',
    teacher: initialTest?.teacher || '',
    isImportant: initialTest?.is_important || false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 関連課題のオプションを取得
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

  // initialTestが変更されたときにフォームデータを更新
  useEffect(() => {
    if (initialTest) {
      setFormData({
        subject: initialTest.subject,
        test_date: initialTest.test_date.split('T')[0],
        scope: initialTest.scope,
        relatedTaskId: initialTest.related_task_id || '',
        teacher: initialTest.teacher || '',
        isImportant: initialTest.is_important
      });
    }
  }, [initialTest]);

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
    setSuccess(null);
    
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

      // データの準備
      const testData = {
        subject: formData.subject,
        test_date: formData.test_date,
        scope: formData.scope,
        related_task_id: formData.relatedTaskId || null,
        teacher: formData.teacher || null,
        is_important: formData.isImportant
      };

      let result;
      
      if (isEditing && initialTest?.id) {
        // 既存のテストを更新
        result = await supabase
          .from('tests')
          .update(testData)
          .eq('id', initialTest.id);
      } else {
        // 新規テストを作成
        const newTest = {
          ...testData,
          id: uuidv4(),
          created_by: user.id,
          created_at: new Date().toISOString()
        };
        
        result = await supabase.from('tests').insert([newTest]);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      setSuccess(isEditing ? 'テストを更新しました' : 'テストを追加しました');
      
      // 成功したらフォームをリセット（編集モードでない場合のみ）
      if (!isEditing) {
        setFormData({
          subject: '',
          test_date: '',
          scope: '',
          relatedTaskId: '',
          teacher: '',
          isImportant: false
        });
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error adding/updating test:', err);
      setError(err instanceof Error ? err.message : 'テストの追加/更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
      {/* フォームヘッダー */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-red-700 flex items-center">
          <ClipboardList className="mr-2 h-6 w-6" />
          {isEditing ? 'テストを編集' : '新しいテスト・小テストを追加'}
        </h2>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start">
          <div className="text-green-500 mr-3">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* フォームグリッド - メインフィールド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 教科 */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            教科 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BookOpen className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="focus:ring-red-500 focus:border-red-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
              placeholder="教科名を入力"
              required
            />
          </div>
        </div>

        {/* 実施日 */}
        <div>
          <label htmlFor="test_date" className="block text-sm font-medium text-gray-700 mb-1">
            実施日 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarCheck className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              id="test_date"
              name="test_date"
              value={formData.test_date}
              onChange={handleChange}
              className="focus:ring-red-500 focus:border-red-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
              required
            />
          </div>
        </div>

        {/* 担当教員 */}
        <div>
          <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">
            担当教員
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <School className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="teacher"
              name="teacher"
              value={formData.teacher}
              onChange={handleChange}
              className="focus:ring-red-500 focus:border-red-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
              placeholder="担当教員名を入力"
            />
          </div>
        </div>

        {/* 関連する課題 */}
        <div>
          <label htmlFor="relatedTaskId" className="block text-sm font-medium text-gray-700 mb-1">
            関連する課題
          </label>
          <select
            id="relatedTaskId"
            name="relatedTaskId"
            value={formData.relatedTaskId}
            onChange={handleChange}
            className="focus:ring-red-500 focus:border-red-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
          >
            <option value="">なし</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.subject} - {task.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 範囲 - 全幅 */}
      <div className="mb-6">
        <label htmlFor="scope" className="block text-sm font-medium text-gray-700 mb-1">
          範囲 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="scope"
          name="scope"
          value={formData.scope}
          onChange={handleChange}
          rows={4}
          className="focus:ring-red-500 focus:border-red-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
          placeholder="テストの範囲を入力"
          required
        />
      </div>

      {/* 重要マーク */}
      <div className="mb-6 flex items-center">
        <input
          type="checkbox"
          id="isImportant"
          name="isImportant"
          checked={formData.isImportant}
          onChange={handleCheckboxChange}
          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
        />
        <label htmlFor="isImportant" className="ml-2 block text-sm text-gray-700">
          重要なテストとしてマーク
        </label>
      </div>

      {/* 注記 - テストは全員対象 */}
      <div className="p-3 bg-blue-50 rounded-md mb-6 text-sm text-blue-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>テスト・小テストは自動的に全員に通知されます</span>
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
              送信中...
            </>
          ) : isEditing ? 'テストを更新' : 'テストを追加'}
        </Button>
      </div>
    </form>
  );
};

export default TestForm;