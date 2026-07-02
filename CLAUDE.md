# CLAUDE.md — SSIL (KHU 우주과학연구실) 웹사이트

> 이 파일은 Claude(및 다른 AI 에이전트)가 이 저장소를 **정확히** 이해하고 안전하게 수정하도록 돕는 지침서입니다.
> 추측하지 말고, 여기 적힌 사실과 아래 **Quarkify 코드맵**으로 구조를 확인한 뒤 작업하세요.

---

## 1. 프로젝트 개요

경희대학교 우주과학연구실(SSIL) 공식 웹사이트 + 관리자 CMS + **SPIS**(위성 대전 분석) 모듈.

- **프레임워크**: Next.js **15.5.x** (App Router, React 19), TypeScript.
- **DB**: PostgreSQL + **Prisma 6.14**.
- **인증**: NextAuth v4 (`src/lib/auth.ts`, `/api/auth/[...nextauth]`), 역할 기반(`Role` enum).
- **패키지 매니저**: **pnpm 10.16** (`packageManager` 필드에 고정). npm/yarn 쓰지 말 것.
- **스타일**: Tailwind (v3 core + `@tailwindcss/postcss` v4 플러그인), Radix UI, `src/components/ui`.
- **3D/시각화**: three.js + @react-three/fiber/drei (SPIS 지구본).
- **배포**: GitHub Actions → GHCR 이미지 → NAS webhook (아래 6절).

---

## 2. 디렉터리 지도 (실측)

```
src/
  app/                      # Next App Router
    (public)/               # page.tsx: /, about, contact, news, people, publications, research, spis, login, post/*
    admin/                  # 관리자 CMS (about/board/home/news/people/publications/research/spis) — admin/layout.tsx 가 보호
    api/                    # 47개 route.ts (REST) — auth, board, news, people, publications, research, home, contact, upload, files, spis/*
  components/               # 공용 컴포넌트 (Navbar, Footer, RichEditor, *Form, *Editor …)
    ui/                     # Radix 기반 프리미티브
    spis/                   # SPIS 전용: SpisApp, Globe3D, WorldMap, PolarMap, SpisControls
    anim/                   # 애니메이션
  lib/                      # prisma, auth, api-auth, sanitize, aboutContent, utils, spis/*
    spis/                   # SPIS 과학/데이터: lt, solar, ovation, parseWorkbook, colorScale, dataApi, types
  generated/prisma/         # ⚠️ Prisma Client 생성물 (gitignore, 커밋 안 함). @/generated/prisma 로 import
  hooks/ context/ contexts/ styles/ types/
prisma/
  schema.prisma             # 13 models + 3 enums
  migrations/               # SQL 마이그레이션 (배포 시 자동 적용)
docs/SPIS.md                # SPIS 모듈 상세 문서 (코드맵·데이터흐름·LT변환·OVATION)
middleware.ts               # 라우트 미들웨어
Dockerfile / .github/workflows/main.yml   # 빌드·배포
```

Prisma 모델: `Research, News, Person, HomePageContent, SliderImage, Asset, Contact, AboutContent, Publication, BoardTab, BoardPost, SpisPotential`.
Enum: `ResearchStatus, Role, AssetOwnerType`.

---

## 3. 반드시 지킬 규칙 (할루시네이션 방지)

1. **Prisma Client 는 `@/generated/prisma` 에서 import** 한다. `@prisma/client` 아님.
   - 이유: pnpm 은 client 를 `.pnpm` 가상스토어에 생성해 최상위 `node_modules/.prisma` 가 없다. 그래서 `schema.prisma` 의 generator `output = "../src/generated/prisma"` 로 소스 트리에 고정 생성한다.
   - 클론 직후/스키마 변경 후 `npx prisma generate` 필요. `src/generated/prisma` 는 gitignore 라 커밋하지 않는다.
2. **경로 별칭 `@` = `src/`** (`tsconfig.json` + `next.config.mjs` webpack alias).
3. **패키지 설치는 pnpm** 만. `corepack pnpm install`.
4. **API 인증**: 관리자 전용 라우트는 `requireAdmin()` (`src/lib/api-auth.ts`) 로 보호. 새 관리자 API 추가 시 동일 패턴 사용.
5. **사용자 입력 HTML** 은 `src/lib/sanitize.ts`(DOMPurify) 통과. 리치 에디터 콘텐츠 저장/렌더 시 필수.
6. **보안 override**: transitive 취약점은 `package.json` 의 `pnpm.overrides` 로 관리. 새 취약점 알림은 여기서 최소 버전 상향으로 대응(설치 후 `next build` 검증).

---

## 4. SPIS 모듈

위성 표면 전위 데이터를 2D 지도/3D 지구본으로 시각화 + NOAA OVATION 오로라 오버레이.
자세한 코드맵·데이터흐름·좌표 변환(LT→경도)·OVATION 연동은 **[docs/SPIS.md](docs/SPIS.md)** 참고.

