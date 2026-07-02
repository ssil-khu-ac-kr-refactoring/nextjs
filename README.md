# SSIL — 경희대 우주과학연구실 웹사이트

경희대학교 우주과학연구실(SSIL) 공식 웹사이트 + 관리자 CMS + **Outcome / Satellite Surface Charging**(위성 표면 대전) 시각화 모듈.

- 프레임워크: **Next.js 15** (App Router, React 19), TypeScript
- DB: **PostgreSQL** + **Prisma 6**
- 인증: **NextAuth v4** (역할 기반)
- 패키지 매니저: **pnpm 10** (npm/yarn 사용 금지)
- 배포: **GitHub Actions → GHCR(도커 이미지) → NAS(Synology)**

> AI 에이전트용 상세 지침은 [`CLAUDE.md`](./CLAUDE.md), SPIS/Outcome 모듈 상세는 [`docs/SPIS.md`](./docs/SPIS.md) 참고.

---

## 1. 시스템 구성 (한눈에)

```
                      ┌──────────────────────── GitHub (master push) ────────────────────────┐
                      │  .github/workflows/main.yml                                           │
   개발자 ── push ──▶ │  1) build-and-push : Docker 이미지 빌드 → GHCR 로 push                 │
                      │  2) notify-nas     : NAS 로 webhook(POST /deploy)                     │
                      └───────────────────────────────┬──────────────────────────────────────┘
                                                       │ webhook
                                                       ▼
   ┌─────────────────────────── NAS (Synology, 내부망) ───────────────────────────┐
   │  /deploy 핸들러: docker compose pull && docker compose up -d                   │
   │                                                                               │
   │   ┌──────────────── ssil-compose (app) ────────────────┐   ┌── ssil-db ──┐   │
   │   │ image: ghcr.io/ssil-khu-ac-kr-refactoring/nextjs    │   │ postgres    │   │
   │   │ 시작: prisma migrate deploy → node server.js        │◀──│ :5432       │   │
   │   │ (Next standalone, :3000)                            │   │ db "ssil"   │   │
   │   └─────────────────────────────────────────────────────┘   └─────────────┘   │
   └───────────────────────────────────────────────────────────────────────────────┘
                                                       ▲
                                          nginx(리버스 프록시) → https://ssil.khu.ac.kr
```

핵심: **이미지는 GitHub Actions 러너에서 빌드**하고, **NAS 는 완성된 이미지를 받아 실행만** 한다.

---

## 2. ⚠️ 배포에서 가장 중요한 원칙 (과거 장애 원인)

**NAS 는 절대 컨테이너 안에서 `next build` 를 돌리면 안 된다.**

- NAS 메모리가 부족해서 런타임에 `next build`(수백 MB~) 를 돌리면 **OOM 으로 컨테이너가 죽는다.** 재시작해도 또 빌드 → 또 죽음(= 사이트 502).
- 그래서 빌드는 **메모리 충분한 GitHub Actions 러너**에서 하고, 결과 이미지를 **GHCR** 로 올린 뒤 NAS 는 `docker compose pull` 로 **받아서 실행만** 한다.
- 즉 NAS 의 `docker-compose.yml` 은 반드시 아래처럼 **`image:` 를 써야 한다. `build:`(런타임 빌드)를 쓰면 안 된다.**

```yaml
services:
  app:
    image: ghcr.io/ssil-khu-ac-kr-refactoring/nextjs:latest   # ✅ 프리빌드 이미지 사용
    # build: .        ← ❌ 이렇게 하면 NAS 에서 빌드 → OOM
    restart: unless-stopped
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      - ssil-db
  ssil-db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ssil
      POSTGRES_USER: <user>
      POSTGRES_PASSWORD: <password>
    volumes:
      - ssil-db-data:/var/lib/postgresql/data
volumes:
  ssil-db-data:
```

GHCR 이미지는 **private** 이므로 NAS 가 pull 하려면 인증이 필요하다:
```bash
docker login ghcr.io -u <github-username>   # read:packages 권한 PAT 입력
```
(또는 GHCR 패키지를 public 으로 전환)

---

## 3. 배포 파이프라인 상세

`.github/workflows/main.yml` — **master 에 push** 되면 실행:

1. **build-and-push**: `docker/build-push-action` 으로 `Dockerfile` 빌드 → GHCR 에 `:latest` 와 `:<sha>` 태그로 push. (러너 캐시 사용)
2. **notify-nas**: NAS 의 `/deploy` webhook 호출(ngrok 터널). NAS 는 `docker compose pull && up -d` 수행.

