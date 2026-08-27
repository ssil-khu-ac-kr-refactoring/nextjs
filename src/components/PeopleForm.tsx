'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type RichEditorComponent from '@/components/RichEditor';

const RichEditor = dynamic(() => import('@/components/RichEditor'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
}) as React.ComponentType<ComponentProps<typeof RichEditorComponent>>;

interface PersonFormData {
  name: string;
  position: string;
  description: string;
  image: string;
  email: string;
  degree: string;
  role: 'PROFESSOR' | 'CURRENT' | 'ALUMNI';
  order: number;
}

interface PersonFormProps {
  initialData?: Partial<PersonFormData>;
  onSubmit: (data: PersonFormData) => Promise<void>;
  isSubmitting: boolean;
  buttonText: string;
}

export default function PersonForm({ initialData, onSubmit, isSubmitting, buttonText }: PersonFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialData?.image || '');
  const [formData, setFormData] = useState<PersonFormData>({
    name: initialData?.name || '',
    position: initialData?.position || '',
    description: initialData?.description || '',
    image: initialData?.image || '',
    email: initialData?.email || '',
    degree: initialData?.degree || '',
    role: initialData?.role || 'CURRENT',
    order: initialData?.order ?? 0,
  });
  

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
      setFormData((prev) => ({ ...prev, image: data.url }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow-md rounded-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position (e.g., Ph.D. Student)</label>
        <input type="text" name="position" id="position" value={formData.position} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <div>
        <label htmlFor="degree" className="block text-sm font-medium text-gray-700">Degree (e.g., M.S.)</label>
        <input type="text" name="degree" id="degree" value={formData.degree} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
        <select name="role" id="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          <option value="PROFESSOR">Professor</option>
          <option value="CURRENT">Current Member</option>
          <option value="ALUMNI">Alumni</option>
        </select>
      </div>

      <div>
        <label htmlFor="order" className="block text-sm font-medium text-gray-700">
          Order <span className="font-normal text-gray-500">(lower numbers appear first)</span>
        </label>
        <input
          type="number"
          name="order"
          id="order"
          value={formData.order}
          onChange={(e) => setFormData((prev) => ({ ...prev, order: Number(e.target.value) || 0 }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

       {/* Thumbnail Upload */}
        <div>
          <label className="block text-gray-700 mb-2">Person Image</label>
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
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full 
                         file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 
                         hover:file:bg-blue-100"
            />
          )}
        </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <RichEditor
          value={formData.description}
          onChange={(description) => setFormData((prev) => ({ ...prev, description }))}
          minHeight={220}
          placeholder="Add a formatted profile description..."
        />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
          {buttonText}
        </button>
      </div>
    </form>
  );
}
