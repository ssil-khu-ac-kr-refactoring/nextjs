'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type RichEditorComponent from '@/components/RichEditor';

const RichEditor = dynamic(() => import('@/components/RichEditor'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
}) as React.ComponentType<ComponentProps<typeof RichEditorComponent>>;

export default function NewOutcomePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');  // plain text
  const [contentHtml, setContentHtml] = useState('');  // rich text
  const [imageUrl, setImageUrl] = useState('');        // URL only
  const [published, setPublished] = useState(true);
  const [order, setOrder] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      setImageUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || null,                       // 비우면 제목에서 자동 생성
          description: description || null,
          contentHtml: contentHtml || null,
          imageUrl: imageUrl || null,
          published,
          order,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create outcome item');
      router.push('/admin/outcome');
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Outcome</h1>

      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <div>
          <label htmlFor="title" className="block text-foreground font-bold mb-2">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded" required />
        </div>

        <div>
          <label htmlFor="slug" className="block text-foreground font-bold mb-2">
            Slug <span className="text-xs font-normal text-foreground/60">(비우면 제목에서 자동 생성)</span>
          </label>
          <input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g. cubesat-development" />
        </div>

        <div>
          <label htmlFor="description" className="block text-foreground font-bold mb-2">Summary (optional)</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded h-28" />
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
                onClick={() => setImageUrl('')}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="published" className="block text-foreground font-bold mb-2">Published</label>
            <label className="inline-flex items-center gap-2 p-2">
              <input
                id="published"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">공개 페이지(/outcome)에 표시</span>
            </label>
          </div>
          <div>
            <label htmlFor="order" className="block text-foreground font-bold mb-2">
              Order <span className="text-xs font-normal text-foreground/60">(낮을수록 위)</span>
            </label>
            <input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs italic">{error}</p>}

        <div className="flex items-center justify-between">
          <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button type="button" onClick={() => router.back()} className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-xl">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
