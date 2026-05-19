import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import PageLayout from "@/components/PageLayout";
import NewsDetailClient from "./_client";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;

  noStore();

  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) notFound();

  const publishedDateStr = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(news.publishedAt));

  return (
    <PageLayout>
      <NewsDetailClient
        startInEdit={resolvedSearch?.edit === "1"}
        initialItem={{
          id: news.id,
          title: news.title,
          description: news.description ?? "",
          contentHtml: (news as any).contentHtml ?? null,
          imageUrl: news.imageUrl ?? null,
          publishedAt: news.publishedAt.toISOString(),
          publishedDateStr,
        }}
      />
    </PageLayout>
  );
}
