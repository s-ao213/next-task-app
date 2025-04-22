"use client";

import React, { useState } from 'react';
import { Task } from '../_types/task';
import Card from './Card';
import Button from './Button';
import { formatDate, getDaysUntilDeadline } from '../utils/dateUtils';
import { supabase } from '../supabaseClient';

interface TaskItemProps {
  task: Task;
  isCompleted: boolean;
  userId: string;
  onStatusChange: (taskId: string, isCompleted: boolean) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, isCompleted, userId, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const daysUntilDeadline = getDaysUntilDeadline(task.deadline);
// user_task_status テーブルへの挿入・更新処理の修正

const handleCheckboxChange = async () => {
  const newStatus = !isCompleted;
  try {
    await supabase
      .from('user_task_status')
      .upsert({ user_id: userId, task_id: task.id, is_completed: newStatus });  // カラム名を修正
    
    onStatusChange(task.id, newStatus);
  } catch (error) {
    console.error('Error updating task status:', error);
  }
};

  return (
    <Card type="task" isImportant={task.is_important} className="mb-4">
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={handleCheckboxChange}
          className="mt-1 h-5 w-5 text-blue-600"
        />
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </h3>
              <p className="text-sm text-gray-600">{task.subject}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                daysUntilDeadline < 0
                  ? 'text-red-600'
                  : daysUntilDeadline <= 3
                  ? 'text-orange-600'
                  : 'text-gray-700'
              }`}>
                {formatDate(task.deadline)}
              </p>
              <p className="text-xs text-gray-500">
                {daysUntilDeadline < 0
                  ? '期限切れ'
                  : daysUntilDeadline === 0
                  ? '今日が締切'
                  : `あと${daysUntilDeadline}日`}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '閉じる' : '詳細'}
          </Button>
          
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              {task.description && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700">概要:</h4>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
              )}
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-700">提出方法:</h4>
                <p className="text-sm text-gray-600">{task.submission_method}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TaskItem;