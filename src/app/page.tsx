import Header from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();

  const [allResearch, newsData, homeContent, sliderImages] = await Promise.all([
    prisma.research.findMany({
      orderBy: [{ order: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.news.findMany({ orderBy: { publishedAt: "desc" }, take: 3 }),
    prisma.homePageContent.findUnique({ where: { id: 1 } }),
    prisma.sliderImage.findMany({ orderBy: { order: "asc" } }),
  ]);

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