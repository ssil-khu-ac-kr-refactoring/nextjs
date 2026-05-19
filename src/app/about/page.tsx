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

  return (
    <PageLayout>
      <main className="relative p-6 max-w-5xl mx-auto">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center mb-6">
        

          {isAdmin && !editing && (
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
              className="flex items-center gap-2"
            >
              ✏️ Edit
            </Button>
          )}

          {isAdmin && editing && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-gray-400 text-gray-700 hover:bg-gray-100"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        {/* ✅ 본문 */}
        {!editing ? (
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
          />
        ) : (
          <div className="bg-white text-black rounded-lg shadow-md border border-gray-200 p-6">
            <div className="[&_.ql-container]:bg-white [&_.ql-editor]:text-black">
              <RichEditor value={content} onChange={setContent} />
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center mt-4">{error}</div>
        )}
      </main>
    </PageLayout>
  );
}
