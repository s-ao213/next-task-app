"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Calendar, Users, Search, Check, X } from 'lucide-react';
import { ja } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { SubmissionMethod } from '../_types/task';

// 日本語ロケールを登録
registerLocale('ja', ja);

interface Task {
  id?: string;
  title: string;
  description: string;
  deadline: string | null; // due_date から deadline に変更
  subject?: string; // 科目フィールドを追加
  submission_method?: SubmissionMethod; // 提出方法フィールドを追加
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_student_id?: string;
  is_for_all?: boolean;
}

interface TaskFormProps {
  onSubmit: () => void;
  initialTask?: Task;
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
  const [subject, setSubject] = useState(initialTask?.subject || ''); // 科目フィールドの状態を追加
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>(
    initialTask?.submission_method || SubmissionMethod.GOOGLE_CLASSROOM
  ); // 提出方法の状態を追加
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 割り当て関連の状態
  const [assignType, setAssignType] = useState<'all' | 'specific'>(
    initialTask?.assigned_user_id ? 'specific' : 'all'
  );
  const [studentId, setStudentId] = useState('');
  const [assignedUser, setAssignedUser] = useState<{ id: string, name: string } | null>(
    initialTask?.assigned_user_id ? {
      id: initialTask.assigned_user_id,
      name: initialTask.assigned_user_name || '指定ユーザー'
    } : null
  );
  const [studentIdError, setStudentIdError] = useState('');
  
  // 初回のみ実行する副作用
  useEffect(() => {
    // 初期データがあり、特定ユーザーに割り当てられている場合
    if (initialTask?.assigned_user_id && initialTask?.assigned_student_id) {
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
        assigned_to: string[]; // この行を追加
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
          ? [assignedUser.id]  // 特定ユーザーの場合はそのIDを配列に
          : []  // 全員の場合は空配列
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
        taskData.created_at = new Date().toISOString(); // created_byではなくcreated_atを設定
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
        setSubject(''); // この行を追加
        setSubmissionMethod(SubmissionMethod.GOOGLE_CLASSROOM); // 提出方法をリセット
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          教科・科目 <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="科目名を入力"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          課題タイトル <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="課題のタイトルを入力"
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          課題の説明
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="課題の詳細な説明"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
          提出期限
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <DatePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            locale="ja"
            dateFormat="yyyy/MM/dd"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholderText="YYYY/MM/DD"
            isClearable
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="submissionMethod" className="block text-sm font-medium text-gray-700 mb-1">
          提出方法 <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <select
            id="submissionMethod"
            value={submissionMethod}
            onChange={(e) => setSubmissionMethod(e.target.value as SubmissionMethod)}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md"
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
      
      {/* 割り当て対象の選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          割り当て対象
        </label>
        <div className="flex items-center space-x-4 mb-3">
          <label className="flex items-center">
            <input
              type="radio"
              checked={assignType === 'all'}
              onChange={() => {
                setAssignType('all');
                setAssignedUser(null);
                setStudentId('');
              }}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">全員</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={assignType === 'specific'}
              onChange={() => setAssignType('specific')}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">特定のユーザー</span>
          </label>
        </div>
        
        {assignType === 'specific' && (
          <div className="pl-2 border-l-2 border-gray-200 mt-3">
            <div className="flex items-center mb-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="出席番号を入力"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <Button
                type="button"
                onClick={handleStudentIdSearch}
                disabled={isSubmitting}
                className="ml-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-1">検索</span>
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
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="pt-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
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