"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Moon, Pencil, Radio, Telescope } from "lucide-react";
import { useSession } from "next-auth/react";
import { AnimatedHeadline } from "@/components/anim/AnimatedHeadline";
import { FadeIn } from "@/components/anim/FadeIn";
import LatestNewsSlider, { LatestNewsItem } from "@/components/LatestNewsSlider";

function toPlainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toUiContent(c: any) {
  const x = c || {};
  return {
    heroTitle: x.heroTitle ?? "SSIL",
    heroSubtitle: x.heroSubtitle ?? "Space Science Instrument Laboratory",
    heroParagraph: x.heroParagraph ?? "",
    aboutTitle: x.aboutTitle ?? "From space instruments to scientific insight.",
    aboutBody:
      x.aboutParagraph ??
      "SSIL develops space science instruments and analysis technologies to measure and understand space environments, from near-Earth space to the lunar surface.",
    fontFamily: x.fontFamily ?? "MaruBuri",
  };
}

function toApiPayload(ui: Partial<ReturnType<typeof toUiContent>>) {
  const p: any = {};
  if ("heroTitle" in ui) p.heroTitle = ui.heroTitle;
  if ("heroSubtitle" in ui) p.heroSubtitle = ui.heroSubtitle;
  if ("heroParagraph" in ui) p.heroParagraph = ui.heroParagraph;
  if ("aboutTitle" in ui) p.aboutTitle = ui.aboutTitle;
  if ("aboutBody" in ui) p.aboutParagraph = ui.aboutBody;
   if ("fontFamily" in ui) p.fontFamily = ui.fontFamily;
  return p;
}

