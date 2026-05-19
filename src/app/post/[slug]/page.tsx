import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Navbar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

function createPreview(html: string, length: number = 100) {
  const text = html.replace(/<[^>]*>/g, "");
  if (text.length <= length) return text;
  return text.substring(0, length) + "…";
}

export default async function BoardCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const { slug } = await params;

  const tab = await prisma.boardTab.findUnique({
    where: { slug },
    include: {
      posts: {
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!tab) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500 text-lg">존재하지 않는 카테고리입니다.</p>
        </main>
      </>
    );
  }

  const posts = tab.posts;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary-rgb/20">
        <main className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-16">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                {tab.name.toUpperCase()}
              </h1>
              {tab.description && (
                <p className="text-xl text-foreground/80">{tab.description}</p>
              )}
            </header>

            {posts.length === 0 ? (
              <p className="text-center text-gray-500">게시글이 없습니다.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((item) => (
                  <Card
                    key={item.id}
                    className="flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 bg-card/20 border border-border/10"
                  >
                    <div className="relative w-full h-48 overflow-hidden rounded-t-2xl">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 flex-grow space-y-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm text-foreground/70 line-clamp-3">
                        {createPreview(item.description || "")}
                      </p>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 mt-auto">
                      <div className="w-full">
                        <div className="text-xs text-foreground/50 mb-2">
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString()
                            : ""}
                        </div>
                        <Link
                          href={`/post/${tab.slug}/${item.id}`}
                          className="text-primary font-semibold text-sm hover:text-primary/80 hover:underline"
                        >
                          READ MORE »
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
