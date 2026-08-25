'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PublicationForm, { PublicationFormValues } from '@/components/PublicationForm';

export default function EditPublicationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [initialData, setInitialData] = useState<PublicationFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/publications/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch publication');
        const data = await res.json();
        setInitialData({
          title: data.title,
          authors: data.authors,
          venue: data.venue,
          year: data.year,
          month: data.month,
          url: data.url,
          pdfUrl: data.pdfUrl,
          category: data.category ?? 'SCI',
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  const handleSubmit = async (formData: PublicationFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/publications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to update publication');
      }
      router.push('/admin/publications'); // 리스트 경로에 맞춰 조정
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-300">Error: {error}</div>;
  if (!initialData) return <div className="p-6">Publication not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Publication</h1>
      <PublicationForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        buttonText="Update Publication"
      />
    </div>
  );
}
