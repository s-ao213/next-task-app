"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Calendar, Search, Check, X, BookOpen, AlertTriangle } from 'lucide-react';
import { ja } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Task as TaskType, SubmissionMethod } from '../_types/task';

// 日本語ロケールを登録
registerLocale('ja', ja);

// 科目リストを定義（既存のimportの下に追加）
const SUBJECTS = [
  '言語と文化',
  '現代社会論',
  '確率統計',
  '保健体育4',
  '英語6',
  '多文化共生',
  '応用数学A',
  '応用数学B',
  '物理学A',
  '物理学B',
  '応用専門PBL2',
  'インターンシップ',
  '生活と物質',
  '社会と環境',
  'アルゴリズムとデータ構造2',
  '電気電子回路2',
  'データベース工学',
  'マルチメディア情報処理',
  '情報通信ネットワーク',
  'コンピュータシステム',
  '知能情報実験実習2 A班',
  '知能情報実験実習2 B班',
  'その他'
];

// 拡張インターフェース
interface FormTask extends TaskType {
  assigned_users?: Array<{ id: string; name: string }>;
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

  // 初期化値が科目リストにない場合の対応
  const initialSubject = initialTask?.subject || '';
  const [subject, setSubject] = useState(
    SUBJECTS.includes(initialSubject) ? initialSubject : ''
  );

  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>(
    initialTask?.submission_method || SubmissionMethod.GOOGLE_CLASSROOM
  );
  const [isImportant, setIsImportant] = useState(initialTask?.is_important || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 割り当て関連の状態
  const [assignType, setAssignType] = useState<'all' | 'specific'>(
    initialTask?.assigned_users ? 'specific' : 'all'
  );
  const [studentId, setStudentId] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<Array<{ id: string; name: string }>>(
    initialTask?.assigned_users || []
  );
  const [, setStudentIdError] = useState('');
  
  // 初回のみ実行する副作用
  useEffect(() => {
    if (initialTask?.assigned_users && initialTask?.assigned_user_id) {
      setStudentId(initialTask.assigned_user_id);
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
        // 既に追加済みのユーザーでないか確認
        if (!assignedUsers.some(u => u.id === result.user.id)) {
          setAssignedUsers([...assignedUsers, {
            id: result.user.id,
            name: result.user.name
          }]);
        }
        setStudentId(''); // 入力フィールドをクリア
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ユーザーの検索中にエラーが発生しました';
      setStudentIdError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ユーザー削除処理の追加
  const removeUser = (userId: string) => {
    setAssignedUsers(assignedUsers.filter(user => user.id !== userId));
  };

  // タイムアウト処理を追加
  const TIMEOUT_DURATION = 10000; // 10秒

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    // タイムアウト用のPromise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('タイムアウト: 処理に時間がかかりすぎています'));
      }, TIMEOUT_DURATION);
    });

    try {
      // バリデーションを順番に実行
      if (!title.trim()) {
        throw new Error('タイトルを入力してください');
      }

      if (!subject) {
        throw new Error('教科・科目を選択してください');
      }

      // ユーザー情報の確認を最初に行う
      if (!user?.id) {
        setError('ユーザー情報が取得できません。再度ログインしてください。');
        return;
      }

      let assignedUserIds: string[] = [];

      if (assignType === 'all') {
        let targetStudentIds: string[] = [];
        
        // 科目に応じて対象学生の出席番号を設定
        if (subject === '社会と環境') {
          targetStudentIds = [
            '1', '2', '3', '4', '6', '7', '8', '9', '10',
            '11', '12', '13', '14', '15', '16', '17', '18', '19',
            '21', '22', '23', '24', '25', '26', '29', '30',
            '32', '33', '34', '35'
          ];
        } else if (subject === '知能情報実験実習2 奇数班') {
          // 奇数班（1, 3, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35）
          targetStudentIds = Array.from({length: 35}, (_, i) => (i + 1).toString())
            .filter(id => parseInt(id) % 2 === 1);
        } else if (subject === '知能情報実験実習2 偶数班') {
          // 偶数班（2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 99）
          // 5番は例外として偶数班に含める
          targetStudentIds = Array.from({length: 35}, (_, i) => (i + 1).toString())
            .filter(id => parseInt(id) % 2 === 0 || id === '5')
            .concat(['99']);
        } else if (subject === '生活と物質') {
          targetStudentIds = ['5', '20', '27', '28', '31', '99'];
        }

        try {
          // 対象学生の一括取得
          if (targetStudentIds.length > 0) {
            const { data: users, error } = await supabase
              .from('users')
              .select('id')
              .in('student_id', targetStudentIds);

            if (error) throw error;
            if (users) {
              assignedUserIds = users.map(user => user.id);
            }
          }
        } catch (error) {
          console.error('ユーザー取得エラー:', error);
          throw new Error('対象ユーザーの取得に失敗しました');
        }
      } else {
        // 特定のユーザーが選択された場合
        assignedUserIds = assignedUsers.map(u => u.id);
      }

      // タスクデータの作成
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        deadline: dueDate?.toISOString() || null,
        subject,
        submission_method: submissionMethod,
        created_by: user.id,
        is_important: isImportant,
        is_for_all: assignType === 'all' && !['社会と環境', '知能情報実験実習2 A班', '知能情報実験実習2 B班'].includes(subject),
        assigned_to: assignedUserIds,
        created_at: new Date().toISOString()
      };

