'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { unstable_noStore as noStore } from 'next/cache';

interface BoardPost {
  id: string;
  title: string;
  publishedAt?: string;
  imageUrl?: string;
  tab?: { id: number; name: string };
}

interface BoardTab {
  id: number;
  name: string;
}

export default function BoardPostAdminPage() {
  noStore();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [tabs, setTabs] = useState<BoardTab[]>([]);
  const [selectedTab, setSelectedTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') router.replace('/login?callbackUrl=/admin/board/posts');
  }, [status, router]);

  const fetchTabs = async () => {
    const res = await fetch('/api/board/tabs');
    const data = await res.json();
    setTabs(data);
  };

  const fetchPosts = async (tabId?: number) => {
    try {
      setLoading(true);
      const url = tabId ? `/api/board/posts?tabId=${tabId}` : '/api/board/posts';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTabs();
      fetchPosts(selectedTab ?? undefined);
    }
  }, [status, selectedTab]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    const res = await fetch(`/api/board/posts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('삭제에 실패했습니다.');
      return;
    }
    fetchPosts(selectedTab ?? undefined);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">게시판 관리</h1>
        <Link href="/admin/board/posts/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          새 글 작성
        </Link>
      </div>

      {/* ✅ 카테고리 선택 */}
      <div className="mb-4">
        <select
          value={selectedTab ?? ''}
          onChange={(e) => setSelectedTab(e.target.value ? Number(e.target.value) : null)}
          className="border p-2 rounded"
        >
          <option value="">전체 보기</option>
          {tabs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow-md rounded">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">게시일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이미지</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4">{p.title}</td>
                <td className="px-6 py-4">{p.tab?.name ?? '—'}</td>
                <td className="px-6 py-4">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4">
                  {p.imageUrl ? <Image src={p.imageUrl} alt={p.title} width={40} height={40} className="object-cover rounded" /> : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/board/posts/edit/${p.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                    수정
                  </Link>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900">
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