"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Test } from '../_types/test';
import { useAuth } from '../hooks/useAuth';
import TestForm from '../_components/TestForm';
import { format } from 'date-fns';
import { Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import Button from '../_components/Button';

const Tests: React.FC = () => {
  useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sortOrder, setSortOrder] = useState<'test_date' | 'subject'>('test_date');
  const [filter, setFilter] = useState({
    subject: '',
    is_important: false,
  });
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

    if (filter.is_important) {
      filtered = filtered.filter(test => test.is_important);
    }

    // Apply sorting
    if (sortOrder === 'test_date') {
      filtered.sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());
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
    const value = e.target.value === "date" ? "test_date" : e.target.value;
    setSortOrder(value as "subject" | "test_date");
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedTest(null);
    setIsEditing(false);
    fetchTests();
  };

  const handleEditClick = (test: Test) => {
    setSelectedTest(test);
    setIsEditing(true);
    setShowForm(true);
    // ページの上部にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (testId: string) => {
    setDeleteConfirmId(testId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', deleteConfirmId);
      
      if (error) throw error;
      
      // 削除が成功したら、削除したテストをリストから除外
      setTests(prev => prev.filter(test => test.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('テストの削除に失敗しました。');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddNewClick = () => {
    setSelectedTest(null);
    setIsEditing(false);
    setShowForm(!showForm);
  };


  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">テスト・小テスト</h1>
        <button 
          onClick={handleAddNewClick}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          {showForm && !isEditing ? 'フォームを閉じる' : '新しいテストを追加'}
        </button>
      </div>
      
      {showForm && (
        <div className="mb-6">
          <TestForm 
            onSuccess={handleFormSuccess} 
            initialTest={isEditing ? selectedTest || undefined : undefined}
            isEditing={isEditing}
          />
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
              <option value="test_date">実施日順</option> 
              <option value="subject">教科順</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filter.is_important}
                onChange={(e) => handleFilterChange('is_important', e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">重要なもののみ表示</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* 削除確認モーダル */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle className="mr-2" />
              <h3 className="text-lg font-bold">テストを削除しますか？</h3>
            </div>
            <p className="text-gray-600 mb-6">
              このテストを削除すると、関連する全ての情報が完全に削除されます。この操作は元に戻せません。
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4"
              >
                キャンセル
              </Button>
              <Button 
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    削除中...
                  </>
                ) : '削除する'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
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
              className={`bg-white p-4 rounded-lg shadow ${test.is_important ? 'border-l-4 border-red-500' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{test.subject}</h3>
                {test.is_important && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">重要</span>
                )}
              </div>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">実施日:</span> {format(new Date(test.test_date), 'yyyy/MM/dd')}
              </p>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">範囲:</span> {test.scope}
              </p>
              {test.teacher && (
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">担当教員:</span> {test.teacher}
                </p>
              )}
              {test.related_task_id && (
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">関連課題:</span> <a href={`/tasks?id=${test.related_task_id}`} className="text-blue-500 hover:underline">リンク</a>
                </p>
              )}
              <div className="mt-4 border-t pt-3 flex justify-between">
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditClick(test)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="編集"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(test.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="削除"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                {/* 通知設定のボタンも残しておく（実装は後回し） */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tests;