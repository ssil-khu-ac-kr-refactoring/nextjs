import { prisma } from "@/lib/prisma";
import OutcomeClientPage from "./OutcomeClientPage";
import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OutcomePage() {
  noStore();

  const outcomes = await prisma.outcome.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 dark:to-secondary/20 transition-colors">
      <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading...</div>}>
        <OutcomeClientPage outcomes={outcomes} />
      </Suspense>
    </div>
  );
}
