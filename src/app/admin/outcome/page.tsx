'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Loading from '@/components/Loading';

const PROTECTED_SLUG = 'satellite-surface-charging';

interface Outcome {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  order: number;
  createdAt: string;
}

export default function OutcomeAdminPage() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchOutcomes() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/outcome', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch outcome data');
      const data = (await res.json()) as Outcome[];
      setOutcomes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOutcomes(); }, []);

  async function handleDelete(item: Outcome) {
    if (item.slug === PROTECTED_SLUG) {
      alert(`'${PROTECTED_SLUG}' 항목은 SPIS 시각화로 특수 렌더링되므로 삭제할 수 없습니다.\n숨기려면 게시(Published)를 끄세요.`);
      return;
    }
    if (!confirm('삭제하시겠습니까?')) return;
    const prev = outcomes;
    setOutcomes((list) => list.filter((o) => o.id !== item.id));
    try {
      const res = await fetch(`/api/outcome/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setOutcomes(prev);
    }
  }

  async function handleTogglePublished(item: Outcome) {
    const prev = outcomes;
    setOutcomes((list) => list.map((o) => (o.id === item.id ? { ...o, published: !o.published } : o)));
    try {
      const res = await fetch(`/api/outcome/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !item.published }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setOutcomes(prev);
    }
  }

  if (loading) return <Loading />;
  if (error) return <div className="p-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Outcome Management</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/spis"
            className="bg-zinc-700 text-white px-4 py-2 rounded-xl hover:bg-zinc-600"
          >
            위성 대전 데이터 업로드 (Surface Charging)
          </Link>
          <Link href="/admin/outcome/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90">
            Add New Outcome
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Published</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {outcomes.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  {item.title}
                  {item.slug === PROTECTED_SLUG && (
                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      SPIS
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-foreground/60">{item.slug}</td>
                <td className="px-6 py-4">{item.order}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleTogglePublished(item)}
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                    title="클릭하여 게시 상태 전환"
                  >
                    {item.published ? 'Published' : 'Hidden'}
                  </button>
                </td>
                <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/outcome/edit/${item.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item)}
                    className={item.slug === PROTECTED_SLUG ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {outcomes.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-foreground/60" colSpan={6}>No items yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
