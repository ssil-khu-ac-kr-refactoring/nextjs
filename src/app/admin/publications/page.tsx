// app/admin/publication/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

type Publication = {
  id: number;
  title: string;
  authors: string;
  venue?: string | null;
  year: number;
  month?: number | null;
  url?: string | null;
  pdfUrl?: string | null;
};

export default function ManagePublicationPage() {
  const router = useRouter();
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/publications', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch publications');
        setPubs(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this publication?')) return;
    try {
      const res = await fetch(`/api/publications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete publication');
      setPubs(pubs.filter(p => p.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <Loading />;
  if (error)   return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Publications</h1>
        <Link
          href="/admin/publications/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl"
        >
          Add New Publication
        </Link>
      </div>

      {/* 테이블 */}
      <div className="bg-card rounded-2xl border border-border">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Authors</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {pubs.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* 제목 클릭 시 외부 링크/내부 링크 우선 연결 */}
                  {p.url || p.pdfUrl ? (
                    <a
                      href={(p.url ?? p.pdfUrl)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {p.title}
                    </a>
                  ) : (
                    p.title
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{p.authors}</td>
                <td className="px-6 py-4 whitespace-nowrap">{p.venue ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {p.month ? `${String(p.month).padStart(2, '0')}/` : ''}
                  {p.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => router.push(`/admin/publications/edit/${p.id}`)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {pubs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-foreground/60">
                  No publications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
