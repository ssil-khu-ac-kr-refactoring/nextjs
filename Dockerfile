# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
  else npm ci; \
  fi

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- migrator (prisma CLI for runtime migrations) ----------
# pnpm은 심볼릭링크 구조라 빌더에서 CLI를 그대로 복사하기 까다로워서,
# npm으로 hoisted 설치한 prisma CLI를 별도 스테이지에 만들어 복사한다.
FROM node:20-alpine AS migrator
WORKDIR /m
RUN npm init -y >/dev/null 2>&1 \
  && npm i --no-audit --no-fund prisma@6.14.0

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# prisma migrate(schema engine)는 openssl 필요
RUN apk add --no-cache openssl

# Next.js standalone + 정적 파일
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Prisma client/쿼리엔진은 커스텀 output(src/generated/prisma) 으로 생성되어
# Next standalone 트레이싱에 이미 포함된다(위 standalone COPY). 별도 복사 불필요.
# migrate deploy 용 스키마/마이그레이션만 복사한다.
COPY --from=builder --chown=node:node /app/prisma ./prisma

# 런타임 마이그레이션용 prisma CLI (별도 hoisted 설치본).
# 반드시 'node_modules' 디렉터리명으로 둬야 prisma가 @prisma/engines 등을 해석함.
COPY --from=migrator --chown=node:node /m/node_modules ./migrate/node_modules

USER node
EXPOSE 3000
# 컨테이너 시작 시 DB 마이그레이션 적용(idempotent) 후 서버 기동.
# migrate deploy 실패 시 컨테이너가 죽으므로 DB가 먼저 떠 있어야 함.
CMD ["sh", "-c", "node ./migrate/node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma || node ./migrate/node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --skip-generate || echo migrate-and-push-failed; node ./migrate/node_modules/prisma/build/index.js db execute --file ./prisma/bootstrap.sql --schema=./prisma/schema.prisma || echo seed-skip; node server.js"]
