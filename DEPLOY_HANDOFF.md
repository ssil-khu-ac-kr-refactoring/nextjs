# DEPLOY HANDOFF — SSIL 홈페이지 (2026-08 홈페이지 요청사항 반영본)

> 다른 머신/다른 Claude 세션이 이 브랜치를 **서버에 배포**하기 위한 인수인계 문서.
> 이전 세션에서 "8/12 홈페이지 관련 요청 사항 3건"을 코드에 반영해 놓은 상태다.
> SSL / 도메인은 **학교에서 리버스 프록시로 연결**해 준다고 함 → 이 앱은 **:3000**만 잘 떠 있으면 됨.

---

## 0. 이 앱이 뭐냐 (한 줄)

경희대 우주과학과 **SSIL 연구실 홈페이지**. **Next.js 15 (App Router) + Prisma + PostgreSQL**,
Docker **standalone** 이미지로 배포. 컨테이너 시작 시 `prisma migrate deploy`가 **자동 실행**된다.

- Repo: `https://github.com/ssil-khu-ac-kr-refactoring/nextjs`
- **배포 대상 브랜치: `feat/homepage-requests-0812`** (이번 변경분이 여기 있음)
- Prisma Client는 `@prisma/client`가 아니라 **`@/generated/prisma`** 로 import (pnpm 이슈 회피). 코드 건드릴 일 있으면 주의.

---

## 1. 이번에 바뀐 것 (요청사항 3건)

| # | 요청 | 구현 파일 | 요점 |
|---|------|-----------|------|
| 1 | 홈 "Our Mission" 사진 전환 3초 + 사진 클릭 시 이동 | `src/components/CTASection.tsx` | `ResearchSection`의 자동전환 `10000→3000ms`, 이미지 위에 투명 `<Link>` 오버레이(z-10) 추가 (화살표·점·텍스트는 z-20이라 그대로 동작) |
| 2 | Publications 순서 = SCI → 기타 → 학회/Conference | `prisma/schema.prisma`, `prisma/migrations/20260815000000_add_publication_category/`, `src/app/publications/page.tsx`, `src/components/PublicationForm.tsx`, `src/app/api/publications/route.ts`, `src/app/api/publications/[id]/route.ts`, `src/app/admin/publications/edit/[id]/page.tsx` | Publication에 **`category` 컬럼 신설**(`SCI`\|`OTHER`\|`CONFERENCE`, 기본 `SCI`). 공개 페이지를 분류 우선순위로 섹션화(분류 안에서는 연도 desc) |
| 3 | 본문 전체정렬(justify)·사진 가운데정렬 기본값 + admin 정렬 반영 버그 | `src/app/globals.css` | 원인: Quill 정렬은 `ql-align-*` **class**로 저장되는데 해당 CSS가 `.ql-editor`에만 스코프됨 → 공개 페이지(`.prose`)에 미적용. `.prose`에 정렬 규칙 + 기본값(본문 justify, img 가운데) 추가 |

> ⚠️ **#2는 DB 스키마 변경(신규 컬럼)** 이 있다. → 아래 2절 마이그레이션 확인 필수.
> 검증 상태: `npx prisma generate` + `npx tsc --noEmit` 통과. (eslint는 이 레포에 원래부터 minimatch 환경오류로 실행 불가 — 코드와 무관)

---

## 2. DB 마이그레이션 (중요)

- 신규 마이그레이션: `prisma/migrations/20260815000000_add_publication_category/migration.sql`
  - 내용: `Publication`에 `category TEXT NOT NULL DEFAULT 'SCI'` 추가 + 인덱스. **idempotent(IF NOT EXISTS)** 라 재적용 안전. 기존 행은 전부 `SCI`가 됨.
- **자동 적용**: Dockerfile의 CMD가 컨테이너 시작 시 `prisma migrate deploy`를 돌린다 → **수동 마이그레이션 불필요**. 단, **DB가 먼저 떠 있어야** 함.
- ⚠️ 이 운영 DB는 과거 `prisma db push` 이력이 섞여 마이그레이션 히스토리가 어긋날 수 있음. `migrate deploy`가 "이미 존재"로 실패해도 CMD가 non-fatal(`|| db push || echo`)이라 서버는 뜬다. 컬럼만 잘 들어가면 OK. 정합성 정리 필요하면 `prisma migrate resolve`.
- 새 DB(빈 서버)로 시작하는 경우: `migrate deploy`가 전체 마이그레이션을 처음부터 적용 → 그냥 뜬다.

---

## 3. 배포 방법 (두 가지 경로)

### 경로 A — 기존 CI 파이프라인 그대로 (권장, 코드가 master로 가도 되면)
`.github/workflows/main.yml`: **`master`/`main`에 push되면** GitHub Actions가 이미지 빌드 → GHCR push → NAS webhook으로 pull/restart.
- 이 브랜치를 master에 머지 & push 하면 자동 배포됨.
- 단, 지금 목표가 "**새 서버**에 새로 까는 것"이면 경로 B.

### 경로 B — 새 서버에 직접 Docker로 (이번 케이스로 보임)

