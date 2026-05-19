'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { ComponentProps } from 'react';
import type RichEditorComponent from '@/components/RichEditor';
import Loading from '@/components/Loading';

const RichEditor = dynamic(() => import('@/components/RichEditor'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
}) as React.ComponentType<ComponentProps<typeof RichEditorComponent>>;

type ResearchStatus = 'IN_PROGRESS' | 'COMPLETED';

interface ResearchData {
  title: string;
  description: string | null;
  contentHtml: string | null;
  imageUrl: string | null;
  status: ResearchStatus;
  startDate?: string | null;
  endDate?: string | null;
  order?: number;
}

export default function EditResearchPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [formData, setFormData] = useState<Partial<ResearchData>>({});
  const [contentHtml, setContentHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/research/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch research data');
        const data: ResearchData & { createdAt: string } = await res.json();
        setFormData({
          title: data.title,
          description: data.description ?? '',
          imageUrl: data.imageUrl ?? '',
          status: data.status,
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
          order: data.order ?? 0,
        });
        setContentHtml(data.contentHtml ?? '');
        setImageUrl(data.imageUrl || '');
      } catch (err: any) {
        setError(err.message ?? 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/research/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || '',
          description: formData.description || null,
          contentHtml: contentHtml || null,
          imageUrl: imageUrl || null,           // ✅ URL만 전송
          status: (formData.status as ResearchStatus) || 'IN_PROGRESS',
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          order: typeof formData.order === 'number' ? formData.order : 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update research item');
      router.push('/admin/research');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Loading />;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Research</h1>

      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <div>
          <label htmlFor="title" className="block text-foreground font-bold mb-2">Title</label>
          <input id="title" name="title" value={formData.title || ''} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>

        <div>
          <label htmlFor="description" className="block text-foreground font-bold mb-2">Summary (optional)</label>
          <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} className="w-full p-2 border rounded h-28" />
        </div>

        <div>
          <label className="block text-foreground font-bold mb-2">Content</label>
          <RichEditor value={contentHtml} onChange={setContentHtml} />
        </div>

        {/* Thumbnail Upload */}
        <div>
          <label className="block text-foreground font-bold mb-2">썸네일 이미지 (Optional)</label>
          {imageUrl ? (
            <div className="space-y-2">
              <img src={imageUrl} alt="Thumbnail preview" className="w-48 h-32 object-cover rounded" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Change Image
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-foreground/60 file:mr-4 file:py-2 file:px-4 file:rounded-full 
                         file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary 
                         hover:file:bg-primary/20"
            />
          )}
        </div>

        <div>
          <label htmlFor="status" className="block text-foreground font-bold mb-2">Status</label>
          <select id="status" name="status" value={formData.status || 'IN_PROGRESS'} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-foreground font-bold mb-2">Start Date</label>
            <input id="startDate" name="startDate" type="date" value={formData.startDate || ''} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-foreground font-bold mb-2">End Date</label>
            <input id="endDate" name="endDate" type="date" value={formData.endDate || ''} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label htmlFor="order" className="block text-foreground font-bold mb-2">
              Order <span className="text-xs font-normal text-foreground/60">(낮을수록 위)</span>
            </label>
            <input
              id="order"
              name="order"
              type="number"
              value={formData.order ?? 0}
              onChange={(e) => setFormData((p) => ({ ...p, order: Number(e.target.value) || 0 }))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs italic">{error}</p>}

        <div className="flex items-center justify-between">
          <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl" disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Updating...' : 'Update'}
          </button>
          <button type="button" onClick={() => router.back()} className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-xl">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
