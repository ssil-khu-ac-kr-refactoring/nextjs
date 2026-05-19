"use client";

import { useEffect, useState } from "react";
import { unstable_noStore as noStore } from 'next/cache';
import Loading from "@/components/Loading";
import { toast } from "@/components/Toast";
type Contact = {
  labNameKo: string;
  labNameEn: string;
  addressKo: string;
  addressEn: string;
  mapEmbedUrl: string;
};

export default function ManageContactPage() {
   noStore();
  const [contact, setContact] = useState<Partial<Contact>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/contact", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch contact");
        const data = await res.json();
        setContact(data);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContact((p) => ({ ...p, [name]: value }));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Saved!");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold">Manage Contact</h1>
      {err && <p className="text-red-500">{err}</p>}

      <form onSubmit={onSave}  className="space-y-6 bg-white p-6 rounded border border-border shadow-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">Lab Name (Korean)</label>
            <input
              name="labNameKo"
              value={contact.labNameKo || ""}
              onChange={onChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="font-semibold">Lab Name (English)</label>
            <input
              name="labNameEn"
              value={contact.labNameEn || ""}
              onChange={onChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold">Address (Korean)</label>
          <textarea
            name="addressKo"
            rows={3}
            value={contact.addressKo || ""}
            onChange={onChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="font-semibold">Address (English)</label>
          <textarea
            name="addressEn"
            rows={3}
            value={contact.addressEn || ""}
            onChange={onChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="font-semibold">Map Embed URL</label>
          <input
            name="mapEmbedUrl"
            value={contact.mapEmbedUrl || ""}
            onChange={onChange}
            className="w-full p-2 border rounded"
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
        </div>

        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded">
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      {/* 미리보기 */}
      <div className="p-4 rounded border border-border-rgb/20 bg-card-rgb/10">
        <div className="text-sm text-foreground-rgb/60 mb-2">Map Preview</div>
        <div className="w-full h-[400px] rounded overflow-hidden">
          {contact.mapEmbedUrl ? (
            <iframe
              src={contact.mapEmbedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-foreground-rgb/50">
              No map URL
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