      // Promise.raceを使用してタイムアウト処理を追加
      const savePromise = async () => {
        let result;
        if (isEditing && initialTask?.id) {
          result = await supabase
            .from('tasks')
            .update(taskData)
            .eq('id', initialTask.id);
        } else {
          result = await supabase
            .from('tasks')
            .insert([taskData]);
        }
        return result;
      };

      const result = await Promise.race([savePromise(), timeoutPromise]) as { error?: { message: string } };

      if (result?.error) throw result.error;

      setSuccess(isEditing ? '課題を更新しました' : '新しい課題を作成しました');

      // フォームデータをローカルストレージに一時保存
      if (!isEditing) {
        localStorage.setItem('taskFormData', JSON.stringify({
          title,
          description,
          dueDate,
          subject,
          submissionMethod,
          isImportant,
          assignType,
          assignedUsers
        }));

        // 成功したら一時保存を削除
        localStorage.removeItem('taskFormData');
        
        // フォームリセット
        resetForm();
      }

      onSubmit();
    } catch (err) {
      console.error('課題保存エラー:', err);
      setError(err instanceof Error ? err.message : '課題の保存中にエラーが発生しました');
      
      // エラー時にフォームデータを保持
      localStorage.setItem('taskFormData', JSON.stringify({
        title,
        description,
        dueDate,
        subject,
        submissionMethod,
        isImportant,
        assignType,
        assignedUsers
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // フォームリセット関数
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(null);
    setSubject('');
    setSubmissionMethod(SubmissionMethod.GOOGLE_CLASSROOM);
    setIsImportant(false);
    setAssignType('all');
    setStudentId('');
    setAssignedUsers([]);
  };

  // コンポーネントマウント時に一時保存データを復元
  useEffect(() => {
    const savedData = localStorage.getItem('taskFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setTitle(parsedData.title || '');
        setDescription(parsedData.description || '');
        setDueDate(parsedData.dueDate ? new Date(parsedData.dueDate) : null);
        setSubject(parsedData.subject || '');
        setSubmissionMethod(parsedData.submissionMethod || SubmissionMethod.GOOGLE_CLASSROOM);
        setIsImportant(parsedData.isImportant || false);
        setAssignType(parsedData.assignType || 'all');
        setAssignedUsers(parsedData.assignedUsers || []);
      } catch (error) {
        console.error('保存データの復元に失敗しました:', error);
        localStorage.removeItem('taskFormData');
      }
    }
  }, []);

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
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md bg-white"
              required
            >
              <option value="" disabled>科目を選択してください</option>
              {SUBJECTS.map((subjectOption) => (
                <option key={subjectOption} value={subjectOption}>
                  {subjectOption}
                </option>
              ))}
            </select>
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
            提出方法
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
                setAssignedUsers([]);
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="出席番号を入力"
                    className="w-full pl-10 pr-3 py-2 border rounded-md"
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
              
              {/* 選択されたユーザー一覧 */}
              {assignedUsers.length > 0 && (
                <div className="mt-2 space-y-2">
                  {assignedUsers.map(user => (
                    <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() => removeUser(user.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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