//src/app/_components/Dashboard.tsx
"use client";
import React from 'react';
import { Link } from 'react-router-dom';
import { Task } from '../_types/task';
import { Event } from '../_types/event';
import { Test } from '../_types/test';
import TaskItem from './TaskItem';
import EventItem from './EventItem';
import Card from './Card';
import { formatDate } from '../utils/dateUtils';
import { CheckSquare, Award, BookOpen, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  events: Event[];
  tests: Test[];
  userId: string;
  taskStatuses: { [key: string]: boolean };
  onTaskStatusChange: (taskId: string, isCompleted: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  events,
  tests,
  userId,
  taskStatuses,
  onTaskStatusChange,
}) => {
  // 現在日付を取得
  const now = new Date();
  
  // ユーザーに関連するイベントのみをフィルタリング
  const userEvents = events.filter(event => 
    event.is_for_all || 
    event.assigned_to.includes(userId) ||
    event.assigned_user_id === userId
  );

  // 期限が過ぎていないタスクをフィルタリング - 修正版
  const activeTasks = tasks.filter(task => {
    // 期限が未設定または2099年の場合は常に表示対象とする
    if (!task.deadline || task.deadline.startsWith('2099-')) return true;
    
    const deadline = new Date(task.deadline);
    // 期限が過ぎていないか、または完了していないタスクを表示
    return deadline >= now || !taskStatuses[task.id];
  });
  
  // 期限が過ぎていないテストをフィルタリング
  const activeTests = tests.filter(test => {
    const testDate = new Date(test.test_date);
    return testDate >= now;
  });
  
  // 日付が過ぎていないイベントをフィルタリング
  const activeEvents = userEvents.filter(event => {
    const eventDate = new Date(event.date_time);
    return eventDate >= now;
  });

  // 日付の昇順でソート（近い日付が前に来るようにする）
  const sortedTasks = [...activeTasks].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  // 日付の昇順でソート
  const sortedEvents = [...activeEvents].sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );

  // 日付の昇順でソート
  const sortedTests = [...activeTests].sort(
    (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
  );

  // 一番近い期限のタスク
  const nearestTask = sortedTasks.length > 0 ? sortedTasks[0] : null;
  
  // 一番近い日付のイベント
  const nearestEvent = sortedEvents.length > 0 ? sortedEvents[0] : null;
  
  // 一番近い日付のテスト
  const nearestTest = sortedTests.length > 0 ? sortedTests[0] : null;

  // その他の直近タスク（一番近いもの以外で、特に重要なものがあれば表示）
  const otherImportantTasks = sortedTasks
    .slice(1) // 一番目は除外
    .filter(task => task.is_important) // 重要なものだけ
    .slice(0, 2); // 最大2つまで

  // その他の直近イベント（一番近いもの以外で、特に重要なものがあれば表示）
  const otherImportantEvents = sortedEvents
    .slice(1) // 一番目は除外
    .filter(event => event.is_important) // 重要なものだけ
    .slice(0, 1); // 最大1つまで

  // その他の直近テスト（一番近いもの以外で、特に重要なものがあれば表示）
  const otherImportantTests = sortedTests
    .slice(1) // 一番目は除外
    .filter(test => test.is_important) // 重要なものだけ
    .slice(0, 1); // 最大1つまで

  // Get upcoming tasks for summary
  const upcomingTasksCount = sortedTasks.filter(task => {
    const deadline = new Date(task.deadline);
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);
    return deadline <= sevenDaysLater;
  }).length;

  // Get upcoming events for summary
  const upcomingEventsCount = sortedEvents.filter(event => {
    const eventDate = new Date(event.date_time);
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);
    return eventDate <= sevenDaysLater;
  }).length;

  // Get upcoming tests for summary
  const upcomingTestsCount = sortedTests.filter(test => {
    const testDate = new Date(test.test_date);
    const fourteenDaysLater = new Date(now);
    fourteenDaysLater.setDate(now.getDate() + 14);
    return testDate <= fourteenDaysLater;
  }).length;

  // 締め切りが近い課題を特定
  const urgentTasks = sortedTasks.filter(task => {
    const deadline = new Date(task.deadline);
    const twoDaysLater = new Date(now);
    twoDaysLater.setDate(now.getDate() + 2);
    return deadline <= twoDaysLater && !taskStatuses[task.id];
  });

  // 重要なイベントの数
  const importantEvents = sortedEvents.filter(event => event.is_important).length;
  
  // 重要なテストの数
  const importantTests = sortedTests.filter(test => test.is_important).length;

  return (
    <div className="space-y-8">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium opacity-90">課題</h3>
              <p className="text-3xl font-bold mt-2">{upcomingTasksCount}</p>
              <p className="text-sm mt-1 opacity-80">直近7日間</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <CheckSquare size={24} />
            </div>
          </div>
          <div className="mt-4">
            {urgentTasks.length > 0 && (
              <div className="flex items-center gap-2 bg-red-500 bg-opacity-30 px-3 py-1.5 rounded-full">
                <AlertTriangle size={16} />
                <span className="text-sm">{urgentTasks.length}件の急ぎの課題</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium opacity-90">イベント</h3>
              <p className="text-3xl font-bold mt-2">{upcomingEventsCount}</p>
              <p className="text-sm mt-1 opacity-80">直近7日間</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Award size={24} />
            </div>
          </div>
          <div className="mt-4">
            {importantEvents > 0 && (
              <div className="flex items-center gap-2 bg-yellow-500 bg-opacity-30 px-3 py-1.5 rounded-full">
                <Clock size={16} />
                <span className="text-sm">{importantEvents}件の重要イベント</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium opacity-90">テスト</h3>
              <p className="text-3xl font-bold mt-2">{upcomingTestsCount}</p>
              <p className="text-sm mt-1 opacity-80">直近14日間</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <BookOpen size={24} />
            </div>
          </div>
          <div className="mt-4">
            {importantTests > 0 && (
              <div className="flex items-center gap-2 bg-red-500 bg-opacity-30 px-3 py-1.5 rounded-full">
                <AlertTriangle size={16} />
                <span className="text-sm">{importantTests}件の重要テスト</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold flex items-center">
              <CheckSquare className="mr-2 text-blue-600" size={20} />
              直近の課題
            </h2>
            <Link to="/tasks" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium">
              すべて見る
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {nearestTask ? (
            <div className="space-y-4">
              {/* 最も近い課題を強調表示 */}
              <div className="relative">
                <div className="absolute -left-2 top-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">
                  最優先
                </div>
                <div className="pt-6">
                  <TaskItem
                    key={nearestTask.id}
                    task={nearestTask}
                    isCompleted={taskStatuses[nearestTask.id] || false}
                    userId={userId}
                    onStatusChange={onTaskStatusChange}
                  />
                </div>
              </div>
              
              {/* その他の重要な課題 */}
              {otherImportantTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={taskStatuses[task.id] || false}
                  userId={userId}
                  onStatusChange={onTaskStatusChange}
                />
              ))}
              
              {otherImportantTasks.length === 0 && (
                <div className="text-center py-2 text-sm text-gray-500 mt-2 border-t pt-3">
                  すべての課題は「課題一覧」で確認できます
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500 mb-2">直近の課題はありません</p>
              <Link to="/tasks" className="text-blue-600 font-medium hover:underline">
                課題を追加する
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold flex items-center">
                <Award className="mr-2 text-purple-600" size={20} />
                直近のイベント
              </h2>
              <Link to="/events" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors text-sm font-medium">
                すべて見る
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            
            {nearestEvent ? (
              <div className="space-y-3">
                {/* 最も近いイベントを強調表示 */}
                <div className="relative">
                  <div className="absolute -left-2 top-0 bg-purple-500 text-white text-xs px-2 py-1 rounded-md">
                    次のイベント
                  </div>
                  <div className="pt-6">
                    <EventItem key={nearestEvent.id} event={nearestEvent} />
                  </div>
                </div>
                
                {/* その他の重要なイベント */}
                {otherImportantEvents.map(event => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">直近のイベントはありません</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold flex items-center">
                <BookOpen className="mr-2 text-amber-600" size={20} />
                直近のテスト
              </h2>
              <Link to="/tests" className="flex items-center text-amber-600 hover:text-amber-800 transition-colors text-sm font-medium">
                すべて見る
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            
            {nearestTest ? (
              <div className="space-y-3">
                {/* 最も近いテストを強調表示 */}
                <div className="relative">
                  <div className="absolute -left-2 top-0 bg-amber-500 text-white text-xs px-2 py-1 rounded-md">
                    次のテスト
                  </div>
                  <div className="pt-6">
                    <Card key={nearestTest.id} type="test" isImportant={nearestTest.is_important} className="hover:shadow-md transition-shadow">
                      <div className="flex justify-between p-1">
                        <div>
                          <h3 className="font-medium">{nearestTest.subject}</h3>
                          <p className="text-sm text-gray-600">範囲: {nearestTest.scope}</p>
                          {nearestTest.teacher && (
                            <p className="text-xs text-gray-500 mt-1">担当: {nearestTest.teacher}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-700">{formatDate(nearestTest.test_date)}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
                
                {/* その他の重要なテスト */}
                {otherImportantTests.map(test => (
                  <Card key={test.id} type="test" isImportant={test.is_important} className="hover:shadow-md transition-shadow">
                    <div className="flex justify-between p-1">
                      <div>
                        <h3 className="font-medium">{test.subject}</h3>
                        <p className="text-sm text-gray-600">範囲: {test.scope}</p>
                        {test.teacher && (
                          <p className="text-xs text-gray-500 mt-1">担当: {test.teacher}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-700">{formatDate(test.test_date)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">直近のテストはありません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;