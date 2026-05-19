"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowLeft, Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { sanitizeHtml } from "@/lib/sanitize";
import { BLUR_DATA_URL } from "@/lib/blurDataURL";

const newsDateFormatter =
  typeof Intl !== "undefined"
    ? new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    })
    : null;

function toUiContent(c: any) {
  const x = c || {};
  return {
    heroTitle: x.heroTitle ?? "SSIL",
    heroSubtitle: x.heroSubtitle ?? "Space Science Instrument Laboratory",
    heroParagraph: x.heroParagraph ?? "",
    aboutTitle: x.aboutTitle ?? "Empowering cosmic discovery—one payload at a time.",
    aboutBody:
      x.aboutParagraph ??
      "Since ancient times, people have expressed a variety of interests, ranging from vague admiration for the universe to a brief curiosity. Now, even space travel has reached a time when it is no longer an imagination. Despite these times, and also in these times, people need more scientific understanding of cosmic phenomena, which requires various kinds of observational data in outer space. The Space Science Instrument Laboratory (SSIL) focuses on this research.",
    newsTitle: x.newsTitle ?? "NEWS",
    newsSubtitle: x.newsSubtitle ?? "Check out our latest news and announcements.",
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
  if ("newsTitle" in ui) p.newsTitle = ui.newsTitle;
  if ("newsSubtitle" in ui) p.newsSubtitle = ui.newsSubtitle;
   if ("fontFamily" in ui) p.fontFamily = ui.fontFamily;
  return p;
}

const CTASection = ({ researchData, newsData, homeContent, sliderImages }) => {
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
     <div style={{ fontFamily: home.fontFamily || "MaruBuri" }}>
    
      <section className="relative h-screen w-full flex items-start text-foreground overflow-hidden pt-[200px]">
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
            <h1
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              style={{
                transform: `translateY(${heroTranslate}px) scale(${heroScale})`,
                opacity: heroOpacity,
                textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
                transition: "transform 0.1s linear, opacity 0.1s linear",
              }}
            >
              <span className="text-primary">{home.heroTitle}</span>
              <br />
              <span className="text-white">{home.heroSubtitle}</span>
            </h1>
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

      <ResearchSection researchData={researchData} isAdmin={isAdmin} />

      <section id="news" className="bg-background text-foreground py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-2">
            <h2 className="text-4xl font-bold">{home.newsTitle || "NEWS"}</h2>
            {isAdmin && (
              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-foreground text-background hover:opacity-90"
              >
                <Pencil className="w-4 h-4" />
                Manage News
              </Link>
            )}
          </div>
          <p className="mb-8 text-foreground/70">
            {home.newsSubtitle || "Check out our latest news and announcements."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.isArray(newsData) && newsData.length > 0 ? (
              newsData.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-2xl border border-border/30 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  {isAdmin && (
                    <Link
                      href={`/news/${item.id}?edit=1`}
                      className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-black/70 text-white hover:bg-black/90"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Link>
                  )}
                  <div className="relative w-full h-48 border-b border-border/20">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-foreground/10" />
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <Link
                      href={`/news/${item.id}`}
                      className="text-primary font-semibold text-sm hover:text-primary/80"
                    >
                      READ MORE »
                    </Link>
                    <p className="text-xs mt-2 text-foreground/50">
                      {newsDateFormatter
                        ? newsDateFormatter.format(new Date(item.publishedAt))
                        : new Date(item.publishedAt).toISOString().slice(0, 10)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-3 text-center text-foreground/60">No news available.</p>
            )}
          </div>
        </div>
      </section>

      {errorMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-md bg-red-600 text-white px-4 py-2 shadow">
          {errorMsg}
          </div>
       
      )}
      </div>
    </>
  );
};

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
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "center 60%"],
  });

  const h2X = useTransform(scrollYProgress, [0, 1], ["-300px", "0px"]);
  const h2Opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const pX = useTransform(scrollYProgress, [0, 1], ["300px", "0px"]);
  const pOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={ref}
      id="about"
      className="bg-background text-foreground py-40 px-6 overflow-hidden relative"
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

      <div className="max-w-4xl mx-auto text-center">
        {!editingAbout ? (
          <>
            <motion.h2
              className="text-4xl font-bold mb-6"
              style={{ x: h2X, opacity: h2Opacity }}
              transition={{ type: "spring", stiffness: 45, damping: 30, mass: 1.2 }}
            >
              {about.aboutTitle}
            </motion.h2>
            <motion.p
              className="text-lg text-foreground/70 max-w-3xl mx-auto"
              style={{ x: pX, opacity: pOpacity }}
              transition={{ type: "spring", stiffness: 45, damping: 32, mass: 1.2, delay: 0.15 }}
            >
              {about.aboutBody}
            </motion.p>
          </>
        ) : (
          <div className="mx-auto max-w-3xl text-left">
            <input
              value={aboutDraft.aboutTitle}
              onChange={(e) => setAboutDraft((p) => ({ ...p, aboutTitle: e.target.value }))}
              className="w-full mb-4 text-2xl font-bold bg-transparent outline-none border-b border-border pb-2"
              placeholder="About title"
            />
            <textarea
              value={aboutDraft.aboutBody}
              onChange={(e) => setAboutDraft((p) => ({ ...p, aboutBody: e.target.value }))}
              rows={8}
              className="w-full rounded-lg border border-border bg-background p-3 leading-7"
              placeholder="About body"
            />
          </div>
        )}
      </div>
    </section>
  );
};