const CTASection = ({ homeContent, sliderImages, latestNews }: { homeContent: any; sliderImages: any[]; latestNews: LatestNewsItem[] }) => {
  const { data: session } = useSession();
  const isAdmin = !!session;

  const [home, setHome] = useState(() => toUiContent(homeContent));
  useEffect(() => {
    setHome(toUiContent(homeContent));
  }, [homeContent]);

  const [editingHero, setEditingHero] = useState(false);
  const [heroDraft, setHeroDraft] = useState({
    heroTitle: home.heroTitle,
    heroSubtitle: home.heroSubtitle,
  });

  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState({
    aboutTitle: home.aboutTitle,
    aboutBody: home.aboutBody,
  });

  const [saving, setSaving] = useState<"hero" | "about" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const saveHome = async (partialUi: Partial<typeof home>) => {
    setErrorMsg(null);

    const getRes = await fetch("/api/home/content", {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json" },
    });
    if (!getRes.ok) {
      const t = await getRes.text().catch(() => "");
      throw new Error(`GET /api/home/content failed: ${getRes.status} ${t}`);
    }
    const serverNow = await getRes.json().catch(() => ({}));

    const mergedUi = { ...toUiContent(serverNow), ...partialUi };

    const payload = toApiPayload(mergedUi);

    const putRes = await fetch("/api/home/content", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });


    if (!putRes.ok) {
      const txt = await putRes.text().catch(() => "");
      throw new Error(`PUT /api/home/content failed: ${putRes.status} ${txt}`);
    }

    const updated = await putRes.json().catch(() => ({}));
    setHome((prev) => ({ ...prev, ...toUiContent(updated) }));
  };

  const [scrollY, setScrollY] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroTranslate = Math.min(scrollY / 1.5, 300);
  const heroOpacity = Math.max(1 - scrollY / 300, 0);
  const heroScale = Math.max(1 - scrollY / 800, 0.85);

  const images = sliderImages?.map((img) => img.imageUrl) || [];
  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % (images.length || 1));
  }, [images.length]);

  useEffect(() => {
    if (images.length === 0) return;
    const timer = setInterval(next, 12000);
    return () => clearInterval(timer);
  }, [images.length, next]);

  return (
    <>
     <div style={{ fontFamily: `${home.fontFamily || "MaruBuri"}, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif` }}>
    
      <section className="relative flex min-h-screen w-full flex-col items-center overflow-hidden pb-8 pt-[200px] text-foreground lg:h-screen lg:pb-0">
        {images.length > 0 ? (
          <Image
            key={current}
            src={images[current]}
            alt={`slide-${current}`}
            fill
            priority
            sizes="100vw"
            className="object-cover z-10 animate-kenburns brightness-[.65] contrast-110"
          />
        ) : (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <Image
              src="/main/HomepageMain.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover brightness-[.65] contrast-110"
            />
          </div>
        )}

        <div className="absolute inset-0 bg-black/55 z-20" />

        {isAdmin && (
          <div className="absolute right-4 top-4 z-40 text-sm text-muted-foreground">
            {!editingHero ? (
              <button
                onClick={() => {
                  setHeroDraft({ heroTitle: home.heroTitle, heroSubtitle: home.heroSubtitle });
                  setEditingHero(true);
                }}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingHero(false)}
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  Cancel
                </button>
                <span className="select-none">|</span>
                <button
                  disabled={saving === "hero"}
                  onClick={async () => {
                    try {
                      setSaving("hero");
                      await saveHome({
                        heroTitle: heroDraft.heroTitle,
                        heroSubtitle: heroDraft.heroSubtitle,
                      });
                      setHome((p) => ({
                        ...p,
                        heroTitle: heroDraft.heroTitle,
                        heroSubtitle: heroDraft.heroSubtitle,
                      }));
                      setEditingHero(false);
                    } catch (e: any) {
                      setErrorMsg(e?.message || "Save failed");
                    } finally {
                      setSaving(null);
                    }
                  }}
                  className="hover:text-foreground underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {saving === "hero" ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative z-30 w-full max-w-7xl mx-auto px-8 md:px-16 lg:px-24 text-center space-y-6">
          {!editingHero ? (
            <div
              style={{
                transform: `translateY(${heroTranslate}px) scale(${heroScale})`,
                opacity: heroOpacity,
                transition: "transform 0.1s linear, opacity 0.1s linear",
              }}
            >
              <AnimatedHeadline
                primary={home.heroTitle}
                secondary={home.heroSubtitle}
                className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
              />
              {home.heroParagraph && (
                <FadeIn delay={0.6} y={16} className="mt-8 max-w-2xl mx-auto">
                  <p className="text-base md:text-lg text-white/80 leading-relaxed">
                    {home.heroParagraph}
                  </p>
                </FadeIn>
              )}
            </div>
          ) : (
            <div
              className="mx-auto max-w-3xl rounded-xl bg-black/40 p-4 backdrop-blur"
              style={{ transform: `translateY(${heroTranslate}px)`, opacity: heroOpacity }}
            >
              <input
                value={heroDraft.heroTitle}
                onChange={(e) => setHeroDraft((p) => ({ ...p, heroTitle: e.target.value }))}
                className="w-full mb-3 text-4xl md:text-5xl font-extrabold tracking-tight text-primary bg-transparent outline-none border-b border-white/20 pb-2"
                placeholder="Hero Title"
              />
              <input
                value={heroDraft.heroSubtitle}
                onChange={(e) => setHeroDraft((p) => ({ ...p, heroSubtitle: e.target.value }))}
                className="w-full text-2xl md:text-3xl text-white bg-transparent outline-none"
                placeholder="Hero Subtitle"
              />
            </div>
          )}
        </div>
        <LatestNewsSlider items={(latestNews || []).map((item) => ({ ...item, description: toPlainText(item.description) }))} />
      </section>

      <AboutSection
        isAdmin={isAdmin}
        about={home}
        editingAbout={editingAbout}
        setEditingAbout={setEditingAbout}
        aboutDraft={aboutDraft}
        setAboutDraft={setAboutDraft}
        saving={saving === "about"}
        onSaveAbout={async () => {
          try {
            setSaving("about");
            await saveHome({ aboutTitle: aboutDraft.aboutTitle, aboutBody: aboutDraft.aboutBody });
            setHome((p) => ({
              ...p,
              aboutTitle: aboutDraft.aboutTitle,
              aboutBody: aboutDraft.aboutBody,
            }));
            setEditingAbout(false);
          } catch (e: any) {
            setErrorMsg(e?.message || "Save failed");
          } finally {
            setSaving(null);
          }
        }}
      />

      {errorMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-md bg-red-600 text-white px-4 py-2 shadow">
          {errorMsg}
          </div>
       
      )}
      </div>
    </>
  );
};

const missionAreas = [
  {
    title: "Space Science Instrumentation",
    description: "Detectors, electronics, and data acquisition systems for space missions.",
    icon: Telescope,
  },
  {
    title: "Space Environment & Plasma",
    description: "Energetic particles, radiation, spacecraft charging, and plasma environments.",
    icon: Radio,
  },
  {
    title: "Lunar & Planetary Exploration",
    description: "Lunar environment observations and instrumentation for planetary exploration.",
    icon: Moon,
  },
];

const AboutSection = ({
  isAdmin,
  about,
  editingAbout,
  setEditingAbout,
  aboutDraft,
  setAboutDraft,
  saving,
  onSaveAbout,
}) => {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-background px-6 py-20 text-foreground sm:py-24"
    >
      {isAdmin && (
        <div className="absolute right-4 top-4 text-sm text-muted-foreground">
          {!editingAbout ? (
            <button
              onClick={() => {
                setAboutDraft({ aboutTitle: about.aboutTitle, aboutBody: about.aboutBody });
                setEditingAbout(true);
              }}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingAbout(false)}
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Cancel
              </button>
              <span className="select-none">|</span>
              <button
                onClick={onSaveAbout}
                disabled={saving}
                className="hover:text-foreground underline-offset-4 hover:underline disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <FadeIn y={20} duration={0.7} className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Our Mission
          </p>
        </FadeIn>

        {!editingAbout ? (
          <div className="max-w-4xl">
            <FadeIn y={28} duration={0.8} className="mb-5">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {about.aboutTitle}
              </h2>
            </FadeIn>
            <FadeIn y={20} delay={0.12} duration={0.8}>
              <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {about.aboutBody}
              </p>
            </FadeIn>
          </div>
        ) : (
          <div className="max-w-3xl">
            <input
              value={aboutDraft.aboutTitle}
              onChange={(e) => setAboutDraft((p) => ({ ...p, aboutTitle: e.target.value }))}
              className="mb-4 w-full border-b border-border bg-transparent pb-2 text-2xl font-bold outline-none"
              placeholder="Mission headline"
            />
            <textarea
              value={aboutDraft.aboutBody}
              onChange={(e) => setAboutDraft((p) => ({ ...p, aboutBody: e.target.value }))}
              rows={5}
              className="w-full rounded-lg border border-border bg-background p-3 leading-7"
              placeholder="Mission introduction"
            />
          </div>
        )}

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {missionAreas.map(({ title, description, icon: Icon }, index) => (
            <FadeIn key={title} y={24} delay={0.1 * index} className="h-full">
              <article className="h-full rounded-2xl border border-border bg-card/60 p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
