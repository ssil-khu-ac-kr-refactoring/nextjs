'use client';

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Person } from "@/generated/prisma";
import PageLayout from "@/components/PageLayout";
import { FadeIn } from "@/components/anim/FadeIn";
import { Mail, GraduationCap } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

function getPersonDescriptionHtml(description: string) {
  const containsHtml = /<\/?[a-z][\s\S]*>/i.test(description);
  const sanitized = sanitizeHtml(description);
  return containsHtml ? sanitized : sanitized.replace(/\r?\n/g, "<br />");
}

interface PeopleClientPageProps {
  peopleData: {
    Professor: Person[];
    Current: Person[];
    Alumni: Person[];
  };
}

export default function PeopleClientPage(props: PeopleClientPageProps) {
  return (
    <Suspense fallback={<PageLayout><p className="py-20 text-center text-muted-foreground">Loading...</p></PageLayout>}>
      <PeopleCategoryPage {...props} />
    </Suspense>
  );
}

function PeopleCategoryPage({ peopleData }: PeopleClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabs = ["Professor", "Current", "Alumni"] as const;
  const requestedTab = searchParams.get("cat");
  const selectedTab = tabs.find((tab) => tab === requestedTab) ?? "Professor";
  const profiles = peopleData[selectedTab] || [];
  const F = (v?: string | null) => (v && v.trim() ? v.trim() : "--");

  // Professor는 큰 단일 카드, Current/Alumni는 그리드
  const isFeatured = selectedTab === "Professor";

  return (
    <PageLayout>
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <FadeIn className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            People
          </h1>
          <p className="mt-4 text-foreground/60">
            Meet the members of the Space Science Instrument Laboratory (SSIL).
          </p>
        </FadeIn>

        <div className="flex flex-col gap-8 lg:flex-row">
        {/* Mobile tabs / desktop sidebar */}
        <FadeIn delay={0.1} className="w-full lg:w-60 lg:shrink-0">
          <nav aria-label="People categories" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {tabs.map((t) => {
              const count = peopleData[t]?.length || 0;
              const active = selectedTab === t;
              return (
                <button
                  key={t}
                  onClick={() => router.push(`/people?cat=${t}`, { scroll: false })}
                  aria-current={active ? "page" : undefined}
                  className={`relative shrink-0 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all lg:w-full
                    ${active
                      ? "bg-primary text-primary-foreground shadow"
                      : "border border-border bg-card text-foreground/70 hover:bg-primary/10 hover:text-foreground"
                    }`}
                >
                  <span>{t}</span>
                  <span className={`ml-2 inline-flex items-center justify-center text-xs rounded-full px-1.5 py-0.5
                    ${active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-foreground/10 text-foreground/60"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </FadeIn>

        {/* Profiles */}
        <div className="min-w-0 flex-1">
        {profiles.length === 0 ? (
          <FadeIn className="text-center py-20 border border-dashed border-border rounded-2xl">
            <p className="text-foreground/60">No members in this category yet.</p>
          </FadeIn>
        ) : isFeatured ? (
          // Professor 카드 — 풀폭 magazine style
          <div className="space-y-12">
            {profiles.map((profile, i) => (
              <FadeIn key={profile.id} delay={i * 0.08}>
                <article className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center p-8 md:p-12 rounded-3xl border border-border bg-card shadow-sm hover:shadow-lg transition-shadow">
                  <div className="md:col-span-2">
                    <div className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-2xl bg-muted">
                      <Image
                        src={profile.image || "/images/main2.jpg"}
                        alt={profile.name}
                        fill
                        sizes="(min-width: 768px) 40vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-primary mb-2">
                        {profile.position}
                      </p>
                      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                        {profile.name}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        {F(profile.email)}
                      </span>
                      {profile.degree && (
                        <span className="inline-flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-primary" />
                          {profile.degree}
                        </span>
                      )}
                    </div>
                    {profile.description && (
                      <div
                        className="prose max-w-none leading-relaxed text-foreground/85 dark:prose-invert [&_.ql-align-center]:text-center [&_.ql-align-justify]:text-justify [&_.ql-align-right]:text-right"
                        dangerouslySetInnerHTML={{
                          __html: getPersonDescriptionHtml(profile.description),
                        }}
                      />
                    )}
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        ) : (
          // Current / Alumni — 그리드 카드
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {profiles.map((profile, i) => (
              <FadeIn key={profile.id} delay={(i % 6) * 0.05}>
                <article className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {/* Photo */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                    <Image
                      src={profile.image || "/images/main2.jpg"}
                      alt={profile.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 transition-opacity" />

                    {/* Always visible: name + position */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-primary mb-1">
                        {profile.position}
                      </p>
                      <h3 className="text-xl font-bold text-white">
                        {profile.name}
                      </h3>
                    </div>
                  </div>

                  {/* Expandable details */}
                  <div className="p-5 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground/70">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{F(profile.email)}</span>
                    </div>
                    {profile.degree && (
                      <div className="flex items-start gap-2 text-foreground/70">
                        <GraduationCap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="whitespace-pre-line">{profile.degree}</span>
                      </div>
                    )}
                    {profile.description && (
                      <div
                        className="prose prose-sm line-clamp-3 max-h-20 max-w-none overflow-hidden border-t border-border/60 pt-2 text-foreground/60 dark:prose-invert [&_.ql-align-center]:text-center [&_.ql-align-justify]:text-justify [&_.ql-align-right]:text-right [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_ol]:my-0 [&_p]:my-0 [&_ul]:my-0"
                        dangerouslySetInnerHTML={{
                          __html: getPersonDescriptionHtml(profile.description),
                        }}
                      />
                    )}
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        )}
        </div>
        </div>
      </div>
    </PageLayout>
  );
}
