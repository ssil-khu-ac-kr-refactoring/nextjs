// next.config.mjs
import path from 'node:path';
const projectRoot = process.cwd();

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https:",
      "frame-src 'self' https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 배포용 최소 실행본(.next/standalone) 생성 — Dockerfile runner 가 이것을 복사한다.
  output: 'standalone',
  // Prisma client 폴더(런타임 library.js + 쿼리엔진 .node)를 standalone 에 강제 포함.
  // 기본 파일 트레이싱은 Node 라이브러리 런타임을 놓쳐 서버가 런타임에 죽는다.
  outputFileTracingIncludes: {
    '/**': ['./src/generated/prisma/**'],
  },
  poweredByHeader: false,
  images: {
    domains: ['webrefactor.s3.ap-northeast-2.amazonaws.com'],
    remotePatterns: [
      { protocol: 'https', hostname: 'ssil.khu.ac.kr' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(projectRoot, 'src');
    return config;
  },
};

export default nextConfig;
