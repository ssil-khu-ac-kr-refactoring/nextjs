'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PageLayout from "@/components/PageLayout";
import PublicationForm, { PublicationFormValues } from "@/components/PublicationForm";
import { toast } from "@/components/Toast";

export const dynamic = "force-dynamic";

function groupByYear<T extends { year: number }>(items: T[]) {
  const map = new Map<number, T[]>();
  for (const it of items) {
    const arr = map.get(it.year) ?? [];
    arr.push(it);
    map.set(it.year, arr);
  }
  return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
}

export default function PublicationPage() {
  const { data: session } = useSession();
  const isAdmin = !!session;

  const [pubs, setPubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/publications", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch publications");
        setPubs(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/publications");
    const updated = await res.json();
    setPubs(updated);
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this publication?")) return;
    const delRes = await fetch(`/api/publications/${id}`, { method: "DELETE" });
    if (!delRes.ok) {
      toast.error("삭제에 실패했습니다.");
      return;
    }
    handleSave();
  };

  if (loading)
    return (
      <PageLayout>
        <p className="text-muted-foreground text-center py-20">Loading…</p>
      </PageLayout>
    );

  if (error)
    return (
      <PageLayout>
        <p className="text-red-500 text-center py-20">Error: {error}</p>
      </PageLayout>
    );

  const byYear = groupByYear(pubs);

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        <header className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold mb-3 tracking-tight text-foreground">
            Publications
          </h1>
          <p className="text-lg text-muted-foreground">
            Peer-reviewed papers, conference proceedings, and preprints.
          </p>
        </header>

        {isAdmin && (
          <div className="text-right mb-10">
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition"
            >
              + Add Publication
            </button>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-card text-foreground p-6 rounded-2xl w-full max-w-2xl shadow-xl relative border border-border">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditItem(null);
                }}
                className="absolute top-4 right-4 text-foreground/60 hover:text-foreground transition"
              >
                ✕
              </button>
              <h2 className="text-xl font-semibold mb-4">
                {editItem ? "Edit Publication" : "Add Publication"}
              </h2>
              <PublicationForm
                initialData={editItem}
                onSubmit={async (data: PublicationFormValues) => {
                  const method = editItem ? "PUT" : "POST";
                  const url = editItem
                    ? `/api/publications/${editItem.id}`
                    : "/api/publications";
                  const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  if (!res.ok) {
                    toast.error("Error saving publication");
                    return;
                  }
                  handleSave();
                }}
                buttonText={editItem ? "Update" : "Create"}
                isSubmitting={false}
              />
            </div>
          </div>
        )}

        {byYear.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <p className="text-foreground/60">No publications available yet.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {byYear.map(([year, list]) => (
              <section key={year}>
                <h2 className="text-3xl font-bold text-primary mb-6 border-b border-border pb-2">
                  {year}
                </h2>
                <ul className="space-y-6">
                  {list.map((p) => {
                    const link = p.url || p.pdfUrl;
                    return (
                      <li
                        key={p.id}
                        className="rounded-2xl border border-border bg-card hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 p-6 shadow-sm"
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold leading-snug text-foreground">
                              {link ? (
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary transition-colors"
                                >
                                  {p.title}
                                </a>
                              ) : (
                                p.title
                              )}
                            </h3>
                            <p className="text-muted-foreground mt-1">
                              {p.authors}
                            </p>
                            {(p.venue || p.month) && (
                              <p className="text-sm text-foreground/70 mt-1">
                                {p.venue}
                                {p.month
                                  ? ` • ${String(p.month).padStart(2, "0")}/${p.year}`
                                  : ""}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 shrink-0">
                            {p.pdfUrl && (
                              <a
                                href={p.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-primary/10 transition"
                              >
                                PDF
                              </a>
                            )}
                            {p.url && (
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-primary/10 transition"
                              >
                                Link
                              </a>
                            )}
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex justify-end gap-3 mt-3">
                            <button
                              onClick={() => {
                                setEditItem(p);
                                setShowForm(true);
                              }}
                              className="text-primary hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}