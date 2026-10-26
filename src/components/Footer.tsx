import React from "react";
import { prisma } from "@/lib/prisma";

type Contact = {
  labNameKo: string;
  labNameEn: string;
  addressKo: string;
  addressEn: string;
  mapEmbedUrl?: string;
};

const DEFAULT_CONTACT: Contact = {
  labNameKo: "우주과학탑재체연구실",
  labNameEn: "Space Science Instrument Laboratory",
  addressKo:
    "(우)17104 경기도 용인시 기흥구 덕영대로 1732\n경희대학교 국제캠퍼스 천문대",
  addressEn:
    "Kyung Hee University Global Campus Observatory\n1732 Deogyeong-daero, Giheung-gu, Yongin-si, Gyeonggi-do 17104, Korea",
  mapEmbedUrl: "",
};

async function getContact(): Promise<Contact> {
  // 서버 컴포넌트에서 상대경로 fetch("/api/contact")는 Node 런타임에서
  // "Failed to parse URL"로 항상 실패해 DEFAULT_CONTACT만 반환됐다(=CMS 무시).
  // DB를 직접 조회한다. 빌드 프리렌더 시 DB 미연결이면 catch로 기본값 사용.
  try {
    const row = await prisma.contact.findUnique({ where: { id: 1 } });
    return { ...DEFAULT_CONTACT, ...(row ?? {}) };
  } catch {
    return DEFAULT_CONTACT;
  }
}

export default async function Footer() {
  const contact = await getContact();

  return (
    <footer className="bg-[#0f0f0f] px-4 py-10 text-white sm:px-6 sm:py-14">
      <div className="max-w-6xl mx-auto">
        <h2 className="mb-6 text-2xl font-bold text-orange-400 sm:mb-8 sm:text-3xl">Contact</h2>

        {/* Lab Name */}
        <div className="mb-6">
          <h3 className="text-orange-400 font-semibold">Laboratory Name</h3>
          <p className="break-words text-base leading-relaxed sm:text-lg">
            {contact.labNameKo} ({contact.labNameEn})
          </p>
        </div>

        {/* Location (KOR/ENG) */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-orange-400 font-semibold mb-1">Address (KOR)</h3>
            <p className="break-words whitespace-pre-line text-sm leading-relaxed text-white/90 sm:text-base">{contact.addressKo}</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-semibold mb-1">Address (ENG)</h3>
            <p className="break-words whitespace-pre-line text-sm leading-relaxed text-white/90 sm:text-base">{contact.addressEn}</p>
          </div>
        </div>

        {/* Google Map (optional) */}
        {contact.mapEmbedUrl ? (
          <div className="mb-10 rounded-lg overflow-hidden border border-white/10">
            <iframe
              src={contact.mapEmbedUrl}
              width="100%"
              height="320"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[260px] w-full sm:h-[320px]"
            />
          </div>
        ) : null}

        <hr className="border-t border-white/20 my-8" />
        <p className="text-sm text-gray-400 text-center">
          © {new Date().getFullYear()} Space Science Instrument Laboratory. All rights reserved.
        </p>
      </div>
    </footer>
  );
}