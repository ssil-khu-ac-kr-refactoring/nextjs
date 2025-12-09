import { prisma } from "@/lib/prisma";
import ResearchClientPage from "./ResearchClientPage";
import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  noStore();

  const allResearch = await prisma.research.findMany({
    orderBy: { createdAt: "desc" },
  });

  const researchData = {
   Current: allResearch
    .filter((p) => p.status === "IN_PROGRESS")
    .sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA; // 최신순
    }),

  Completed: allResearch
    .filter((p) => p.status === "COMPLETED")
    .sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 dark:to-secondary/20 transition-colors">
      <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading research...</div>}>
        <ResearchClientPage researchData={researchData} />
      </Suspense>
    </div>
  );
}
