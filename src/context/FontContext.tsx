"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface FontContextType {
  fontFamily: string;
  setFontFamily: (font: string) => void;
  reloadFont: () => void; // 수동 리로드 함수
}

const FontContext = createContext<FontContextType>({
  fontFamily: "MaruBuri",
  setFontFamily: () => {},
  reloadFont: () => {},
});

export const FontProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontFamily, setFontFamily] = useState("MaruBuri");

  // ✅ 서버에서 현재 저장된 폰트 불러오기
  const reloadFont = async () => {
    try {
      const res = await fetch("/api/home/content", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load font");
      const data = await res.json();
      setFontFamily(data.fontFamily || "MaruBuri");
    } catch {
      setFontFamily("MaruBuri");
    }
  };

  useEffect(() => {
    reloadFont();
  }, []);

  return (
    <FontContext.Provider value={{ fontFamily, setFontFamily, reloadFont }}>
      {/* ✅ body 안쪽 전체에 폰트 적용 (MaruBuri 미로드 시 한글 시스템폰트로 폴백 — serif 낙하 방지) */}
      <div
        style={{
          fontFamily: `${fontFamily}, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </FontContext.Provider>
  );
};

export const useFont = () => useContext(FontContext);
