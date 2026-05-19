'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Loading from "@/components/Loading";
import PageLayout from "@/components/PageLayout";
import { toast } from "@/components/Toast";
import { defaultAbout } from "@/lib/aboutContent";
import { sanitizeHtml } from "@/lib/sanitize";
import { FadeIn } from "@/components/anim/FadeIn";
import { Rocket, Telescope, Cpu, Users } from "lucide-react";

const RichEditor = dynamic<{
  value: string;
  onChange: (value: string) => void;
}>(
  () => import("@/components/RichEditor"),
  { ssr: false, loading: () => <p>Loading editor...</p> }
);

export default function AboutPage() {
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated";

  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 데이터 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/about/content", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load content");
        const data = await res.json();
        setContent(data.content || "");
      } catch {
        setContent(defaultAbout.body1);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🔹 저장 함수
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/about/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("About 페이지가 저장되었습니다.");
      setEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const stats = [
    { icon: Rocket, label: "Active Missions", value: "5+" },
    { icon: Telescope, label: "Years of Research", value: "10+" },
    { icon: Cpu, label: "Instruments Built", value: "20+" },
    { icon: Users, label: "Research Members", value: "15+" },
  ];

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <FadeIn>
            <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">
              About SSIL
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              Advancing space science
              <br />
              through instrumentation.
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-foreground/70 leading-relaxed">
              Space Science Instrument Laboratory at Kyung Hee University designs,
              simulates, and builds payloads for space missions — particle
              detectors, plasma probes, and beyond.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-16 -mt-12 md:-mt-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map(({ icon: Icon, label, value }, i) => (
            <FadeIn key={label} delay={i * 0.08}>
              <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <Icon className="w-7 h-7 text-primary mb-3" />
                <p className="text-3xl md:text-4xl font-bold tracking-tight">
                  {value}
                </p>
                <p className="mt-1 text-sm text-foreground/60">{label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Editable rich-text content */}
      <main className="max-w-4xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <FadeIn>
          {/* Admin controls */}
          <div className="flex justify-end mb-6">
            {isAdmin && !editing && (
              <Button variant="outline" onClick={() => setEditing(true)} className="rounded-full">
                ✏️ Edit
              </Button>
            )}
            {isAdmin && editing && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving} className="rounded-full">
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>

          {!editing ? (
            <div
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:tracking-tight prose-headings:font-bold
                prose-p:leading-relaxed prose-p:text-foreground/85
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
            />
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="[&_.ql-container]:bg-white [&_.ql-editor]:text-black [&_.ql-container]:rounded-xl">
                <RichEditor value={content} onChange={setContent} />
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center mt-4">{error}</div>
          )}
        </FadeIn>
      </main>
    </PageLayout>
  );
}
