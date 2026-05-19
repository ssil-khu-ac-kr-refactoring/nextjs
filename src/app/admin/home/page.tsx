'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { unstable_noStore as noStore } from 'next/cache';
import { toast } from '@/components/Toast';

// Define types for our data
interface HomePageContent {
  heroTitle: string;
  heroSubtitle: string;
  heroParagraph: string;
  aboutTitle: string;
  aboutParagraph: string;
  newsTitle: string;
  newsSubtitle: string;
  fontFamily?: string; // ✅ 추가
}

// font 목록 정의
const fontOptions = [
  "MaruBuri",
  "Nanum Gothic",
  "Nanum Barun Gothic",
  "Nanum Gothic Eco",
  "Nanum Myungjo",
  "Holigas",
  "Mickerr",
  "Space Grotesk",
];

interface SliderImage {
  id: number;
  imageUrl: string;
  altText?: string;
  order: number;
}

export default function ManageHomePage() {
  noStore();
  const [content, setContent] = useState<Partial<HomePageContent>>({});
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);

  const [images, setImages] = useState<SliderImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ 데이터 가져오기
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/home/content');
        if (!res.ok) throw new Error('Failed to fetch content');
        const data = await res.json();
        setContent(data);
      } catch (err: any) {
        setContentError(err.message);
      } finally {
        setContentLoading(false);
      }
    };

    const fetchImages = async () => {
      try {
        const res = await fetch('/api/home/slider');
        if (!res.ok) throw new Error('Failed to fetch images');
        const data = await res.json();
        setImages(data);
      } catch (err: any) {
        setImagesError(err.message);
      } finally {
        setImagesLoading(false);
      }
    };

    fetchContent();
    fetchImages();
  }, []);

  // ✅ 텍스트 입력 핸들러
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContent((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ 텍스트 저장
  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContentLoading(true);
    try {
      const res = await fetch('/api/home/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error('Failed to save content');
      toast.success('Content saved successfully!');
    } catch (err: any) {
      setContentError(err.message);
    } finally {
      setContentLoading(false);
    }
  };

  // ✅ 이미지 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewImageFile(e.target.files[0]);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageFile) {
      setImagesError('Please select a file to upload.');
      return;
    }
    
    setIsUploading(true);
    setImagesError(null);

    const formData = new FormData();
    formData.append('file', newImageFile);

    try {
      const res = await fetch('/api/home/slider', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const newImage = await res.json();
      setImages([...images, newImage]);
      setNewImageFile(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setImagesError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ 이미지 삭제
  const handleDeleteImage = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`/api/home/slider/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete image');
      setImages(images.filter((img) => img.id !== id));
    } catch (err: any) {
      setImagesError(err.message);
    }
  };

  // ✅ 실제 화면 렌더링
  return (
    <div className="container mx-auto px-4 space-y-12">
      <h1 className="text-3xl font-bold">Manage Home Page</h1>

      {/* Text Content Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Text Content</h2>
        {contentError && <p className="text-red-500">{contentError}</p>}

        {contentLoading ? (
          <p>Loading content...</p>
        ) : (
          <form onSubmit={handleContentSubmit} className="space-y-4 bg-white p-6 shadow rounded">

            {/* ✅ 폰트 선택 섹션 */}
            <div>
              <label className="font-bold">Font Family</label>
              <select
                name="fontFamily"
                value={content.fontFamily || ""}
                onChange={handleContentChange}
                className="w-full p-2 border rounded"
              >
                <option value="">기본 폰트</option>
                {fontOptions.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ 미리보기 */}
            {content.fontFamily && (
              <div
                className="mt-4 p-4 border rounded"
                style={{ fontFamily: content.fontFamily }}
              >
                <p className="text-lg">폰트 미리보기: {content.fontFamily}</p>
                <p>이 폰트로 적용됩니다.</p>
              </div>
            )}

            <hr />

            {/* ✅ 기존 텍스트 입력 필드들 */}
            <div>
              <label className="font-bold">Hero Title</label>
              <input
                type="text"
                name="heroTitle"
                value={content.heroTitle || ''}
                onChange={handleContentChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="font-bold">Hero Subtitle</label>
              <input
                type="text"
                name="heroSubtitle"
                value={content.heroSubtitle || ''}
                onChange={handleContentChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="font-bold">Hero Paragraph</label>
              <textarea
                name="heroParagraph"
                value={content.heroParagraph || ''}
                onChange={handleContentChange}
                rows={5}
                className="w-full p-2 border rounded"
              />
            </div>

            <hr />

            <div>
              <label className="font-bold">About Title</label>
              <input
                type="text"
                name="aboutTitle"
                value={content.aboutTitle || ''}
                onChange={handleContentChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="font-bold">About Paragraph</label>
              <textarea
                name="aboutParagraph"
                value={content.aboutParagraph || ''}
                onChange={handleContentChange}
                rows={5}
                className="w-full p-2 border rounded"
              />
            </div>

            <hr />

            <div>
              <label className="font-bold">News Title</label>
              <input
                type="text"
                name="newsTitle"
                value={content.newsTitle || ''}
                onChange={handleContentChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="font-bold">News Subtitle</label>
              <input
                type="text"
                name="newsSubtitle"
                value={content.newsSubtitle || ''}
                onChange={handleContentChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <button
              type="submit"
              disabled={contentLoading}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {contentLoading ? 'Saving...' : 'Save Text Content'}
            </button>
          </form>
        )}
      </section>

      {/* Slider Images Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Slider Images</h2>
        {imagesError && <p className="text-red-500 py-2">{imagesError}</p>}

        <form onSubmit={handleAddImage} className="flex items-center gap-4 mb-4 bg-white p-6 shadow rounded">
          <div>
            <label htmlFor="file-upload" className="font-medium">Upload new image:</label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            type="submit"
            disabled={isUploading || !newImageFile}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-400 self-end"
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </form>

        {imagesLoading ? (
          <p>Loading images...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map(image => (
              <div key={image.id} className="border rounded p-2">
                <div className="relative w-full h-32 rounded overflow-hidden">
                  <Image src={image.imageUrl} alt={image.altText || 'Slider image'} fill className="object-cover" />
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                  >
                    X
                  </button>
                </div>
                <p className="text-xs truncate mt-2" title={image.imageUrl}>{image.imageUrl}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
