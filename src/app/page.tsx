import Header from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();

  const allResearch = await prisma.research.findMany({
    orderBy: { createdAt: "desc" },
  });
  const byStartDateDesc = (a: typeof allResearch[number], b: typeof allResearch[number]) => {
    const da = a.startDate ? new Date(a.startDate).getTime() : 0;
    const db = b.startDate ? new Date(b.startDate).getTime() : 0;
    return db - da;
  };
  const researchData = {
    Current: allResearch.filter((p) => p.status === "IN_PROGRESS").sort(byStartDateDesc),
    Completed: allResearch.filter((p) => p.status === "COMPLETED").sort(byStartDateDesc),
  };

  const newsData = await prisma.news.findMany({
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const homeContent = await prisma.homePageContent.findUnique({
    where: { id: 1 },
  });

  const sliderImages = await prisma.sliderImage.findMany({
    orderBy: { order: "asc" },
  });

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