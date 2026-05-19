'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/Toast';

// ✅ 이미 프로젝트에 있는 RichEditor 재활용
const RichEditor = dynamic<{
  value: string;
  onChange: (value: string) => void;
}>(
  () => import('@/components/RichEditor'),
  { ssr: false, loading: () => <p>Loading editor...</p> }
);

export default function ManageAboutPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 기존 About 데이터 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/about/content', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load content');
        const data = await res.json();
        setContent(data.content || '');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🔹 저장 함수
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/about/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to save content');
      toast.success('About 페이지가 저장되었습니다.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Manage About Page</h1>

      {/* ✅ 박스 배경 + 버튼 스타일 조정 */}
      <div className="bg-white text-black rounded-lg shadow-md border border-gray-200 p-6">
        <div className="[&_.ql-container]:bg-white [&_.ql-editor]:text-black">
          <RichEditor value={content} onChange={setContent} />
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button
            variant="outline"
            className="border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
            disabled={saving}
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white transition"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
