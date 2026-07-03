# SPIS 파라미터(엑셀 컬럼) 추가 가이드

엑셀(`All_node` 시트 또는 CSV)에 **새 인자(컬럼)** 가 생겼을 때 대응하는 두 가지 경로를 설명한다.

- **(A) 완전 자동** — 코드 수정 0. 새 열을 넣어 업로드만 하면 저장·필터링까지 자동.
- **(B) 정식 승격** — 새 인자를 일급(first-class) 컬럼으로 만들 때 고치는 4곳.

---

## A. 완전 자동 경로 (extras JSON)

임포트(`/api/spis/import`)는 **인식된 헤더 목록에 없는 모든 컬럼**을 행별로
`extras` JSON(`{ 원본헤더명: 값 }`)에 자동 저장한다.

흐름:

1. 관리자가 새 열(예: `Alt [km]`, `Season`)이 포함된 엑셀을 업로드.
2. `src/app/api/spis/import/route.ts` 가 알려진 헤더(env, RES, DN, LT, Lat,
   cond_Solar, Kp, e_n, e_T, i_n, i_T, type/form, Node0_Mat, Node1/2_Mat, node, AvPot)를
   매핑한 뒤, **나머지 헤더 전부**를 `extras` 에 담아 `SpisPotential.extras`(JSONB)로 저장.
   - 값이 비어있는(null/빈 문자열) 셀은 제외. 숫자는 숫자로, 문자열은 문자열로 유지.
3. `/api/spis/simulations` 가 `extras` 를 그대로 프론트로 전달.
4. `SpisApp.tsx` 가 데이터에 등장하는 extras 키마다 고유값 목록을 뽑아
   **필터 드롭다운을 자동 생성**하고(라벨 = 원본 헤더명, 첫 옵션 `전체`),
   선택 시 해당 값의 행만 지도/지구본에 반영한다.

표시 조건:

- **값이 1개 이상 있는 키만** 드롭다운이 생긴다 (전부 빈 열은 무시).
- 고유값이 **50개를 초과**하는 키는 제외한다 (연속값/쓰레기 컬럼 방지).

한계 (이 경로로 안 되는 것):

- **필터로만** 동작한다. 정렬 기준·단위 표시·색상 축/차원(예: 고도 축) 같은
  일급 기능으로는 쓸 수 없다 — 그건 아래 B(정식 승격)가 필요하다.
- 값 비교는 문자열 일치 기준이라 `1.0` 과 `1` 처럼 표기가 다르면 다른 값으로 취급된다.

---

## B. 정식 승격 레시피 (일급 컬럼으로 만들기)

새 인자를 스키마 컬럼 + 전용 UI로 승격하려면 **정확히 4곳**을 고친다.
각 단계는 기존 `condSolar` / `kp` 가 들어간 코드를 그대로 따라하면 된다.

### ① DB 스키마 + 멱등 마이그레이션 — `prisma/schema.prisma`

`SpisPotential` 모델에 필드 추가 (기존 `condSolar`, `kp` 줄을 참고):

```prisma
model SpisPotential {
  ...
  condSolar String? @map("cond_solar")  // ← 기존 예시
  kp        String?                     // ← 기존 예시
  myParam   String? @map("my_param")    // ★ 새 인자 (숫자면 Float?)
}
```

새 마이그레이션 파일 `prisma/migrations/<YYYYMMDDHHMMSS>_add_my_param/migration.sql`:

```sql
ALTER TABLE "spis_potentials" ADD COLUMN IF NOT EXISTS "my_param" TEXT;
```

(`IF NOT EXISTS` 로 멱등하게 — 기존 파일 `prisma/migrations/20260703000000_add_spis_env_params/migration.sql` 참고.)
그 후 `npx prisma generate`.

### ② 임포트 헤더 매핑 — `src/app/api/spis/import/route.ts`

`find()` 별칭 한 줄 + payload 한 줄 (기존 `condKey`/`kpKey` 부분 그대로 따라하기):

```ts
const condKey = find('condsolar');          // ← 기존 예시
const kpKey = find('kp');                   // ← 기존 예시
const myKey = find('myparam', 'myp');       // ★ norm() 정규화(소문자, 공백/괄호/-/_ 제거) 기준 별칭

// consumedKeys 집합에 myKey 추가 (extras 로 새지 않도록!)
// payload.push({ ..., condSolar: condKey ? toStr(r[condKey]) : null,
//                myParam: myKey ? toStr(r[myKey]) : null })   // 숫자면 toNumber()
```

### ③ 타입 — `src/lib/spis/types.ts`

`SpisPotentialRow` 와 `SpisFilter` 에 필드 추가 (기존 `condSolar`/`kp` 줄 바로 아래):

```ts
export interface SpisPotentialRow {
  condSolar?: string | null;  // ← 기존 예시
  kp?: string | null;         // ← 기존 예시
  myParam?: string | null;    // ★
}
export interface SpisFilter {
  condSolar: string;          // ← 기존 예시
  kp: string;                 // ← 기존 예시
  myParam: string;            // ★
}
```

### ④ UI — `src/components/spis/SpisApp.tsx` + `src/components/spis/SpisControls.tsx`

`SpisApp.tsx` 에서 `condSolar`/`kp` 가 등장하는 네 군데를 그대로 복제:

1. `options` useMemo: `myParam: uniq(data.map((d) => d.myParam ?? "")).filter(Boolean)`
2. 선택 복구 useEffect: `if (options.myParam.length && !options.myParam.includes(next.myParam)) ...`
3. `matchesFilter`: `(options.myParam.length === 0 || (d.myParam ?? "") === filter.myParam)`
4. 초기 filter state 에 `myParam: ""`

`SpisControls.tsx` 에는 기존 `태양 조건 (Solar)` / `지자기 활동 (Kp)` 드롭다운 블록을
복사해 `options.myParam` 으로 바꾸면 끝.

---

## 배포 시 자동 반영

마이그레이션 파일만 커밋하면 된다. 컨테이너 시작 시
`prisma migrate deploy` 가 자동 실행되고(부팅 시 `db push` 폴백 포함),
멱등 SQL(`IF NOT EXISTS`)이라 재실행에도 안전하다. 별도 수동 DB 작업 불필요.
