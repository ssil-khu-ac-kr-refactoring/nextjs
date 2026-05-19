'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { unstable_noStore as noStore } from 'next/cache';
import { toast } from '@/components/Toast';

interface BoardTab {
  id: number;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export default function BoardTabAdminPage() {
  noStore();
  const [tabs, setTabs] = useState<BoardTab[]>([]);
  const [editingTab, setEditingTab] = useState<BoardTab | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    order: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/admin/board/tabs');
    }
  }, [status, router]);

  const fetchTabs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/board/tabs');
      if (!res.ok) throw new Error('Failed to fetch tabs');
      const data = await res.json();
      setTabs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') fetchTabs();
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingTab ? 'PUT' : 'POST';
      const url = editingTab ? `/api/board/tabs/${editingTab.id}` : '/api/board/tabs';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to save tab');
      await fetchTabs();
      setFormData({ name: '', slug: '', description: '', order: 0 });
      setEditingTab(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (tab: BoardTab) => {
    setEditingTab(tab);
    setFormData({
      name: tab.name,
      slug: tab.slug,
      description: tab.description || '',
      order: tab.order,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/board/tabs/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('삭제에 실패했습니다.');
      return;
    }
    fetchTabs();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">게시판 탭 관리</h1>

      {/* ✅ Form 영역 */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 p-4 bg-gray-50 border rounded-md shadow-sm"
      >
        <h2 className="text-lg font-semibold mb-4">
          {editingTab ? '탭 수정' : '새 탭 추가'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">탭 이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug(ENG Only)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">설명</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">표시 순서</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) =>
              setFormData({ ...formData, order: Number(e.target.value) })
            }
            className="w-full border rounded p-2"
          />
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90"
          >
            {editingTab ? '수정 완료' : '추가'}
          </button>
          {editingTab && (
            <button
              type="button"
              onClick={() => {
                setEditingTab(null);
                setFormData({ name: '', slug: '', description: '', order: 0 });
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* ✅ 목록 테이블 */}
      <div className="bg-card rounded-2xl border border-border">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">이름</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Slug</th>
              <th className="px-6 py-3 text-left text-sm font-medium">설명</th>
              <th className="px-6 py-3 text-left text-sm font-medium">순서</th>
              <th className="px-6 py-3 text-right text-sm font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tabs.map((tab) => (
              <tr key={tab.id}>
                <td className="px-6 py-4">{tab.name}</td>
                <td className="px-6 py-4">{tab.slug}</td>
                <td className="px-6 py-4">{tab.description || '-'}</td>
                <td className="px-6 py-4">{tab.order}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(tab)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(tab.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}