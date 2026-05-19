'use client';

import Header from "@/components/Navbar";
import React, { useState } from "react";
import Image from "next/image";
import { Person } from "@prisma/client";
import PageLayout from "@/components/PageLayout";

export const dynamic = "force-dynamic";

interface PeopleClientPageProps {
  peopleData: {
    Professor: Person[];
    Current: Person[];
    Alumni: Person[];
  };
}

export default function PeopleClientPage({ peopleData }: PeopleClientPageProps) {
  const tabs = ["Professor", "Current", "Alumni"] as const;
  const [selectedTab, setSelectedTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const profiles = peopleData[selectedTab] || [];
  const F = (v?: string | null) => (v && v.trim() ? v.trim() : "--");

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <header className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold mb-3 tracking-tight text-foreground">
            People
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <nav className="space-y-3 col-span-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTab(t)}
                className={`w-full text-left py-2.5 px-4 rounded-xl border transition-all ${selectedTab === t
                    ? "bg-primary/10 text-primary font-semibold border-primary/30"
                    : "bg-card text-foreground/70 hover:text-foreground hover:border-border/60 border-border"
                  }`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="col-span-3 space-y-10">
            {profiles.length > 0 ? (
              profiles.map((profile) => (
                <section
                  key={profile.id}
                  className="flex flex-col lg:flex-row items-start gap-6 p-6 border border-border bg-card rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex-shrink-0 self-center lg:self-start">
                    <Image
                      src={profile.image || "/images/main2.jpg"}
                      alt={profile.name}
                      width={192}
                      height={192}
                      className="w-48 h-48 rounded-xl object-cover bg-muted"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                        {profile.name}
                      </h2>
                      <p className="text-muted-foreground italic">
                        {F(profile.position)}
                      </p>
                    </div>

                    <div className="bg-card/70 rounded-lg p-4 text-foreground border border-border/50">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                          <dt className="text-sm text-muted-foreground">Email</dt>
                          <dd className="font-medium">{F(profile.email)}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm text-muted-foreground">Degree</dt>
                          <dd className="font-medium whitespace-pre-line">
                            {F(profile.degree)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-card/70 p-4 rounded-lg text-foreground border border-border/50">
                      <h3 className="text-sm text-muted-foreground mb-2">
                        Description
                      </h3>
                      <p className="whitespace-pre-line leading-relaxed text-foreground/90">
                        {profile.description || "--"}
                      </p>
                    </div>
                  </div>
                </section>
              ))
            ) : (
              <div className="text-center py-20 border border-dashed border-border rounded-2xl">
                <p className="text-foreground/60">
                  No members in this category yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}