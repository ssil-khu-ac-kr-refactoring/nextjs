# SPIS — 위성 대전(Charging) 분석 모듈

> 위성 표면 전위(average potential) 데이터를 2D 세계지도 · 극좌표 지도 · 3D 지구본으로 시각화하고,
> NOAA OVATION 오로라 예보를 3D 지구본에 겹쳐 보여주는 모듈.
>
> 이 문서는 팀·박사님이 **코드 구조와 수정 방법**을 빠르게 이해하도록 정리한 자료입니다.

---

## 1. 한눈에 보기

- **입력 데이터**: 한셀(HCell)에서 내보낸 `All_node` 엑셀 → 관리자 업로드 → DB 저장.
  - 데이터의 위치는 **경도가 아니라 LT(지방시, Local Time)** 로 들어옵니다. 지도에 올릴 때 경도로 변환합니다.
- **DAY/NGT**: 데이터는 낮(DAY)·밤(NGT) 값을 가지며, 지도에서는 **실시간 주야 경계선(터미네이터)** 으로 낮/밤을 나눠 칠합니다.
- **3D 오로라**: NOAA SWPC의 **OVATION Prime** 모델을 실시간(5분 주기)으로 가져와 지구본에 점군으로 표시합니다.

관련 화면: `/spis` (사용자), `/admin/spis` (관리자 업로드).

---

## 2. 코드 지도 (파일 · 역할)

| 역할 | 파일 | 핵심 심볼 |
|---|---|---|
| **좌표 변환** | `src/lib/spis/lt.ts` | `lonForLT` (LT→경도), `localTimeAtLon` (경도→LT), `terminatorLatAtLon` |
| | `src/lib/spis/solar.ts` | `subsolarPoint`, `solarElevation`, `isDaytime` |
| **데이터 모델/타입** | `src/lib/spis/types.ts` | `SpisPotentialRow`, `SpisFilter`, `SimulationRow` |
| **파서** | `src/lib/spis/parseWorkbook.ts` | `parseWorkbookSheet` (한셀 xlsx 호환) |
| **데이터 로드** | `src/lib/spis/dataApi.ts` | `fetchSpisPotentials`, `importExcelFile` |
| **오로라 소스** | `src/lib/spis/ovation.ts` | `fetchOvation` (NOAA OVATION) |
| **색상** | `src/lib/spis/colorScale.ts` | `getColorForValue` |
| **UI 컨테이너** | `src/components/spis/SpisApp.tsx` | `SpisApp` (상태·격자 합성) |
| **좌측 패널** | `src/components/spis/SpisControls.tsx` | `SpisControls` |
| **2D 지도** | `src/components/spis/WorldMap.tsx` | `WorldMap`, `PolarMap` |
| **3D 지구본** | `src/components/spis/Globe3D.tsx` | `Globe3D`, `Aurora`, `Heatmap` |
| **API** | `src/app/api/spis/import/route.ts` | 엑셀 업로드(관리자) |
| | `src/app/api/spis/simulations/route.ts` | 전위 데이터 공개 조회 |
| | `src/app/api/spis/sample/route.ts` | 샘플 데이터 생성(관리자) |

---

## 3. 데이터 흐름

```
한셀 All_node .xlsx
      │  (관리자 업로드)
      ▼
POST /api/spis/import ── parseWorkbookSheet (x: 접두사 벗기고 헤더 정규화)
      │                   env·res·dn·node0Mat·node1Mat·node·avPot (+ lt·lat)
      ▼
Prisma · spis_potentials 테이블
      │
      ▼
GET /api/spis/simulations ── fetchSpisPotentials()
      │
      ▼
SpisApp ── 선택(재질/저항/노드)에 맞는 값 → 30° 격자로 합성
      │      · LT 데이터가 있으면 lon = lonForLT(lt, now) 로 경도 변환해 배치
      │      · 없으면 DAY/NGT 값을 실시간 터미네이터로 낮/밤에 나눠 칠함
      ▼
WorldMap(2D) / PolarMap(극좌표) / Globe3D(3D + OVATION 오로라)
```

핵심: **현재 기본 데이터에는 공간 차원이 없고**, DAY 값·NGT 값을 터미네이터로 나눠 칠합니다.
LT 컬럼이 들어오면 그때부터 진짜 위치 기반(LT→경도)으로 배치됩니다. (`src/components/spis/SpisApp.tsx`)

