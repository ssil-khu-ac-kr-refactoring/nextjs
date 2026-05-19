import Header from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function BoardPostDetail({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;

  const post = await prisma.boardPost.findUnique({
    where: { id },
    include: { tab: true },
  });

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500 text-lg">게시글을 찾을 수 없습니다.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <article className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4">{post.title}</h1>

        <p className="text-sm text-gray-500 mb-6">
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString()
            : ""}
          {" • "}
          {post.tab?.name}
        </p>

        {post.imageUrl && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <Image
              src={post.imageUrl}
              alt={post.title}
              width={900}
              height={500}
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.description) }}
        />
      </article>
    </>
  );
}
