"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Calendar, Users, Search, Check, X, BookOpen, AlertTriangle } from 'lucide-react';
import { ja } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Task as TaskType, SubmissionMethod } from '../_types/task';

// 日本語ロケールを登録
registerLocale('ja', ja);

// 拡張インターフェース
interface FormTask extends TaskType {
  assigned_user_name?: string;
  assigned_student_id?: string;
}

interface TaskFormProps {
  onSubmit: () => void;
  initialTask?: FormTask;
  isEditing?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, initialTask, isEditing = false }): JSX.Element => {
  const { user, getUserByStudentId } = useAuth();
  
  // フォーム状態
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(
    initialTask?.deadline ? new Date(initialTask.deadline) : null
  );
  const [subject, setSubject] = useState(initialTask?.subject || '');
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>(
    initialTask?.submission_method || SubmissionMethod.GOOGLE_CLASSROOM
  );
  const [isImportant, setIsImportant] = useState(initialTask?.is_important || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 割り当て関連の状態
  const [assignType, setAssignType] = useState<'all' | 'specific'>(
    initialTask?.assigned_user_name ? 'specific' : 'all'
  );
  const [studentId, setStudentId] = useState('');
  const [assignedUser, setAssignedUser] = useState<{ id: string, name: string } | null>(
    initialTask?.assigned_user_name ? {
      id: initialTask.assigned_user_name,
      name: initialTask.assigned_user_name || '指定ユーザー'
    } : null
  );
  const [studentIdError, setStudentIdError] = useState('');
  
  // 初回のみ実行する副作用
  useEffect(() => {
    if (initialTask?.assigned_user_name && initialTask?.assigned_student_id) {
      setStudentId(initialTask.assigned_student_id);
    }
  }, [initialTask]);

  // 出席番号からユーザーを検索
  const handleStudentIdSearch = async () => {
    if (!studentId.trim()) {
      setStudentIdError('出席番号を入力してください');
      return;
    }
    
    setStudentIdError('');
    setIsSubmitting(true);
    
    try {
      const result = await getUserByStudentId(studentId);
      
      if (result.error) {
        setStudentIdError(result.error.message);
        return;
      }
      
      if (result.user) {
        setAssignedUser({
          id: result.user.id,
          name: result.user.name
        });
      }
    } catch {
      setStudentIdError('ユーザーの検索中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 選択されたユーザーをクリア
  const clearAssignedUser = () => {
    setAssignedUser(null);
    setStudentId('');
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // バリデーション
      if (!title.trim()) {
        throw new Error('タイトルを入力してください');
      }

      if (!subject.trim()) {
        throw new Error('教科・科目を入力してください');
      }

      // 割り当て対象の処理
      let assignedUserId = null;
      if (assignType === 'specific' && assignedUser) {
        assignedUserId = assignedUser.id;
      }
      
      // 課題データ作成
      const taskData: {
        title: string;
        description: string;
        deadline: string | null;
        subject: string;
        submission_method: SubmissionMethod;
        created_by: string | undefined;
        assigned_user_id: string | null;
        is_for_all: boolean;
        assigned_to: string[];
        is_important: boolean;
        created_at?: string;
      } = {
        title: title.trim(),
        description: description.trim(),
        deadline: dueDate ? dueDate.toISOString() : null,
        subject: subject,
        submission_method: submissionMethod,
        created_by: user?.id,
        assigned_user_id: assignedUserId,
        is_for_all: assignType === 'all',
        assigned_to: assignType === 'specific' && assignedUser 
          ? [assignedUser.id]
          : [],
        is_important: isImportant
      };

      let result;
      if (isEditing && initialTask?.id) {
        // 課題を更新
        result = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', initialTask.id);
      } else {
        // 新規課題を作成
        taskData.created_at = new Date().toISOString();
        result = await supabase
          .from('tasks')
          .insert([taskData]);
      }

      if (result.error) throw result.error;
      
      setSuccess(isEditing ? '課題を更新しました' : '新しい課題を作成しました');
      
      // フォームをリセット（編集時はリセットしない）
      if (!isEditing) {
        setTitle('');
        setDescription('');
        setDueDate(null);
        setSubject('');
        setSubmissionMethod(SubmissionMethod.GOOGLE_CLASSROOM);
        setIsImportant(false);
        setAssignType('all');
        setStudentId('');
        setAssignedUser(null);
      }
      
      // 親コンポーネントに通知
      onSubmit();
    } catch (err) {
      console.error('課題保存エラー:', err);
      setError(err instanceof Error ? err.message : '課題の保存中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
      {/* フォームヘッダー */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-blue-700 flex items-center">
          <BookOpen className="mr-2 h-6 w-6" />
          {isEditing ? '課題を編集' : '新しい課題を作成'}
        </h2>
      </div>

      {/* アラートメッセージ */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start">
          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* フォームグリッド - メインフィールド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 科目 */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            教科・科目 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BookOpen className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
              placeholder="科目名を入力"
              required
            />
          </div>
        </div>

        {/* タイトル */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            課題タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
            placeholder="課題のタイトルを入力"
            required
          />
        </div>

        {/* 期限 */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            提出期限
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              locale="ja"
              dateFormat="yyyy/MM/dd"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
              placeholderText="YYYY/MM/DD"
              isClearable
            />
          </div>
        </div>

        {/* 提出方法 */}
        <div>
          <label htmlFor="submissionMethod" className="block text-sm font-medium text-gray-700 mb-1">
            提出方法 <span className="text-red-500">*</span>
          </label>
          <select
            id="submissionMethod"
            value={submissionMethod}
            onChange={(e) => setSubmissionMethod(e.target.value as SubmissionMethod)}
            className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
            required
          >
            {Object.values(SubmissionMethod).map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 課題の説明 - 全幅 */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          課題の説明
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
          placeholder="課題の詳細な説明"
        />
      </div>

      {/* 重要マーク */}
      <div className="mb-6">
        <div className="flex items-center">
          <input
            id="isImportant"
            type="checkbox"
            checked={isImportant}
            onChange={(e) => setIsImportant(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isImportant" className="ml-2 block text-sm text-gray-900">
            重要な課題としてマークする
          </label>
        </div>
      </div>

      {/* 割り当てセクション */}
      <div className="p-4 bg-gray-50 rounded-md mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-3">割り当て設定</h3>
        
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <label className="flex items-center">
            <input
              type="radio"
              checked={assignType === 'all'}
              onChange={() => {
                setAssignType('all');
                setAssignedUser(null);
                setStudentId('');
              }}
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">全員</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              checked={assignType === 'specific'}
              onChange={() => setAssignType('specific')}
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">特定のユーザー</span>
          </label>
        </div>
        
        {assignType === 'specific' && (
          <div className="pl-2 border-l-2 border-blue-200 mt-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="出席番号を入力"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
                />
              </div>
              
              <Button
                type="button"
                onClick={handleStudentIdSearch}
                disabled={isSubmitting}
                className="whitespace-nowrap"
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-1" />
                )}
                <span>検索</span>
              </Button>
            </div>
            
            {studentIdError && (
              <p className="text-red-500 text-xs mt-1">{studentIdError}</p>
            )}
            
            {assignedUser && (
              <div className="mt-2 p-2 border rounded bg-green-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">選択ユーザー:</span> {assignedUser.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAssignedUser}
                    className="text-gray-500 hover:text-red-500 p-1"
                    title="選択を解除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
              保存中...
            </>
          ) : (
            isEditing ? '課題を更新' : '課題を作成'
          )}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;