import Header from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

// ISR: 홈을 60초 캐시 → HOME 네비게이션 즉시 응답 + Link 프리페치 가능.
// (admin 편집 반영은 최대 60초 지연 — 편집 당사자는 클라이언트 상태로 즉시 보임)
export const revalidate = 60;

export default async function HomePage() {
  // ISR 프리렌더는 빌드 시점에 실행되는데, 그때는 DATABASE_URL이 없다.
  // DB 미연결/다운 시 기본값으로 렌더하고, 런타임에 revalidate로 실제 데이터를 채운다.
  let allResearch: any[] = [];
  let newsData: any[] = [];
  let homeContent: any = null;
  let sliderImages: any[] = [];

  try {
    [allResearch, newsData, homeContent, sliderImages] = await Promise.all([
      prisma.research.findMany({
        orderBy: [{ order: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.news.findMany({ orderBy: { publishedAt: "desc" }, take: 3 }),
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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Header />

      <CTASection
        researchData={researchData}
        newsData={newsData}
        homeContent={homeContent}
        sliderImages={sliderImages}
      />

      <Footer />
    </div>
  );
}