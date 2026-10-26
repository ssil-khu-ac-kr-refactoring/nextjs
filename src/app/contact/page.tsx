export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import PageLayout from "@/components/PageLayout";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export default async function ContactPage() {
  noStore();
  const contact = await prisma.contact.findUnique({ where: { id: 1 } });

  return (
    <PageLayout>
      <section className="pb-12 sm:pb-20">
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 md:space-y-10 md:px-10 lg:px-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-foreground">
            SSIL Contact
          </h1>

          {contact && (
            <>
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-primary">Laboratory Name</h2>
                  <p className="mt-2 break-words text-base leading-relaxed text-foreground/90 sm:text-lg">
                    {contact.labNameKo} ({contact.labNameEn})
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-primary">Laboratory Location</h2>
                  <p className="mt-2 break-words text-base leading-relaxed whitespace-pre-line text-foreground/90 sm:text-lg">
                    {contact.addressKo}
                    <br />
                    {contact.addressEn}
                  </p>
                </div>
              </div>

              <div className="h-[300px] w-full overflow-hidden rounded-xl border border-border shadow-sm sm:h-[360px] md:h-[400px]">
                <iframe
                  src={contact.mapEmbedUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
}