---

## 4. LT → 경도 변환 (구현됨)

위성 환경 데이터의 위치는 **LT(지방시)** 로 제공됩니다. LT는 태양 기준 시간이라(정오=태양 직하 경도),
지리 세계지도에 올리려면 경도로 바꿔야 합니다.

```
lon = (LT − UTC_hours) × 15°        // (-180, 180] 로 wrap
```

- 변환 함수: `lonForLT(lt, date)` — `src/lib/spis/lt.ts`
- **시각(now) 의존**: 같은 LT라도 지구 자전으로 경도가 매 순간 이동합니다.
  그래서 변환은 **그릴 때마다(now 기준)** 수행합니다. (2D 지도의 실시간 밤 그림자와 자연히 일치)

### 동작 방식 (하위호환)

`SpisPotentialRow` 에 옵션 필드 `lt?`, `lat?` 가 있습니다 (`src/lib/spis/types.ts`).

- **LT 컬럼이 있으면**: 각 행을 `lon = lonForLT(row.lt, now)` 로 변환해 배치.
  `lat` 이 있으면 해당 위도대 칸만, 없으면 모든 위도대에 펼침 → **위도×LT / LT단일** 둘 다 처리.
- **LT 컬럼이 없으면**: 기존 방식(DAY/NGT × 터미네이터) 그대로.

업로드 파서(`src/app/api/spis/import/route.ts`)는 `lt`/`lat` 컬럼을 인식하고,
DN(주야) 컬럼이 없으면 **LT로 주야를 자동 도출**(06~18시=낮)합니다.

### 새 LT 데이터를 붙일 때 확인할 것

1. LT 종류가 **지리 LT** 인지 확인 (자기지방시 MLT 이면 자기극 보정이 추가로 필요).
2. 엑셀 컬럼명/단위 → 파서의 `find('lt','localtime',...)` 후보에 맞추기.
3. 새 `lt`/`lat` 컬럼은 nullable 이라 배포 시 마이그레이션으로 자동 반영됩니다.

---

## 5. 3D 오로라 = OVATION 모델 (확인됨)

3D 지구본의 오로라는 **NOAA SWPC OVATION Prime** 모델을 실시간으로 가져옵니다. 임의/더미 데이터가 아닙니다.

- 출처: `https://services.swpc.noaa.gov/json/ovation_aurora_latest.json` — `src/lib/spis/ovation.ts`
- 데이터: 경위도 그리드별 오로라 출현 확률 0~100% (값>0 만 렌더)
- 갱신: 마운트 시 + **5분 주기** 자동 재요청 — `src/components/spis/Globe3D.tsx`
- 표시: 강도별 그린→마젠타 점군. 헤더의 `OVATION HH:MM` 은 실제 관측시각이라 연결 상태가 화면에 그대로 보임.

---

## 6. 로컬 실행 / 배포 노트

- Prisma client 는 **커스텀 경로 `src/generated/prisma`** 로 생성됩니다(pnpm 가상스토어 이슈 회피).
  코드에서는 `@/generated/prisma` 로 import 합니다. 클론 후 `npx prisma generate` 필요.
- 배포 이미지는 Next **standalone** 출력을 사용하며, `outputFileTracingIncludes` 로
  Prisma 런타임+쿼리엔진을 standalone 에 포함합니다 (`next.config.mjs`).
- 컨테이너 시작 시 `prisma migrate deploy` 가 자동 실행되어 스키마가 반영됩니다 (`Dockerfile`).

---

## 7. 자주 수정하는 지점 요약

| 하고 싶은 것 | 파일 |
|---|---|
| LT→경도 배치 로직 | `SpisApp.tsx` (격자 합성부) + `lt.ts` |
| 업로드 컬럼 매핑 추가 | `api/spis/import/route.ts` (`find(...)`, `norm`) |
| 색상 스케일 | `lib/spis/colorScale.ts` |
| 2D 지도 격자/축/그림자 | `WorldMap.tsx` |
| 3D 지구본/오로라 렌더 | `Globe3D.tsx` |
| 오로라 데이터 소스 | `lib/spis/ovation.ts` |
| 선택 옵션(재질/저항/노드) | `SpisControls.tsx` + `types.ts` |
