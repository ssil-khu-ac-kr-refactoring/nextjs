# 운영 가이드 — NAS 배포/재배포/진단

> 사이트가 안 뜨거나, 새 버전을 반영해야 할 때 이 문서 하나만 보면 됩니다.
> 모든 작업은 **DSM → 제어판 → 작업 스케줄러**에서 실행합니다 (SSH 불필요).

---

## 1. 새 버전 반영 / 재배포 (표준 절차)

코드가 master 에 머지되면 GitHub Actions 가 이미지를 빌드해 GHCR 에 올립니다.
NAS 반영은 아래 **재배포 작업**을 실행하면 됩니다.

**작업 스케줄러 → 재배포 작업(예: Task 3) 선택 → 실행** — 스크립트 내용(최신판):

```bash
/usr/local/bin/docker pull ghcr.io/ssil-khu-ac-kr-refactoring/nextjs:latest
/usr/local/bin/docker update --restart=no ssil-compose 2>/dev/null
/usr/local/bin/docker stop ssil-compose 2>/dev/null
/usr/local/bin/docker rm -f ssil-app ssil-ghcr-test 2>/dev/null
/usr/local/bin/docker run -d --name ssil-app --restart unless-stopped \
  --network ssil-net -p 8080:3000 \
  --env-file /volume1/docker/compose/.env.server \
  -e UPLOAD_PATH=/app/public/uploads \
  -v /volume1/docker/public:/app/public \
  ghcr.io/ssil-khu-ac-kr-refactoring/nextjs:latest
```

- **사용자: root** 필수 (docker 권한).
- **스케줄 활성화는 꺼둘 것** — 켜두면 매일 자정 재배포되어 잠깐 끊깁니다. 실행 버튼으로만.
- 실행 후 **2~3분** 걸립니다 (pull + 부팅). 502 가 잠깐 보이는 건 정상.
- 부팅 시 자동 수행: DB 스키마 동기화(migrate → 실패 시 db push 폴백) + 기본 시드(prisma/bootstrap.sql).

### 볼륨/env 설명
| 항목 | 이유 |
|---|---|
| `-v /volume1/docker/public:/app/public` | 업로드 이미지(slider/research/uploads 등)가 NAS 폴더에 있음. 마운트 없으면 이미지 깨짐 + 업로드 유실 |
| `-e UPLOAD_PATH=/app/public/uploads` | 업로드 API 저장 경로를 컨테이너 기준으로 지정 (env 파일의 옛 경로 덮어씀) |
| `--network ssil-net` | DB(ssil-db)와 같은 도커 네트워크 |
| `-p 8080:3000` | 리버스 프록시가 8080 을 바라봄 |

---

## 2. 문제 진단 (사이트 502/500일 때)

**진단 작업** (사용자 root) 을 실행하고 **File Station → docker → diag.txt** 를 엽니다:

```bash
exec > /volume1/docker/diag.txt 2>&1
date
echo "=== 컨테이너 상태 ==="
/usr/local/bin/docker ps -a
echo "=== ssil-app 로그 (마지막 40줄) ==="
/usr/local/bin/docker logs --tail 40 ssil-app
echo "=== 메모리 ==="
free -m
```

### 흔한 증상 → 원인
| 증상 | 원인/조치 |
|---|---|
| 재배포 직후 1~2분 502 | 정상 (부팅 중). 기다리면 200 |
| `ssil-compose` 가 시작 실패 | **정상** — 옛 컨테이너. 포트를 ssil-app 이 쓰는 중. 켜지 말 것 |
| 컨테이너가 계속 죽음 + 로그에 build | 누군가 옛 빌드 방식으로 되돌림 → 1번 재배포 절차로 복구 |
| 이미지(지도/사진) 깨짐 | `-v /volume1/docker/public:/app/public` 마운트 누락 → 1번 스크립트 그대로 재실행 |
| 데이터 API 500 | DB 컬럼 누락 → 재배포 한 번(부팅 시 db push 폴백이 자동 수리) |

---

## 3. 아키텍처 요약 (왜 이렇게 하나)

- NAS 는 RAM 1.8GB — 컨테이너 안에서 `next build` 를 돌리면 **메모리 초과로 죽습니다**(과거 장애 원인).
- 그래서 빌드는 GitHub Actions, NAS 는 **완성된 이미지 실행만** 합니다. 상세: [README.md](../README.md)

## 4. 컨테이너 목록 (정상 상태)
| 이름 | 역할 |
|---|---|
| `ssil-app` | **현재 서비스** (GHCR 이미지, 8080) |
| `ssil-db` | PostgreSQL (건드리지 말 것 — 데이터 전부 여기) |
| `hook`, `ngroktest` | 배포 webhook 수신용 |
| `ssil-compose`, `ssil` | **폐기 대상** (옛 방식). 꺼져 있어야 정상. 여유 되면 삭제 |
