'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import type { ComponentProps } from 'react';
import type RichEditorComponent from '@/components/RichEditor';

// Dynamically import the RichEditor to prevent SSR issues
const RichEditor = dynamic(() => import('@/components/RichEditor'), { 
  ssr: false,
  loading: () => <p>Loading editor...</p>
}) as React.ComponentType<ComponentProps<typeof RichEditorComponent>>;

// Define the type for a news item
interface NewsData {
    title: string;
    description: string;
    imageUrl?: string | null;
    publishedAt: string;
}

export default function EditNewsPage() {
  const [formData, setFormData] = useState<NewsData>({
    title: '',
    description: '',
    imageUrl: '',
    publishedAt: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { data: session, status } = useSession();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace(`/login?callbackUrl=/admin/news/edit/${id}`);
    }
  }, [ status, router, id]);

  useEffect(() => {
    if (status !== 'authenticated') {
      const fetchNewsData = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/news/${id}`);
          if (!res.ok) {
            throw new Error('Failed to fetch news data');
          }
          const data = await res.json();
          setFormData({
            ...data,
            publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchNewsData();
    }
  }, [ status,id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (html: string) => {
    setFormData(prev => ({ ...prev, description: html }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const body = {
        ...formData,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : new Date().toISOString(),
      };

      const res = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update news item');
      }

      router.push('/admin/news');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'unauthenticated') {
    return <div>Loading authentication...</div>;
  }
  if (isLoading) return <div>Loading news data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit News</h1>
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="mb-4">
          <label htmlFor="title" className="block text-foreground font-bold mb-2">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-foreground font-bold mb-2">Description</label>
          {!isLoading && (
            <RichEditor
              value={formData.description}
              onChange={handleDescriptionChange}
            />
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="imageUrl" className="block text-foreground font-bold mb-2">Image URL (Optional)</label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="text"
            value={formData.imageUrl || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="publishedAt" className="block text-foreground font-bold mb-2">Published Date</label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            value={formData.publishedAt}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}