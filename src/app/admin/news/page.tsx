'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { unstable_noStore as noStore } from 'next/cache';
import Loading from '@/components/Loading';
// Define the type for a news item based on our schema
interface News {
  id: string;
  title: string;
  publishedAt: string;
  imageUrl?: string;
}

export default function NewsAdminPage() {
  noStore();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/admin/news');
    }
  }, [ status, router]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/news');
      if (!res.ok) {
        throw new Error('Failed to fetch news data');
      }
      const data = await res.json();
      setNews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNews();
    }
  }, [status]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const res = await fetch(`/api/news/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          throw new Error('Failed to delete news item');
        }

        fetchNews();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (status === 'unauthenticated') {
    return <div>Loading authentication...</div>;
  }
  if (loading) return <Loading />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">News Management</h1>
        <Link href="/admin/news/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90">
          Add New News
        </Link>
      </div>
      <div className="bg-card rounded-2xl border border-border">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">Published At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-foreground/60 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {news.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(item.publishedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.title} width={40} height={40} className="object-cover rounded" />
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/admin/news/edit/${item.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                    Delete
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