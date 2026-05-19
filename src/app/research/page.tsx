import { prisma } from "@/lib/prisma";
import ResearchClientPage from "./ResearchClientPage";
import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  noStore();

  const allResearch = await prisma.research.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
  });

  const researchData = {
    Current: allResearch.filter((p) => p.status === "IN_PROGRESS"),
    Completed: allResearch.filter((p) => p.status === "COMPLETED"),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 dark:to-secondary/20 transition-colors">
      <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading research...</div>}>
        <ResearchClientPage researchData={researchData} />
      </Suspense>
    </div>
  );
}
