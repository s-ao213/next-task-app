"use client";

import React, { useState } from 'react';
import { Task } from '../_types/task';
import Button from './Button';
import { formatDate, getDaysUntilDeadline } from '../utils/dateUtils';
import { supabase } from '../supabaseClient';
import { Pencil, Trash2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Calendar, BookOpen } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isCompleted: boolean;
  userId: string;
  onStatusChange: (taskId: string, isCompleted: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  isCompleted, 
  userId, 
  onStatusChange,
  onEdit,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false);
  const daysUntilDeadline = getDaysUntilDeadline(task.deadline);

  // user_task_status テーブルへの挿入・更新処理
  const handleCheckboxChange = async () => {
    const newStatus = !isCompleted;
    try {
      await supabase
        .from('user_task_status')
        .upsert({ user_id: userId, task_id: task.id, is_completed: newStatus });
      
      onStatusChange(task.id, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // 期限の状態を判断するヘルパー関数
  const getDeadlineStatus = () => {
    if (daysUntilDeadline < 0) return 'expired'; // 期限切れ
    if (daysUntilDeadline <= 1) return 'urgent'; // 緊急（1日以内）
    if (daysUntilDeadline <= 3) return 'soon';   // 近い（3日以内）
    return 'normal';                            // 通常
  };

  const deadlineStatus = getDeadlineStatus();
  
  // 状態に応じたカラークラスを取得
  const getStatusColorClasses = () => {
    if (isCompleted) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-500',
        text: 'text-green-800',
        badgeBg: 'bg-green-100',
        icon: 'text-green-600'
      };
    }
    
    switch (deadlineStatus) {
      case 'expired':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-800',
          badgeBg: 'bg-red-100',
          icon: 'text-red-600'
        };
      case 'urgent':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-500',
          text: 'text-orange-800',
          badgeBg: 'bg-orange-100',
          icon: 'text-orange-600'
        };
      case 'soon':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          text: 'text-yellow-800',
          badgeBg: 'bg-yellow-100',
          icon: 'text-yellow-600'
        };
      default:
        return {
          bg: '',
          border: 'border-gray-200',
          text: 'text-blue-800',
          badgeBg: 'bg-blue-100',
          icon: 'text-blue-600'
        };
    }
  };
  
  const colorClasses = getStatusColorClasses();

  return (
    <div className={`mb-4 rounded-lg shadow-sm border ${colorClasses.border} ${colorClasses.bg} transition-all duration-200`}>
      {/* デスクトップレイアウト（md以上の画面幅） */}
      <div className="hidden md:block p-4">
        {/* ヘッダー部分 */}
        <div className="flex items-center mb-3">
          {/* チェックボックス */}
          <div 
            className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full cursor-pointer mr-3 ${
              isCompleted 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            onClick={handleCheckboxChange}
            title={isCompleted ? "完了を取り消す" : "完了にする"}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
            )}
          </div>
          
          {/* タイトル */}
          <div className="flex-grow">
            <h3 className={`font-medium text-lg ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h3>
          </div>
          
          {/* 完了状態バッジ */}
          <div className="flex-shrink-0 ml-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClasses.badgeBg} ${colorClasses.text}`}>
              {isCompleted 
                ? '完了済み' 
                : deadlineStatus === 'expired'
                  ? '期限切れ'
                  : deadlineStatus === 'urgent'
                    ? '今日が締切'
                    : '未完了'}
            </span>
          </div>
        </div>
        
        {/* 情報行 */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          {/* 左：科目名と重要マーク */}
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 text-gray-500 mr-2" />
            <span className="font-medium text-gray-700">{task.subject}</span>
            {task.is_important && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full ml-2">重要</span>
            )}
          </div>
          
          {/* 右：締切日 */}
          <div className="flex items-center">
            {deadlineStatus === 'expired' ? 
              <AlertCircle className={`h-4 w-4 mr-1.5 ${colorClasses.icon}`} /> : 
              <Calendar className={`h-4 w-4 mr-1.5 ${colorClasses.icon}`} />
            }
            <div>
              <span className={`text-sm font-medium ${colorClasses.text}`}>
                {formatDate(task.deadline)}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                ({daysUntilDeadline < 0
                  ? '期限切れ'
                  : daysUntilDeadline === 0
                  ? '今日'
                  : `あと${daysUntilDeadline}日`})
              </span>
            </div>
          </div>
        </div>
        
        {/* アクションボタン */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className={`${isCompleted ? 'text-gray-500 border-gray-300' : ''} flex items-center`}
          >
            {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            {expanded ? '詳細を閉じる' : '詳細を表示'}
          </Button>
          
          <div className="flex space-x-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                編集
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                削除
              </Button>
            )}
          </div>
        </div>
        
        {/* 詳細情報（展開時） */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-gray-200 grid gap-3">
            {task.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">概要:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{task.description}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">提出方法:</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{task.submission_method}</p>
            </div>
          </div>
        )}
      </div>

      {/* モバイルレイアウト（md未満の画面幅） */}
      <div className="md:hidden p-3">
        {/* ヘッダー部分 */}
        <div className="flex items-start mb-2">
          {/* チェックボックス */}
          <div 
            className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full cursor-pointer mr-2 ${
              isCompleted 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            onClick={handleCheckboxChange}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400"></div>
            )}
          </div>
          
          {/* タイトルと科目 */}
          <div className="flex-grow">
            <h3 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            <div className="flex items-center text-xs text-gray-600 mt-0.5">
              <BookOpen className="h-3 w-3 mr-1" />
              {task.subject}
              {task.is_important && (
                <span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full ml-1.5">重要</span>
              )}
            </div>
          </div>
        </div>
        
        {/* 中央情報エリア */}
        <div className="flex justify-between items-center px-1 py-1.5 mb-2 bg-white bg-opacity-60 rounded">
          {/* 左：状態バッジ */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClasses.badgeBg} ${colorClasses.text}`}>
            {isCompleted 
              ? '完了済み' 
              : deadlineStatus === 'expired'
                ? '期限切れ'
                : deadlineStatus === 'urgent'
                  ? '今日が締切'
                  : '未完了'}
          </span>
          
          {/* 右：締切日 */}
          <div className="flex items-center">
            {deadlineStatus === 'expired' ? 
              <AlertCircle className="h-3.5 w-3.5 mr-1 text-red-500" /> : 
              <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
            }
            <span className={`text-xs ${colorClasses.text}`}>
              {formatDate(task.deadline)}
              <span className="text-xs text-gray-500 ml-1">
                ({daysUntilDeadline < 0
                  ? '期限切れ'
                  : daysUntilDeadline === 0
                  ? '今日'
                  : `あと${daysUntilDeadline}日`})
              </span>
            </span>
          </div>
        </div>
        
        {/* アクションボタンエリア */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className={`${isCompleted ? 'text-gray-500 border-gray-300' : ''} flex items-center justify-center col-span-2`}
          >
            {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            {expanded ? '詳細を閉じる' : '詳細を表示'}
          </Button>
          
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Pencil className="h-4 w-4 mr-1" />
              編集
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              削除
            </Button>
          )}
        </div>
        
        {/* 詳細情報（展開時） */}
        {expanded && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            {task.description && (
              <div className="mb-2">
                <h4 className="text-xs font-medium text-gray-700 mb-1">概要:</h4>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{task.description}</p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">提出方法:</h4>
              <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{task.submission_method}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;