서버에 Docker/Compose 설치돼 있다는 전제.

1. 코드 가져오기:
   ```bash
   git clone https://github.com/ssil-khu-ac-kr-refactoring/nextjs.git
   cd nextjs
   git checkout feat/homepage-requests-0812
   ```
2. `.env` 작성 (4절 참고)
3. `docker-compose.yml` (앱 + postgres). README 5절 기반 예시:
   ```yaml
   services:
     app:
       build: .                     # 새 서버에서 직접 빌드하는 경우
       # image: ghcr.io/ssil-khu-ac-kr-refactoring/nextjs:latest  # GHCR 프리빌드 쓰려면 이 줄 + docker login ghcr.io
       restart: unless-stopped
       env_file: .env
       ports:
         - "3000:3000"
       volumes:
         - ssil-uploads:/data/uploads   # 업로드 파일 영속화 (UPLOAD_PATH/READ_PATH와 일치시킬 것)
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
     ssil-uploads:
   ```
4. 기동:
   ```bash
   docker compose up -d --build
   docker compose logs -f app     # "migrate deploy" 로그 + 서버 기동 확인
   ```
5. `curl -I http://localhost:3000` → 200 확인.

> ⚠️ `build: .`로 빌드하면 메모리를 꽤 먹는다(그래서 원래 NAS는 GHCR 프리빌드를 씀). 서버 RAM이 작으면 OOM 날 수 있음 → 그 경우 GHCR `image:` 사용 + `docker login ghcr.io`(read:packages PAT) 권장. 단 GHCR 이미지는 이 브랜치가 아니라 master 기준이라, **이번 변경분을 프리빌드로 받으려면 먼저 master 머지 후 CI 빌드가 돌아야 함.**

---

## 4. 필수 환경변수 (`.env`)

```
# --- 필수 ---
DATABASE_URL=postgresql://<user>:<pw>@ssil-db:5432/ssil?schema=public   # compose면 host=ssil-db
NEXTAUTH_SECRET=<openssl rand -base64 32 로 생성>
NEXTAUTH_URL=https://<학교에서_붙여줄_도메인>                            # SSL 종단은 학교 프록시, 값은 실제 공개 URL
ADMIN_EMAIL=<관리자 로그인 이메일>
ADMIN_PASSWORD=<관리자 로그인 비밀번호>

# --- 파일 업로드용 (슬라이더/이미지 저장·서빙) ---
UPLOAD_PATH=/data/uploads      # 쓰기 경로 (compose 볼륨과 일치)
READ_PATH=/data/uploads        # 읽기 경로 (보통 UPLOAD_PATH와 동일)

# --- 선택 (분석, umami) ---
NEXT_PUBLIC_UMAMI_SCRIPT_URL=
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
```
- `UPLOAD_PATH`/`READ_PATH` 미설정 시 이미지 업로드/서빙 API가 실패한다. **반드시 설정 + 볼륨 마운트.**
- `NEXTAUTH_URL`은 실제 접속 도메인과 일치해야 로그인/세션이 정상 동작(불일치 시 admin 로그인 깨짐).

---

## 5. SSL / 도메인 (학교 연결)

- 이 앱은 HTTP **:3000** 만 서빙한다. TLS 종단·도메인은 학교 리버스 프록시(nginx 등)가 담당.
- 학교 프록시 → `http://<이서버>:3000` 로 프록시 패스하도록 요청하면 됨.
- 프록시 설정 시 `X-Forwarded-Proto https`, `Host` 헤더 전달 권장(NextAuth 콜백/절대URL 정상화).
- `.env`의 `NEXTAUTH_URL`을 최종 `https://도메인` 으로 맞추는 것 잊지 말 것.

---

## 6. 배포 후 검증 체크리스트

- [ ] `/` 홈 → "Our Mission" 캐러셀이 **3초마다** 자동 전환되고, **사진을 클릭**하면 `/research?...`로 이동
- [ ] `/publications` → **SCI Papers → Other Publications → Conference & Abstracts** 순서로 섹션 표시, 각 섹션 안 연도 내림차순
- [ ] admin 로그인 후 Publication 추가/수정 폼에 **분류(Category) 드롭다운** 존재, 저장됨
- [ ] admin에서 본문 글에 **가운데정렬/전체정렬** 지정 → 공개 페이지(`.prose` 렌더: research/news/about/outcome/post 본문)에 **실제 반영**됨. 기본값은 본문 justify·이미지 가운데
- [ ] `docker compose logs app`에 migrate 관련 치명 오류 없이 `server.js` 기동
- [ ] `Publication` 테이블에 `category` 컬럼 존재 (`\d "Publication"`)

---

## 7. 참고

- 로컬 검증: `corepack pnpm install && npx prisma generate && npx tsc --noEmit`
- 아키텍처/DB/트러블슈팅 상세는 루트 `README.md`, `CLAUDE.md`, `docs/` 참고.
- 커밋되지 않은 변경이 있으면 먼저 커밋/push 해야 다른 머신에서 받을 수 있음(이 문서 포함).
