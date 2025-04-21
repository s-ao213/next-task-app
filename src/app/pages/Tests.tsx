"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Test } from '../_types/test';
import { useAuth } from '../hooks/useAuth';
import Layout from '../_components/Layout';
import TestForm from '../_components/TestForm';
import { format } from 'date-fns';

const Tests: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sortOrder, setSortOrder] = useState<'date' | 'subject'>('date');
  const [filter, setFilter] = useState({
    subject: '',
    isImportant: false,
  });

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tests, filter, sortOrder]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tests').select('*');
      if (error) throw error;
      if (data) setTests(data);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tests];

    // Apply subject filter
    if (filter.subject) {
      filtered = filtered.filter(test => 
        test.subject.toLowerCase().includes(filter.subject.toLowerCase())
      );
    }

    // Apply importance filter
    if (filter.isImportant) {
      filtered = filtered.filter(test => test.isImportant);
    }

    // Apply sorting
    if (sortOrder === 'date') {
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortOrder === 'subject') {
      filtered.sort((a, b) => a.subject.localeCompare(b.subject));
    }

    setFilteredTests(filtered);
  };

  const handleFilterChange = (filterName: string, value: string | boolean) => {
    setFilter(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as 'date' | 'subject');
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchTests();
  };

  const toggleNotification = async (testId: string, enabled: boolean) => {
    if (!user) return;

    try {
      // Check if notification setting exists
      const { data, error } = await supabase
        .from('test_notifications')
        .select('*')
        .eq('userId', user.id)
        .eq('testId', testId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }
      
      if (data) {
        // Update existing notification setting
        await supabase
          .from('test_notifications')
          .update({ isNotificationEnabled: enabled })
          .eq('userId', user.id)
          .eq('testId', testId);
      } else {
        // Create new notification setting
        await supabase
          .from('test_notifications')
          .insert([{ 
            userId: user.id, 
            testId, 
            isNotificationEnabled: enabled 
          }]);
      }
      
      // Refresh data
      fetchTests();
    } catch (error) {
      console.error('Error toggling notification:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">テスト・小テスト</h1>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            {showForm ? 'フォームを閉じる' : '新しいテストを追加'}
          </button>
        </div>
        
        {showForm && (
          <div className="mb-6">
            <TestForm onSuccess={handleFormSuccess} />
          </div>
        )}
        
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                教科でフィルター
              </label>
              <input
                type="text"
                value={filter.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="教科名を入力"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                並び替え
              </label>
              <select
                value={sortOrder}
                onChange={handleSortChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="date">実施日順</option>
                <option value="subject">教科順</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.isImportant}
                  onChange={(e) => handleFilterChange('isImportant', e.target.checked)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">重要なもののみ表示</span>
              </label>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>読み込み中...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p>テストはありません</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTests.map(test => (
              <div 
                key={test.id} 
                className={`bg-white p-4 rounded-lg shadow ${test.isImportant ? 'border-l-4 border-red-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{test.subject}</h3>
                  {test.isImportant && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">重要</span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">実施日:</span> {format(new Date(test.date), 'yyyy/MM/dd')}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">範囲:</span> {test.scope}
                </p>
                {test.teacher && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">担当教員:</span> {test.teacher}
                  </p>
                )}
                {test.relatedTaskId && (
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">関連課題:</span> <a href={`/tasks?id=${test.relatedTaskId}`} className="text-blue-500 hover:underline">リンク</a>
                  </p>
                )}
                <div className="mt-4 border-t pt-2">
                  <button
                    onClick={() => toggleNotification(test.id, true)}
                    className="text-sm text-blue-600 hover:underline mr-3"
                  >
                    通知を受け取る
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tests;