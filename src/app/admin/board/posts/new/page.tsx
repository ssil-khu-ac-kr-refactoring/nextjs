'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import type { ComponentProps } from 'react';
import type RichEditorComponent from '@/components/RichEditor';
import { toast } from '@/components/Toast';

// ✅ RichEditor 동적 로드 (SSR 이슈 방지)
const RichEditor = dynamic(() => import('@/components/RichEditor'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
}) as React.ComponentType<ComponentProps<typeof RichEditorComponent>>;

interface BoardTab {
  id: number;
  name: string;
}

export default function NewBoardPostPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tabId, setTabId] = useState<number | null>(null);
  const [tabs, setTabs] = useState<BoardTab[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { data: session, status } = useSession();

  // ✅ 로그인 확인
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/board/posts/new');
    }
  }, [status, router]);

  // ✅ 카테고리 목록 로드
  useEffect(() => {
    const fetchTabs = async () => {
      const res = await fetch('/api/board/tabs');
      const data = await res.json();
      setTabs(data);
    };
    fetchTabs();
  }, []);

  // ✅ 이미지 업로드 핸들러
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload image');
      const data = await res.json();
      setImageUrl(data.url); // 업로드 후 받은 url 저장
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ 게시글 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tabId) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const body = {
        title,
        description,
        imageUrl: imageUrl || null,
        tabId,
        publishedAt: new Date(publishedAt).toISOString(),
      };

      const res = await fetch('/api/board/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create post');
      }

      router.push('/admin/board/posts');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'unauthenticated') return <div>Loading authentication...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">새 게시글 작성</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {/* ✅ 카테고리 선택 */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">카테고리</label>
          <select
            value={tabId ?? ''}
            onChange={(e) => setTabId(Number(e.target.value))}
            className="border rounded w-full p-2"
            required
          >
            <option value="">카테고리 선택</option>
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ 제목 */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded w-full p-2"
            required
          />
        </div>

        {/* ✅ 본문 */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">본문</label>
          <RichEditor value={description} onChange={(html) => setDescription(html)} />
        </div>

        {/* ✅ 썸네일 업로드 */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">썸네일 이미지 (선택)</label>
          {imageUrl ? (
            <div className="space-y-2">
              <img
                src={imageUrl}
                alt="Thumbnail preview"
                className="w-48 h-32 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                이미지 변경
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                         file:rounded-full file:border-0 file:text-sm file:font-semibold 
                         file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          )}
        </div>

        {/* ✅ 게시일 */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">게시일</label>
          <input
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="border rounded w-full p-2"
          />
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}