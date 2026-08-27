import Header from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { BLUR_DATA_URL } from "@/lib/blurDataURL";

function formatResearchStartDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

// ISR: 홈을 60초 캐시 → HOME 네비게이션 즉시 응답 + Link 프리페치 가능.
// (admin 편집 반영은 최대 60초 지연 — 편집 당사자는 클라이언트 상태로 즉시 보임)
export const revalidate = 60;

export default async function HomePage() {
  // ISR 프리렌더는 빌드 시점에 실행되는데, 그때는 DATABASE_URL이 없다.
  // DB 미연결/다운 시 기본값으로 렌더하고, 런타임에 revalidate로 실제 데이터를 채운다.
  let allResearch: any[] = [];
  let homeContent: any = null;
  let sliderImages: any[] = [];

  try {
    [allResearch, homeContent, sliderImages] = await Promise.all([
      prisma.research.findMany({
        orderBy: [{ order: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.homePageContent.findUnique({ where: { id: 1 } }),
      prisma.sliderImage.findMany({ orderBy: { order: "asc" } }),
    ]);
  } catch (e) {
    console.warn("[HomePage] data fetch 실패 (빌드 시 DB 미연결 또는 DB 다운) — 기본값으로 렌더", e);
  }

  const researchData = {
    Current: allResearch.filter((p) => p.status === "IN_PROGRESS"),
    Completed: allResearch.filter((p) => p.status === "COMPLETED"),
  };

  const currentResearchCards = researchData.Current.map((research, idx) => ({
    research,
    idx,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Header />

      <CTASection
        homeContent={homeContent}
        sliderImages={sliderImages}
      />

      {currentResearchCards.length > 0 && (
        <section className="border-t border-border bg-card/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Current Research
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentResearchCards.map(({ research, idx }) => (
                <Link
                  key={research.id}
                  href={`/research?cat=Current&idx=${idx}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-secondary/30">
                    {research.imageUrl ? (
                      <Image
                        src={research.imageUrl}
                        alt={research.title}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Research
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {research.title}
                    </h3>
                    {research.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {research.description}
                      </p>
                    )}
                    {research.startDate && (
                      <p className="mt-auto pt-4 text-xs font-medium text-muted-foreground">
                        Since {formatResearchStartDate(research.startDate)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
