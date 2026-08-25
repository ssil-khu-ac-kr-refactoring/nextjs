'use client';

import { useRouter } from 'next/navigation';
import NewsForm from '@/app/news/NewsForm';

// 이전에는 이 페이지가 BoardPost 작성 폼의 복사본이라 "Add New News"가
// 실제로는 News가 아니라 BoardPost를 생성했다(10개월간 잠복).
// News 전용 NewsForm(create)을 재사용해 /api/news 로 올바르게 생성한다.
export default function NewNewsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">새 뉴스 작성</h1>
      <NewsForm
        mode="create"
        onSuccess={() => {
          router.push('/admin/news');
          router.refresh();
        }}
      />
    </div>
  );
}