핵심만:
- 위치 입력은 **LT(지방시)** 로 들어와 `lonForLT()` (`src/lib/spis/lt.ts`) 로 경도 변환 후 렌더 시점(now) 기준 배치.
- 3D 오로라 = **NOAA SWPC OVATION Prime** 실시간(5분) — `src/lib/spis/ovation.ts`.
- 데이터는 한셀 `All_node` xlsx 업로드(`/api/spis/import`) → Prisma `SpisPotential` → `/api/spis/simulations`.

---

## 5. 개발 명령

```bash
corepack pnpm install        # 의존성
npx prisma generate          # Prisma Client → src/generated/prisma
corepack pnpm dev            # 개발 서버 (turbopack)
corepack pnpm build          # 프로덕션 빌드 (output: 'standalone')
corepack pnpm lint
```

---

## 6. 빌드 · 배포 파이프라인

- `next.config.mjs`: **`output: 'standalone'`** + `outputFileTracingIncludes` 로 `src/generated/prisma`(런타임 `library.js` + 쿼리엔진 `.node`)를 standalone 에 강제 포함. (pnpm+Prisma+standalone 조합의 트레이싱 누락 방지 — 빼면 런타임에 죽는다.)
- `Dockerfile`: deps→builder→migrator→runner 멀티스테이지. runner 는 standalone + `prisma`(스키마/마이그레이션) + 별도 hoisted prisma CLI 만 복사.
  - 컨테이너 시작: `prisma migrate deploy && node server.js` → **마이그레이션 자동 적용**. 새 마이그레이션 파일만 커밋하면 배포 시 반영됨.
- `.github/workflows/main.yml`: **master push 시** GitHub Actions 러너에서 이미지 빌드→GHCR push→`notify-nas` 잡이 NAS webhook 호출(`docker compose pull && up -d`). PR 트리거는 없다(= PR 단계 CI 없음).
  - ⚠️ NAS webhook URL 은 ngrok 무료 터널(하드코딩)이라 재시작 시 바뀔 수 있음. 배포 후 반영 안 되면 이 URL/토큰부터 확인.

---

## 7. 코드 인텔리전스 — Quarkify (구조 파악은 여기서)

이 저장소는 **Quarkify** 정적분석 코드맵을 사용한다. "무엇이 무엇을 호출/렌더하는가, 어디 정의됐는가, 바꾸면 뭐가 영향받는가" 같은 **구조적 질문은 파일을 헤매지 말고 코드맵으로 확인**하라 — 할루시네이션(없는 함수/경로 지어내기)을 막는 것이 목적이다.

### 코드맵 생성/갱신
```bash
cd /Users/sonhyeonbin/Downloads/Quarkify/quarkify
node quarkify.mjs configs/ssil.mjs        # → /Users/sonhyeonbin/Downloads/ssil/_quarkify_out/ssil
```
출력(`_quarkify_out/ssil`, gitignore)은 소스를 **물리 폴더 토폴로지**로 분해한다: 함수 1개=폴더 1개, 호출=`call__X`, **JSX 렌더=`render__Component`**, 정의 연결=`resolves_to__`. 현재 규모: 약 **130 파일 / 17,866 쿼크 / 1,728 액손**.

### 셸로 질의 (파일 안 열고 구조 파악)
```bash
OUT=/Users/sonhyeonbin/Downloads/ssil/_quarkify_out/ssil
ls  $OUT/_mirror/by_role/                          # 역할별: api_handler, page, spis_science, spis_viz, ui_component, hook, db_access, auth …
ls  $OUT/_mirror/by_file/                           # 파일별 심볼
fd -t d "call__requireAdmin" $OUT/quark            # requireAdmin() 호출 지점 전부
fd -t d "render__Globe3D"    $OUT/quark            # <Globe3D/> 를 렌더하는 컴포넌트
cat $OUT/quark_meta.json                            # 심볼 → file:line 매핑
cat $OUT/ai_context_guide.txt                       # 에이전트용 사용 안내
```

### 규칙
- 심볼 위치/시그니처, 호출·렌더 관계, 영향 범위는 **Quarkify 로 먼저 확인**하고 그 결과를 신뢰한다(전체 AST 파싱 결과다). grep 으로 재검증하지 말 것.
- 코드 수정 후에는 코드맵을 다시 생성해야 최신 상태가 된다(파일 워처 없음).
- `_quarkify_out/` 은 로컬 분석 산출물이라 **커밋 금지**(`.gitignore` 처리됨).

---

## 8. 자주 밟는 지뢰

- `@prisma/client` 로 import → 런타임/빌드 깨짐. 반드시 `@/generated/prisma`.
- `next.config` 의 `output:'standalone'` / `outputFileTracingIncludes` 를 지우면 Docker 런타임에서 Prisma 로딩 실패.
- master 에 머지 = 즉시 프로덕션 배포(NAS 재시작). PR 단계 CI 가 없으니 머지 전 로컬 `next build` 로 검증할 것.
- 의존성은 pnpm + `pnpm.overrides`. lockfile 은 pnpm 으로만 갱신.
