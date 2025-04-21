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
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  // Sort tests by date
  const sortedTests = [...tests].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
      const eventDate = new Date(event.dateTime);
      return eventDate >= now && eventDate <= sevenDaysLater;
    }
  ).slice(0, 3);

  // Get upcoming tests (next 14 days)
  const fourteenDaysLater = new Date();
  fourteenDaysLater.setDate(now.getDate() + 14);

  const upcomingTests = sortedTests.filter(
    (test) => {
      const testDate = new Date(test.date);
      return testDate >= now && testDate <= fourteenDaysLater;
    }
  ).slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">直近の課題</h2>
          <Link to="/tasks" className="text-blue-600 hover:underline text-sm">
            すべて見る
          </Link>
        </div>
        {upcomingTasks.length > 0 ? (
          upcomingTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isCompleted={taskStatuses[task.id] || false}
              userId={userId}
              onStatusChange={onTaskStatusChange}
            />
          ))
        ) : (
          <p className="text-gray-500">直近の課題はありません</p>
        )}
      </div>

      <div>
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">直近のイベント</h2>
            <Link to="/events" className="text-blue-600 hover:underline text-sm">
              すべて見る
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))
          ) : (
            <p className="text-gray-500">直近のイベントはありません</p>
          )}
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">直近のテスト</h2>
            <Link to="/tests" className="text-blue-600 hover:underline text-sm">
              すべて見る
            </Link>
          </div>
          {upcomingTests.length > 0 ? (
            upcomingTests.map((test) => (
              <Card key={test.id} type="test" isImportant={test.isImportant} className="mb-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{test.subject}</h3>
                    <p className="text-sm text-gray-600">範囲: {test.scope}</p>
                    {test.teacher && (
                      <p className="text-xs text-gray-500">担当: {test.teacher}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDate(test.date)}</p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-gray-500">直近のテストはありません</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;