const ResearchSection = ({ researchData, isAdmin }) => {
  const [index, setIndex] = useState(0);
  const allProjects = researchData ? [...researchData.Current, ...researchData.Completed] : [];
  const total = allProjects.length;

  const next = useCallback(() => {
    if (total === 0) return;
    setIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    if (total === 0) return;
    setIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total === 0) return;
    const interval = setInterval(next, 10000);
    return () => clearInterval(interval);
  }, [total, next]);

  if (total === 0) return null;

  const current = allProjects[index];
  const category = current.status === "IN_PROGRESS" ? "Current" : "Completed";
  const projectIndexInList = researchData[category].findIndex((p) => p.id === current.id);

  return (
    <section id="research" className="bg-background text-foreground py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-4xl font-bold text-primary">Our Mission</h2>
          {isAdmin && (
            <Link
              href={`/admin/research?cat=${category}&id=${current.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-primary text-primary-foreground hover:opacity-90"
            >
              <Pencil className="w-4 h-4" />
              Edit This Project
            </Link>
          )}
        </div>
        <p className="mb-8 text-primary/80">Recent highlights from SSIL’s research and missions.</p>
      </div>
      <div className="max-w-6xl mx-auto relative overflow-hidden rounded-2xl">
        <div className="relative h-[500px] w-full">
          <Image
            src={current.imageUrl || "/images/main2.jpg"}
            alt={current.title}
            fill
            sizes="(min-width: 1024px) 80vw, 100vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover z-0"
          />
          <div className="absolute inset-0 bg-black/50 z-10" />
          <div className="absolute bottom-12 left-12 z-20 max-w-md">
            <Link href={`/research?cat=${category}&idx=${projectIndexInList}`}>
              <h2 className="text-primary text-3xl font-bold mb-2 cursor-pointer hover:underline">
                {current.title}
              </h2>
            </Link>
            {current.subtitle && (
              <Link href={`/research?cat=${category}&idx=${projectIndexInList}`}>
                <h3 className="text-xl text-foreground font-semibold italic mb-4 cursor-pointer hover:underline">
                  {current.subtitle}
                </h3>
              </Link>
            )}
            <div
              className="text-foreground text-base prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(current.description) }}
            />
          </div>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black/40 hover:bg-black/70 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-background dark:text-foreground" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black/40 hover:bg-black/70 rounded-full"
          >
            <ArrowRight className="w-6 h-6 text-background dark:text-foreground" />
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {allProjects.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === index ? "bg-primary" : "bg-background/40 dark:bg-foreground/40"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
