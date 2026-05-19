'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import type { ComponentProps } from 'react';
import type RichEditorComponent from '@/components/RichEditor';

const RichEditor = dynamic(() => import('@/components/RichEditor'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
}) as React.ComponentType<ComponentProps<typeof RichEditorComponent>>;

interface BoardTab {
  id: number;
  name: string;
}

interface BoardPostData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  publishedAt: string;
  tabId: number;
}

export default function EditBoardPostPage() {
  const [formData, setFormData] = useState<BoardPostData>({
    id: '',
    title: '',
    description: '',
    imageUrl: '',
    publishedAt: new Date().toISOString().split('T')[0],
    tabId: 0,
  });
  const [tabs, setTabs] = useState<BoardTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { data: session, status } = useSession();

  // 로그인 확인
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace(`/login?callbackUrl=/admin/board/posts/edit/${id}`);
    }
  }, [status, router, id]);

  // 카테고리 + 게시글 데이터 로드
  useEffect(() => {
    const fetchTabs = async () => {
      const res = await fetch('/api/board/tabs');
      const data = await res.json();
      setTabs(data);
    };
    fetchTabs();

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/board/posts/${id}`);
        if (!res.ok) throw new Error('게시글을 불러오지 못했습니다.');
        const data = await res.json();
        setFormData({
          ...data,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          tabId: data.tabId,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (html: string) => {
    setFormData((prev) => ({ ...prev, description: html }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const body = {
        ...formData,
        tabId: Number(formData.tabId),
        publishedAt: new Date(formData.publishedAt).toISOString(),
      };

      const res = await fetch(`/api/board/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '게시글 수정 실패');
      }

      router.push('/admin/board/posts');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading post...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">게시글 수정</h1>
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        {/* 카테고리 선택 */}
        <div className="mb-4">
          <label className="block text-foreground font-bold mb-2">카테고리</label>
          <select
            name="tabId"
            value={formData.tabId}
            onChange={handleChange}
            className="border rounded w-full p-2"
            required
          >
            <option value="">카테고리 선택</option>
            {tabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* 제목 */}
        <div className="mb-4">
          <label className="block text-foreground font-bold mb-2">제목</label>
          <input
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="border rounded w-full p-2"
            required
          />
        </div>

        {/* 본문 */}
        <div className="mb-4">
          <label className="block text-foreground font-bold mb-2">본문</label>
          <RichEditor
            value={formData.description}
            onChange={handleDescriptionChange}
          />
        </div>

        {/* 이미지 URL */}
        <div className="mb-4">
          <label className="block text-foreground font-bold mb-2">이미지 URL</label>
          <input
            name="imageUrl"
            type="text"
            value={formData.imageUrl || ''}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
        </div>

        {/* 날짜 */}
        <div className="mb-4">
          <label className="block text-foreground font-bold mb-2">게시일</label>
          <input
            name="publishedAt"
            type="date"
            value={formData.publishedAt}
            onChange={handleChange}
            className="border rounded w-full p-2"
          />
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl"
          >
            {isSubmitting ? '수정 중...' : '수정 완료'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-xl"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}