`Dockerfile` (멀티스테이지):
- `deps` → `builder`(여기서 `prisma generate` + `next build`) → `migrator`(prisma CLI) → `runner`
- runner 는 **Next standalone 출력 + prisma 스키마 + prisma CLI** 만 포함(경량)
- 컨테이너 시작 CMD: `prisma migrate deploy || (경고 출력); node server.js`
  - **마이그레이션이 실패해도 서버는 뜬다**(전체 다운 방지). 스키마가 이미 맞으면 그대로 동작.

> ⚠️ ngrok 무료 터널 URL 은 재시작 시 바뀐다. 배포가 반영 안 되면 webhook URL/토큰부터 확인. (main.yml 에 하드코딩되어 있으며 Secrets 로 옮기는 것을 권장)

---

## 4. 데이터베이스 / Prisma

- 모델: `prisma/schema.prisma` (Research, News, Person, Publication, BoardPost/Tab, HomePageContent, SliderImage, Asset, Contact, AboutContent, **Outcome**, **SpisPotential** 등)
- **Prisma Client 는 `src/generated/prisma` 로 생성**되고 코드에서는 **`@/generated/prisma`** 로 import 한다. (`@prisma/client` 아님 — pnpm 가상스토어 이슈 회피)
- 스키마 반영:
  - 배포 컨테이너: 시작 시 `prisma migrate deploy` 자동 실행
  - 마이그레이션 파일은 `prisma/migrations/` 에 두면 배포 때 자동 적용
- ⚠️ 현재 운영 DB 가 과거 `prisma db push` 로 관리된 이력이 있어 마이그레이션 히스토리와 어긋날 수 있음. 이 경우 `migrate deploy` 가 "이미 존재"로 실패할 수 있는데, CMD 가 non-fatal 이라 서버는 정상 기동된다. 정합성 정리가 필요하면 `prisma migrate resolve` 로 상태를 맞춘다.

---

## 5. 로컬 개발

```bash
corepack pnpm install          # 의존성 (pnpm 고정)
npx prisma generate            # Prisma Client → src/generated/prisma
# .env 에 DATABASE_URL 설정 필요 (postgresql://user:pw@host:5432/ssil?schema=public)
corepack pnpm dev              # http://localhost:3000 (turbopack)
corepack pnpm build            # 프로덕션 빌드 검증 (output: 'standalone')
```

`.env` 필수 키(예):
```
DATABASE_URL=postgresql://<user>:<pw>@localhost:5432/ssil?schema=public
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=http://localhost:3000
```

---

## 6. 주요 화면 / 모듈

- **공개**: `/`(홈), `/about`, `/research`, `/publications`, `/news`, `/people`, `/contact`, `/outcome`
- **Outcome**(`/outcome`): Research 형태의 박스 리스트. **Satellite Surface Charging** 항목 선택 시 위성 표면 대전 시각화(2D 지도/3D 지구본/OVATION 오로라)를 렌더. (구 `/spis` 컴포넌트 재사용)
- **관리자**(`/admin/*`): 게시글/뉴스/인물/논문/연구/홈/About 관리 + `/admin/spis` 엑셀 데이터 업로드. `requireAdmin()` 으로 보호.
- **SPIS 데이터 업로드 엑셀 구조**와 좌표(LT→경도) 변환 등은 [`docs/SPIS.md`](./docs/SPIS.md) 참고.

---

## 7. 자주 밟는 지뢰

| 증상 | 원인 / 해결 |
|---|---|
| 배포 후 사이트 502, 컨테이너가 계속 죽음 | NAS 가 런타임에 `next build` → OOM. **compose 를 GHCR `image:` 로 전환**(2절) |
| `Cannot find module '@/generated/prisma'` | `npx prisma generate` 안 함 |
| Docker 런타임에 Prisma 로딩 실패 | `next.config` 의 `output:'standalone'` / `outputFileTracingIncludes` 를 지움 |
| 배포가 NAS 에 반영 안 됨 | ngrok webhook URL 이 바뀜 → main.yml 확인 |
| 의존성 설치 이상 | pnpm 만 사용, 보안은 `package.json` 의 `pnpm.overrides` |

---

## 8. 관련 문서
- [`CLAUDE.md`](./CLAUDE.md) — AI 에이전트용 지침 + Quarkify 코드맵
- [`docs/SPIS.md`](./docs/SPIS.md) — SPIS/Outcome 모듈 상세(데이터 흐름·LT 변환·OVATION·엑셀 구조)
