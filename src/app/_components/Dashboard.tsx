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
  // Sort tasks by deadline
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  // Sort events by dateTime
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );

  // Sort tests by date
  const sortedTests = [...tests].sort(
    (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
  );

  // Get upcoming tasks (next 7 days)
  const now = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(now.getDate() + 7);

  const upcomingTasks = sortedTasks.filter(
    (task) => {
      const deadline = new Date(task.deadline);
      return deadline >= now && deadline <= sevenDaysLater;
    }
  ).slice(0, 5);

  // Get upcoming events (next 7 days)
  const upcomingEvents = sortedEvents.filter(
    (event) => {
      const eventDate = new Date(event.date_time);
      return eventDate >= now && eventDate <= sevenDaysLater;
    }
  ).slice(0, 3);

  // Get upcoming tests (next 14 days)
  const fourteenDaysLater = new Date();
  fourteenDaysLater.setDate(now.getDate() + 14);

  const upcomingTests = sortedTests.filter(
    (test) => {
      const testDate = new Date(test.test_date);
      return testDate >= now && testDate <= fourteenDaysLater;
    }
  ).slice(0, 3);

  // 締め切りが近い課題を特定
  const urgentTasks = upcomingTasks.filter(task => {
    const deadline = new Date(task.deadline);
    const twoDaysLater = new Date();
    twoDaysLater.setDate(now.getDate() + 2);
    return deadline <= twoDaysLater && !taskStatuses[task.id];
  });

  // 重要なイベントの数
  const importantEvents = upcomingEvents.filter(event => event.is_important).length;
  
  // 重要なテストの数
  const importantTests = upcomingTests.filter(test => test.is_important).length;

  return (
    <div className="space-y-8">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium opacity-90">課題</h3>
              <p className="text-3xl font-bold mt-2">{upcomingTasks.length}</p>
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
              <p className="text-3xl font-bold mt-2">{upcomingEvents.length}</p>
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
              <p className="text-3xl font-bold mt-2">{upcomingTests.length}</p>
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
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={taskStatuses[task.id] || false}
                  userId={userId}
                  onStatusChange={onTaskStatusChange}
                />
              ))}
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
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
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
            {upcomingTests.length > 0 ? (
              <div className="space-y-3">
                {upcomingTests.map((test) => (
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