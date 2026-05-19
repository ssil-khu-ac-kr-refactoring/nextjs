'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Loading from '@/components/Loading';

type ResearchStatus = 'IN_PROGRESS' | 'COMPLETED';

interface Research {
  id: string;
  title: string;
  status: ResearchStatus;
  createdAt: string;
}

export default function ResearchAdminPage() {
  const [research, setResearch] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchResearch() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/research', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch research data');
      const data = (await res.json()) as Research[];
      setResearch(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchResearch(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    const prev = research;
    setResearch((list) => list.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/research/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setResearch(prev);
    }
  }

  if (loading) return <Loading />;
  if (error) return <div className="p-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Research Management</h1>
        <Link href="/admin/research/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90">
          Add New Research
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {research.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">{item.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/research/edit/${item.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {research.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-foreground/60" colSpan={4}>No items yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
