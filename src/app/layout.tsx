import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "quill/dist/quill.snow.css";
import Providers from "./providers";
import "@/styles/font.css";
import { FontProvider } from "@/context/FontContext";
import { Toaster } from "@/components/Toast";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: {
    default: "경희대학교 우주탑재체 연구실 SSIL | Space Science & Instrumentation Laboratory",
    template: "%s | SSIL Lab",
  },
  description:
    "경희대학교 응용과학대학 우주탑재체 연구실(SSIL, Space Science & Instrumentation Laboratory)은 위성 및 우주관측기기 개발을 중심으로 연구를 수행하고 있습니다. 연구 주제, 논문, 구성원, 장비 정보를 제공합니다.",
  keywords: [
    "경희대학교",
    "우주탑재체 연구실",
    "SSIL",
    "Space Science and Instrumentation Laboratory",
    "우주과학과",
    "경희대 우주과학",
  ],
  authors: [{ name: "SSIL Lab, Kyung Hee University" }],
  openGraph: {
    title: "경희대학교 우주탑재체 연구실 SSIL",
    description:
      "경희대학교 응용과학대학 우주탑재체 연구실(SSIL)의 연구 및 프로젝트를 소개합니다.",
    url: "https://ssil.khu.ac.kr",
    siteName: "SSIL Lab",
    locale: "ko_KR",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <style
          id="__theme_preload"
          dangerouslySetInnerHTML={{ __html: "html{background:#0a0a0a;color:#ededed}" }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  var doc = document.documentElement;
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'light') doc.classList.remove('dark');
    else doc.classList.add('dark');
  } catch (e) { doc.classList.add('dark'); }
})();`,
          }}
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {/* ✅ FontProvider로 전역 감싸기 */}
          <FontProvider>
            {children}
            <Toaster />
          </FontProvider>
        </Providers>
      </body>
    </html>
  );
}
