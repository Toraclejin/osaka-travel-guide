# Osaka Travel Guide · CLAUDE Operations Guide

오사카 여행 가이드 · **본인 + 동행 공용** (읽기 전용 가이드) · **v0.4** (2026-08-09).

> **이 문서는 "코드를 어떻게 운영하는가"의 정본.**
> 문서 전체의 위계·정본 규칙·영향 매트릭스는 **[`DOC-MAP.md`](DOC-MAP.md)** 가 인덱스다 — **새 세션은 거기부터.**
> 제품 요구사항 [`PRD.md`](PRD.md) · 여행 사실·톤 [`CONCEPT.md`](CONCEPT.md) · **디자인 정본 [`design.md`](design.md)** · 회고 [`learning.md`](learning.md) · 이식 내역 [`OSAKA_TRANSPLANT_GUIDE.md`](OSAKA_TRANSPLANT_GUIDE.md).

---

## 0. 권한 경계 (먼저 읽음)

- **WRITE**: 이 폴더 (`오사카 여행 매거진/*`)만
- **READ**: 이 폴더 + **부모 워크스페이스 전체** (도쿄·오키나와 매거진 포함) — 2026-08-09 사용자 허용
- **금지**: 다른 매거진 폴더 **WRITE**. 도쿄·오키나와 파일 수정이 필요해지면 **먼저 사용자에게 보고**
- ⚠ 읽어온 패턴은 **반드시 오사카 컨텍스트로 변형**한다. 그대로 복붙 금지 — **계보가 다르다** (저널형 vs 가이드형, [`DOC-MAP.md § 8`](DOC-MAP.md))
- 이식 시점의 결정은 이미 `OSAKA_TRANSPLANT_GUIDE.md`에 박제돼 있으니 거기부터 볼 것.

---

## 1. 이 앱이 무엇인가 (1분)

- **단일 HTML 파일** `index.html` 하나. 더블클릭하면 열림. 빌드 없음, 번들러 없음, npm 없음.
- **외부 의존성 2개뿐**: Leaflet (unpkg CDN) + 지도 타일 (CARTO). 나머지는 시스템 폰트.
- **저장소 없음.** localStorage는 비번 게이트 토큰 하나만 씀. 사용자 입력·기록 기능 **없음** — 읽기 전용 가이드다.
- **용도**: 같이 가는 사람 전원이 링크(또는 파일) 하나만 열면, 그날 있는 구역을 골라 관광지·맛집·카페를 탭 → 구글맵이 열림. **본인도 사용자다** — 남에게 주는 가이드가 아니다.

> ⚠ **도쿄 메인 매거진(`index.html` 20,901줄)과 다른 앱이다.** 이 앱은 그 매거진의 `guide/` 서브앱 계보다. 저널·사진·별점·매거진 발행 기능은 여기 없다. 그런 기능이 필요하다는 요청이 오면 "다른 앱"임을 먼저 말할 것.

---

## 2. 파일 구조

```
오사카 여행 매거진/
├── index.html                 본체 — 이거 하나가 앱 전부
├── overview.html              일행 공유용 계획표 — **자동 생성물. 직접 고치지 말 것**
├── tools/build-overview.js    ↑ 생성기 (`node tools/build-overview.js`). 앱 빌드가 아니라 개발 도구
├── DOC-MAP.md                 ★ 마스터 인덱스 · 정본 규칙 · 영향 매트릭스 (새 세션 첫 문서)
├── CLAUDE.md                  ← 이 문서 (운영 정본)
├── design.md                  ★ 디자인 정본 — 토큰 · 컴포넌트 · 레이아웃 · 보이스
├── PRD.md                     제품 요구사항 · 버전 히스토리
├── CONCEPT.md                 여행 사실 · 동행 · 톤
├── learning.md                ★ 회고 — R-D 룰이 생긴 서사
├── OSAKA_TRANSPLANT_GUIDE.md  도쿄 → 오사카 이식 명세 (Vol III 기록)
├── README.md                  사용자용 설명
├── .gitignore
└── .claude/launch.json        로컬 프리뷰 (포트 8767)
```

`index.html` 안 구획:

| 줄(대략) | 구획 | 성격 |
|---|---|---|
| 1~26 | head · CSP · 비번 게이트 inline · Leaflet CDN | 건드릴 일 거의 없음 |
| 27~460 | `<style>` — 디자인 토큰 + 컴포넌트 CSS | § 5 |
| 464~476 | body HTML 뼈대 (게이트 · 매스트헤드 · 내비 · `#body` · 푸터) | 정적 |
| 478 | `BUILD_VERSION` | 변경 시 갱신 |
| 480~ | **`GUIDE_DATA`** — 구역·장소 데이터 | § 3 · 편집 대부분 여기 |
| ~ | `SVG` / `CAT` / `ZONE_ACCENTS` | 상수 |
| ~ | **`EXCURSIONS`** — 원정 데이터 | § 3 |
| 이후 | 렌더 엔진 (DOM 헬퍼 → 매스트 → 내비 → 카드 → 지도 → 필터 → 스크롤스파이) | § 7 |
| 맨 끝 | 비번 게이트 로직 (별도 `<script>`) | § 6 |

---

## 3. 데이터 모델

### 3.1 `GUIDE_DATA` — 시내 구역

```
GUIDE_DATA = {
  title, base_hotel, maps_url_format,
  zones: [ { id, name, access, sections: [ { category, places: [ place ] } ] } ]
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `base_hotel` | object \| **null** | `{name, area, note, lat?, lng?}`. **숙소 미정이면 `null`** — 가짜 자리표시자 넣지 말 것. `null`이면 ① 매스트헤드 호텔 칩 생략 ② 원정 길찾기 출발지가 `Osaka Station`으로 대체 (`excursionOrigin()`) ③ 지도에 숙소 핀·loop 동선 없음. **`lat`/`lng`를 채우면 각 구역 지도에 숙소 핀이 생기고 동선이 `숙소 → 장소들 → 숙소` loop로 바뀐다** (§ 7). 좌표는 R-D3 land-check 필수 |
| `zones[].id` | number | 앵커 id = `zone-{id}`. 내비 칩 번호 |
| `transfer` | object \| 생략 | **선착장 ↔ 숙소 이동.** `{arrival:{...}, departure:{...}}`. 각각 `{tag, date, title, lede, warn?, steps:[{t,w,d?}], need:[string], tip?}`. **`arrival`은 첫 구역 앞, `departure`는 맨 끝**에 렌더 — 여행이 시작·끝나는 순서 그대로. `warn`의 `**강조**`는 `<b>`로 변환된다 (`innerHTML` 아님 — 조각을 나눠 `textContent`) |
| `zones[].date` | string \| 생략 | `'8/24 (월)'`. **헤더 배지 + 내비 칩 앞머리**(`8/24 히데요시의 오사카`)에 쓰인다. 없으면 내비 칩은 기존 `01` 번호로 폴백. **`access` 에 날짜를 중복해 쓰지 말 것** |
| `zones[].tag` | string \| 생략 | 헤더 배지. **있으면 그걸 쓰고, 없으면 `AREA 01`** 로 폴백. v0.6부터 `DAY 1` / `DAY 2 밤` / `옵션` 을 쓴다 |
| `zones[].schedule` | array \| 생략 | **그 날의 흐름.** `[{t:'14:00', w:'무엇을', n:'왜/주의'}]`. 없으면 시간표 블록 자체가 안 그려진다 (`buildSchedule` 이 `null` 반환) |
| `zones[].access` | string | **역 기준**으로 쓴다 (`난바·신사이바시역 (미도스지선) · 기타에서 8분`). 숙소에 의존하지 않으므로 숙소 미정이어도 유효하다. 숙소가 정해지면 도보 시간만 덧붙이면 됨 |
| `sections[].category` | string | **`관광지` / `맛집` / `카페` 셋 중 하나.** `CAT` 딕셔너리 키와 정확히 일치해야 색·아이콘·필터가 붙음 |

### 3.2 `place` — 장소 하나

```json
{ "name_ko":"", "name_en":"", "feature":"", "recommended":false, "essential":false,
  "lat":0, "lng":0, "maps_url":"" }
```

- `recommended` → ★ 추천 뱃지 + "추천만" 필터
- `essential` → 🇰🇷 한국인 필수 뱃지 + 전용 필터
- `theme` (v0.4 신설 예정 · **미구현**) → `'서브컬쳐'` \| `'역사·문화'`. **카테고리와 직교하는 축**이다 — 카테고리는 "무엇을 하는 곳", 테마는 "왜 가는가". 오사카성은 `관광지` + `역사·문화`, 덴덴타운은 `관광지` + `서브컬쳐`. **네 번째 카테고리를 만들지 말 것** (§ 8 R-D4 · `learning.md § 11`). 표시·색은 [`design.md § 1.5`](design.md)
- `lat`/`lng` — **생략 가능.** 없으면 지도 핀에서만 빠지고 카드·구글맵 링크는 정상 동작 (`zoneCenter`가 좌표 없는 항목을 건너뜀)
- `offzone: true` — 핀은 찍되 지도 초기 프레이밍(fitBounds)에서는 제외
- `maps_url` — `https://www.google.com/maps/search/?api=1&query={영문명 URL인코딩}`. `place_id`를 붙이면 더 정확하지만 **없어도 됨. 모르는 place_id를 지어내지 말 것** (§ 8 R-D3)

**⏰ 정기휴무는 `feature` 안에 쓴다.** 별도 필드를 만들지 않는다 (§ 8 R-D10).
- ✅ `"오리 육수 라멘. 줄 빨리 빠짐. **수요일 휴무**"`
- 영업 *시간*은 쓰지 않는다 — 변동이 잦아 틀린 정보가 된다. **요일 휴무만** 쓴다 (이건 잘 안 바뀌고, 헛걸음의 주원인이다)

### 3.3 `EXCURSIONS[]` — 원정 (하루 통째로 쓰는 시외 일정)

도쿄판의 `DISNEY` 단일 객체를 배열로 일반화한 것. 원정 추가 = 객체 하나 push.

```
{ id, accent, chip, title, area, scopeNote, intro, destinationQuery,
  routes: [ { n, name, best?, time, fare, steps:[{s, via?}], note } ],
  arrival: [ string ],
  todo:    [ { t, d } ],
  sections: [ 위 3.1의 sections 와 동일 스키마 ],
  dineNote?: string }
```

- `sections`가 zone과 **완전히 같은 스키마**라서 `buildZoneMap` · `buildCatSection` · `buildCard` · 상단 분류 필터가 전부 그대로 걸린다. 원정 전용 렌더 함수를 새로 만들지 말 것.
- `noRoute: true` — 지도에서 **동선 점선을 끈다**. 교토처럼 "하루에 한쪽만 도는" 곳은 7곳을 한 줄로 이으면 *이 순서로 다 돌면 된다*는 잘못된 신호가 된다.
- ⚠ **원정을 zone처럼 재조립해 넘기는 자리가 있다** (`buildZoneMap({ name, sections, noRoute })`). 지도가 읽는 필드를 늘리면 **그 줄도 같이 늘려야 한다** — 실제로 `noRoute`를 빠뜨려 교토에 동선이 그려진 적이 있다 (`learning.md § 12`).
- 앵커 id = `ex-{id}`. 내비 칩 라벨 = `chip` (없으면 `title`).
- `routes[].name`에 `택시`/`didi`/`차로`가 들어가면 길찾기 링크가 `driving` 모드로 나감. 그 외는 `transit`.

---

## 4. 장소 추가·수정 절차

1. `index.html`에서 `GUIDE_DATA` (또는 `EXCURSIONS[].sections`) 안 해당 `places` 배열을 찾는다
2. **한 줄 = 한 장소** 포맷을 지킨다 (diff 가독성 · 도쿄판에서 계승)
3. `maps_url`은 영문명을 URL 인코딩해서 만든다. 영문명으로 지오코딩이 안 되는 곳은 **일본어 정식명**을 쿼리로 쓴다 (§ 13 참고)
4. 좌표는 § 8 R-D3의 land-check를 거친다
5. `BUILD_VERSION` 갱신
6. § 9 자가 점검 실행

---

## 5. 디자인 — **정본 = [`design.md`](design.md)** ⭐

> 이 챕터는 **운영 중 빠른 참조 요약**이다. 토큰 값·컴포넌트 인벤토리·레이아웃·보이스 실행규칙의 완전한 명세는 `design.md`가 정본.
> **충돌 시 `design.md`가 이긴다.** 변경 순서는 R-D11 (§ 8).

| 축 | 토큰 | 한 줄 |
|---|---|---|
| frame / page / ink | `--frame` `--page` `--ink` 계열 | **시리즈 공통 — 바꾸지 말 것** |
| **point** | **`--osaka-red` `#D8452E`** | 버밀리언. 도쿄는 `#d94848`. **매거진 간 식별 축 — 새 매거진에서 바꾸는 건 이것 하나** |
| 뱃지 전용 | `--gold` / `--essential` | ★추천 / 🇰🇷필수 **전용**. 일반 강조 금지 |
| 카테고리 | `--cat-sight` / `--cat-meal` / `--cat-cafe` | `CAT` 딕셔너리와 쌍 (R-D4) |
| 테마 (예정) | `--theme-sub` / `--theme-hist` | 서브컬쳐 / 역사·문화. **카테고리와 직교** (§ 3.2) |
| 구역 액센트 | `ZONE_ACCENTS` (JS) | **6색 — 현재 정확히 찼다** (구역 5 + 원정 1). 추가 시 색도 같이 늘릴 것 |

**디자인 변경 시 (R-D11)**
```
design.md 갱신 → index.html :root 갱신 → 본 § 5 요약 갱신 → BUILD_VERSION
```

---

## 6. 보안

- **CSP**: `default-src 'none'`. script/style은 `'unsafe-inline'` + unpkg, img는 `data:` + `*.basemaps.cartocdn.com`만. **완화 금지.**
- `connect-src`가 없다 → `fetch`/XHR **불가**. 그래서 데이터는 반드시 파일 안에 임베드돼야 한다 (§ 8 R-D1).
- DOM 주입은 전부 `E(tag, cls, text)` 헬퍼 = `textContent`. `innerHTML`은 **정적 SVG 상수**에만 (`icon()`).
- 사용자 입력을 받는 곳은 비번 입력란 하나뿐이고, 그 값은 SHA-256 해시 비교에만 쓰인다.

### 비번 게이트

| 상수 | 위치 | 비고 |
|---|---|---|
| `AUTH_HASH` | 맨 끝 `<script>` | SHA-256 hex |
| `AUTH_KEY` | 동상 | `osaka-guide-auth-v1`. 비번 변경 시 **v를 bump**해야 구 토큰이 무효화됨 |
| `AUTH_LOCK_KEY` / `AUTH_ATTEMPT_KEY` | 동상 | 5회 실패 → 5분 잠금 |
| 힌트 문구 | body의 `.auth-q-text` | 개인만 아는 형태로. 답 자체를 쓰지 말 것 |

**비번 변경 절차**
```bash
node -e "console.log(require('crypto').createHash('sha256').update('새비번').digest('hex'))"
```
1. 출력 해시를 `AUTH_HASH`에 넣는다
2. `AUTH_KEY`의 `v1` → `v2`로 bump
3. `.auth-q-text` 힌트를 새 비번에 맞게 고친다
4. **평문 비번을 코드·주석·문서 어디에도 남기지 않는다** (§ 8 R-D2)

⚠ **한계 명시**: devtools로 localStorage를 조작하면 기술 사용자는 우회할 수 있다. 이 게이트는 *일반 사용자·검색엔진 차단* 효과만 있다. 진짜 보안이 필요하면 private repo 또는 server-side auth.

---

## 7. 핵심 함수 위치

**DOM 헬퍼**
- `E(tag, cls, text)` — createElement + textContent. **모든 DOM 생성은 이걸로**
- `icon(markup, cls)` — 정적 SVG 상수 삽입 전용
- `eachPlace(fn)` / `count(pred)` — zone + excursion **양쪽** 순회 (필터 카운트·총계 근거)

**렌더**
- `renderMast()` — 매스트헤드 (호텔 칩 · 총계 pill · 푸터 카운트)
- `renderNav()` — 구역 칩 + 원정 칩 + 분류 필터 + 추천/필수 토글
- `rich(el, str)` — `**강조**` → `<b>`. **`innerHTML` 을 쓰지 않는다** — 조각을 나눠 `textContent` 로 넣는다 (§ 6 정책 유지)
- `renderTopTabs()` — **최상위 탭 3개**. `TOP_TABS` 상수가 정의하고 `PANEL` 에 패널 참조를 담는다
  - **여행** (일정·장소·지도) / **알아둘 것** (`TRIP_NOTES`) / **일본어** (`JP_SCENARIOS`)
  - ⚠ **`renderZones`·`renderExcursions` 보다 먼저 호출해야 한다** — 그것들이 `PANEL.trip` 에 붙기 때문
  - 구역 칩·분류 필터(`#nav`)는 **여행 탭에서만** 의미가 있어 다른 탭에서 통째로 숨긴다 (`TOP_TABS[].nav`)
  - 탭 전환 시 `refreshVisibleMaps()` 를 부른다 — 숨겨져 있던 지도는 크기가 0이라 `invalidateSize` 가 필요하다
  - 항목은 네이티브 **`<details>`** 로 접는다. JS 토글을 만들지 말 것 — 접근성·키보드·모바일이 공짜로 따라온다
  - `JP_SCENARIOS` 는 **도쿄 메인 매거진에서 이식**(10 시나리오 · 71 문장). 도쿄 고유였던 대사관 번호만 오사카 총영사관으로 교체했다
  - ⚠ 새 문장을 넣을 때 **도쿄 지명이 섞이지 않았는지** § 9 점검 5로 확인
- `buildTransfer(kind)` — `'arrival'` / `'departure'` 이동 블록. `GUIDE_DATA.transfer` 없으면 `null`
  - **도착은 `renderZones` 맨 앞, 복귀는 `#empty` 뒤.** 순서를 바꾸지 말 것 — 페이지가 곧 여행의 시간축이다
  - ⚠ 셔틀·수속 시각은 **시즌마다 바뀐다.** `warn`에 "재확인" 문구를 반드시 남길 것
- `buildSchedule(zone)` — **그 날의 흐름** 시간표. `zone.schedule` 없으면 `null` 반환 → 기존 구역은 영향 없음
  - ⚠ **분 단위 강박 일정표가 아니다** (`PRD.md § 7`). 시각을 박는 것은 ① 시설 마감처럼 어길 수 없는 것 ② 배 시각처럼 놓치면 끝나는 것 뿐. 나머지는 순서와 대략적 시작점만 준다
- `buildCatSection(s)` — **구역·원정 공용** 카테고리 섹션. 필터가 `.catsec` 단위로 돌아가므로 구조를 바꾸면 필터가 깨진다
- `buildCard(p, cat)` — 장소 카드
- `renderZones()` / `renderExcursions()` / `buildExcursion(ex)`
- `blockH(en, ko)` — 원정 안 소제목

**지도**
- `zoneCenter(zone)` — 좌표 평균 (offzone·좌표없음 제외)
- `buildZoneMap(zone, accent)` — 지도 컨테이너 + 범례 + 구글맵 버튼. **`zone.id`를 쓰지 않으므로 원정 객체도 그대로 넣을 수 있다**
- `initLeafletMap(entry)` — Leaflet 인스턴스. 핀↔이름칩 하이라이트 연동 + **동선 폴리라인** + 숙소 핀
  - **동선 = `places` 배열 순서.** 별도 순서 필드가 없다. 순서를 바꾸려면 배열 순서를 바꾼다 (번호·범례·동선이 한꺼번에 따라옴)
  - 조건: `!zone.noRoute && routePts.length >= 2`. `offzone`은 동선에서도 빠짐
  - ⚠ **직선이다.** 도쿄 메인은 OSRM으로 도로 곡선을 그리지만 그쪽 CSP엔 `connect-src`가 열려 있다. 이 앱은 `default-src 'none'` + `connect-src` 없음 → **fetch 자체가 불가**하고 CSP 완화는 § 12 금지. 정확한 길찾기는 구글맵 링크가 담당한다
  - `base_hotel.lat/lng`가 있으면 `[숙소, ...장소들, 숙소]` loop + 숙소 핀. 없으면 장소들만 잇는다
- `setupZoneMaps()` / `refreshVisibleMaps()` — IntersectionObserver 지연 init + `invalidateSize`
- `ZONE_MAP_REG` — 지도 레지스트리

**길찾기**
- `excursionOrigin()` — `base_hotel` 있으면 그 이름, 없으면 `Osaka Station`
- `excursionDirUrl(ex, mode)` — 구글맵 길찾기 딥링크

**인터랙션**
- `applyFilter()` — `.zone`은 통째로 숨김 가능, `.excursion`은 **장소 목록만** 숨기고 섹션 자체는 유지 (가는 법·할 일은 분류와 무관)
- `setupScrollSpy()` — ⚠ 칩 강조 시 **세로 스크롤 금지**, 가로 스크롤러만 이동 (도쿄판 실제 버그 이력)
- `setupToTop()`

---

## 🛡 8. Error Prevention Rules

도쿄 가이드에서 **실제로 발견된 결함**을 이식하며 고쳤다. 되돌리지 말 것.

### R-D1. 데이터 소스는 하나 — 사이드카 JSON 금지
- **도쿄판 사고**: `index.html` 임베드와 `tokyo_guide_data.json` 두 벌이 존재. CSP에 `connect-src`가 없어 JSON은 **런타임에 읽히지도 않는데** 정본처럼 보였고, 실제로 두 파일이 어긋나 있었다(`place_id` 누락).
- ✅ 데이터는 `index.html` 안 `GUIDE_DATA` / `EXCURSIONS` **한 곳만**.
- ❌ `osaka_guide_data.json` 같은 파일을 만들지 말 것. 외부로 내보낼 일이 생기면 그때 **파생 산출물**임을 파일명·주석에 명시.

### R-D2. 평문 비번을 주석에 쓰지 않는다
- **도쿄판 사고**: `var AUTH_HASH = '...';  // sha256('tokyo2026')` — 해시만 박제한다는 설계를 주석 한 줄이 무력화.
- ✅ 해시만. 생성 명령은 § 6에 있음.

### R-D3. 좌표·place_id를 지어내지 않는다
- ❌ 기억에 의존해 `lat`/`lng`를 채우고 검증 없이 커밋
- ❌ `place_id`를 추측해서 `maps_url`에 붙이기 → 엉뚱한 장소로 연결되는 링크
- ✅ **land-check**: 좌표를 넣은 뒤 반드시 지도에서 핀 위치를 눈으로 확인. 바다·논밭·엉뚱한 동네에 찍히면 즉시 수정
- ✅ `place_id`를 모르면 **쿼리만 있는 URL**을 쓴다 (`?api=1&query=영문명`). 이쪽이 틀린 place_id보다 안전
- 📍 현재 시드 좌표는 **전부 미검증**. § 12 참고

### R-D4. `CAT` 키와 `category` 문자열은 정확히 일치
- `관광지` / `맛집` / `카페` 외의 문자열을 쓰면 fallback 스타일로 떨어지고 분류 필터에서 빠진다.

### R-D5. 지도 fitBounds는 픽셀 padding을 같이 준다
- `pad(n)`은 위경도 박스를 비율로 넓힐 뿐이라, 가장자리 핀의 **아이콘이 잘린다** (원정처럼 넓게 퍼진 좌표군에서 실제 발생).
- ✅ `map.fitBounds(bounds.pad(0.12), { padding: [30, 30] })`

### R-D8. 구역 하나는 "그 안에서 걸어 다닐 수 있는" 범위여야 한다
- **v0.1 사고**: `오사카성·베이`를 한 구역으로 묶었는데 오사카성(34.687,135.526)과 가이유칸(34.654,135.429)이 **약 9km** 떨어져 있었다. "구역 하나 고르고 그 안에서 골라라"는 이 앱의 전제(PRD § 2)와 정면 충돌.
- ✅ 새 구역을 만들거나 장소를 추가할 때 **구역 내 최대 거리**를 확인한다. 대략 **반경 2km / 도보 30분** 안이 기준.
- ✅ 넘으면 구역을 쪼갠다. 장소가 1~2곳뿐인 구역이 생겨도 그게 정직하다 (베이는 실제로 반나절 2곳짜리 목적지다).
- ✅ 하루를 통째로 써야 하는 거리면 구역이 아니라 **원정(`EXCURSIONS`)**으로.

```bash
# 구역 내 최대 거리 점검
#  ⚠ GUIDE_DATA 추출은 반드시 괄호 매칭으로 한다. '\n]};' 같은 포맷 앵커를 쓰면
#     데이터를 한 줄 JSON 으로 다시 쓰는 순간 조용히 깨진다 (v0.6 에서 실제로 겪음 · learning.md § 13).
node -e "
const H=require('fs').readFileSync('index.html','utf8');
let i=H.indexOf('{',H.indexOf('const GUIDE_DATA = ')),d=0,q=0,e=0,end=i;
for(let j=i;j<H.length;j++){const c=H[j];
  if(q){ if(e)e=0; else if(c==='\\\\')e=1; else if(c==='\"')q=0; continue; }
  if(c==='\"'){q=1;continue;}
  if(c==='{'||c==='[')d++; else if(c==='}'||c===']'){d--; if(!d){end=j;break;}}}
const G=JSON.parse(H.slice(i,end+1));
const hav=(a,b)=>{const R=6371,t=x=>x*Math.PI/180,dA=t(b[0]-a[0]),dO=t(b[1]-a[1]);return 2*R*Math.asin(Math.sqrt(Math.sin(dA/2)**2+Math.cos(t(a[0]))*Math.cos(t(b[0]))*Math.sin(dO/2)**2))};
G.zones.forEach(z=>{const p=[];z.sections.forEach(s=>s.places.forEach(x=>{if(x.lat)p.push([x.lat,x.lng])}));
let m=0;p.forEach(a=>p.forEach(b=>{m=Math.max(m,hav(a,b))}));
console.log((m>4?'!! ':'OK ')+(z.tag||('zone'+z.id)).padEnd(8)+'최대 '+m.toFixed(2)+'km  '+z.name);});"
```

### R-D9. 좌표 1개짜리 구역은 `fitBounds` 대신 `setView`
- 점이 하나면 bounds 크기가 0이라 `pad()`를 써도 0이고, `fitBounds`가 **maxZoom(19)까지 튄다**. 골목 한 칸만 보이는 지도가 된다.
- ✅ `if (pts.length === 1) map.setView(pts[0], 15); else map.fitBounds(...)`
- 📍 R-D8로 구역을 쪼개면 1곳짜리 구역이 실제로 생기므로 세트로 지켜야 하는 룰이다.

### R-D10. 정기휴무는 쓰고, 영업시간은 쓰지 않는다
- 일본 가게는 코로나 이후 **영업시간 변경이 잦다.** 시간을 박아두면 반드시 틀린 정보가 되고, 그 정보를 믿고 간 일행이 헛걸음한다.
- 반면 **요일 정기휴무(定休日)는 잘 안 바뀌고**, 헛걸음의 가장 큰 원인이다. 이건 반드시 쓴다.
- ✅ `feature` 문자열 끝에 `· 수요일 휴무` / `· 월·화 휴무` / `· 부정기 휴무 (인스타 확인)`
- ❌ `hours` 같은 별도 필드 신설 — PRD § 7의 "실시간 정보 안 함"과 충돌하고, 스키마만 무거워진다
- ❌ `11:00~19:00` 같은 영업시간 명기

**출발 전 1회 일괄 검증** (도쿄판 `reference/HOURS_CHECK.md`에서 계승한 절차):
1. 여행 날짜의 **요일**을 확정한다
2. `맛집`·`카페` 전 항목의 정기휴무를 구글맵/공식/인스타로 확인
3. 여행 요일에 걸리는 곳은 `feature`에 휴무를 명기하거나, 그 요일 대안을 같은 구역에 하나 더 넣는다
4. 미술관·박물관은 **월요일 휴관**이 기본값이다. 관광지도 같이 훑을 것

```bash
# 정기휴무가 적힌 장소 비율 (맛집·카페 기준) — 추출은 위와 같은 괄호 매칭 방식
node -e "
const H=require('fs').readFileSync('index.html','utf8');
let i=H.indexOf('{',H.indexOf('const GUIDE_DATA = ')),d=0,q=0,e=0,end=i;
for(let j=i;j<H.length;j++){const c=H[j];
  if(q){ if(e)e=0; else if(c==='\\\\')e=1; else if(c==='\"')q=0; continue; }
  if(c==='\"'){q=1;continue;}
  if(c==='{'||c==='[')d++; else if(c==='}'||c===']'){d--; if(!d){end=j;break;}}}
const G=JSON.parse(H.slice(i,end+1));
let t=0,w=0;G.zones.forEach(z=>z.sections.forEach(sec=>{if(sec.category==='관광지')return;
sec.places.forEach(p=>{t++;if(/휴무|휴관|무휴/.test(p.feature))w++})}));
console.log(t?w+'/'+t+' 곳에 휴무 표기':'맛집·카페 데이터 없음');"
```

### R-D11. 디자인은 세 곳이 같이 움직인다 (삼각 sync)

- 디자인은 `design.md`(정본) · `index.html :root`(실행) · `CLAUDE.md § 5`(운영 요약) **세 곳에 흔적이 남는다.** 한 곳만 고치면 다음 세션이 stale 값을 읽는다.
- **v0.4 실측**: 토큰 값이 `CLAUDE.md § 5`와 `CONCEPT.md § 5` 두 곳에 적혀 있었다. 아직 안 어긋났을 뿐이었다 (도쿄가 이미 겪고 R12로 해결한 문제 — `learning.md § 9`).
- ✅ 순서: **`design.md` → `index.html :root` → `CLAUDE.md § 5` → `BUILD_VERSION`**
- ✅ 충돌 시 `design.md` 우선. `CONCEPT.md § 5`에는 **값을 쓰지 않는다** — "왜 그렇게 정했나"만.

### R-D6. 원정 전용 렌더 함수를 새로 만들지 않는다
- `EXCURSIONS[].sections`는 zone과 같은 스키마다. `buildZoneMap` · `buildCatSection` · `buildCard`를 재사용할 것.
- 별도 렌더러를 만들면 필터·지도·카드 스타일이 두 갈래로 갈라져 반드시 어긋난다 (도쿄판 `buildDineCard`가 그렇게 죽은 코드가 됐다 — 이식 시 제거).

### R-D7. 스크롤스파이는 세로 스크롤을 건드리지 않는다
- 칩이 sticky 내비 안에 있어서 `scrollIntoView`를 쓰면 페이지가 맨 위로 끌려 올라간다 (도쿄판 실제 버그). 가로 스크롤러 offset만 계산해서 이동시킬 것.

---

## 9. 변경 후 자가 점검 (매번)

```bash
# 1. JS 파싱 OK — <script> 블록이 3개다. 탐욕 정규식은 블록을 가로질러 헛실패하므로 비탐욕(*?) 필수
node -e "const h=require('fs').readFileSync('index.html','utf8'); const ms=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)]; let ok=true; ms.forEach((m,i)=>{try{new Function(m[1]);}catch(e){ok=false;console.log('block#'+i+' ERR:',e.message);}}); console.log(ok?'OK ('+ms.length+' blocks)':'FAIL');"
```

```bash
# 2. R-D1 — 사이드카 데이터 파일이 생기지 않았는지
ls *.json 2>/dev/null && echo "!! R-D1 위반 의심" || echo "OK — 사이드카 없음"
```

```bash
# 3. R-D2 — 평문 비번이 주석에 새지 않았는지
grep -nE "sha256\('|비번\s*[:=]\s*['\"]" index.html || echo "OK — 평문 비번 없음"
```

```bash
# 4. R-D4 — category 문자열이 CAT 키와 일치하는지
#    ⚠ GUIDE_DATA 는 JSON 형태("category":"관광지"), EXCURSIONS 는 JS 리터럴(category: '관광지').
#       두 형태를 모두 잡아야 원정 섹션이 집계에서 누락되지 않는다.
node -e "const h=require('fs').readFileSync('index.html','utf8'); const cats=[...h.matchAll(/[\"']?category[\"']?\s*:\s*[\"']([^\"']+)[\"']/g)].map(m=>m[1]); const ok=new Set(['관광지','맛집','카페']); const bad=[...new Set(cats)].filter(c=>!ok.has(c)); console.log(bad.length?'!! 잘못된 category: '+bad.join(', '):'OK ('+cats.length+' sections)');"
```

```bash
# 5. 이전 매거진 잔재 (도쿄·우에노·디즈니 등)
#    의도된 언급은 제외한다:
#      BUILD_VERSION(이식 출처) · R-D2 룰 주석 · "왜 도쿄처럼 못 하는지" 주석(OSRM/도쿄식 loop)
#      이식 출처 주석(도쿄 고유·도쿄 메인) · **독자에게 유용한 비교**(도쿄보다 / 도쿄(왼쪽))
#    ⚠ 마지막 항목이 핵심이다 — "에스컬레이터는 오사카가 오른쪽, 도쿄는 왼쪽" 같은 문구는
#      잔재가 아니라 정보다. 잔재는 "지우는 걸 잊은 것", 비교는 "일부러 쓴 것".
grep -niE "tokyo|도쿄|우에노|디즈니|마이하마|신주쿠|나리타" index.html \
  | grep -vE "BUILD_VERSION|R-D2|OSRM|도쿄식|도쿄 고유|도쿄 메인|도쿄보다|도쿄\(" || echo "OK — 잔재 없음"
```

```bash
# 6. 문서 고아 검출 — 모든 .md 가 DOC-MAP 에 등록됐고 양방향 링크가 있는지 (R-D11 계열)
for f in *.md; do
  reg=$(grep -c "]($f)" DOC-MAP.md); [ "$f" = "DOC-MAP.md" ] && reg=1
  inb=$(grep -l "]($f)" *.md 2>/dev/null | grep -vx "$f" | wc -l | tr -d ' ')
  out=$(grep -oE '\]\([A-Za-z_.-]+\.md\)' "$f" | sort -u | wc -l | tr -d ' ')
  s="OK "; [ "$reg" -eq 0 ] && s="!!미등록 "; [ "$inb" -eq 0 ] && s="$s!!인바운드0 "; [ "$out" -eq 0 ] && s="$s!!막다른길 "
  echo "$s$f (등록:$reg 인:$inb 아웃:$out)"
done
```

---

## 10. 수동 스모크 테스트 (큰 변경 후)

| # | 시나리오 | 예상 |
|---|---|---|
| 1 | 비번 입력 → 열기 | 게이트 사라지고 본문. 새로고침해도 다시 안 물음 |
| 2 | 틀린 비번 5회 | 5분 잠금 메시지 |
| 3 | 구역 칩 탭 | 해당 구역으로 부드럽게 스크롤 |
| 4 | 스크롤로 구역 이동 | 칩 하이라이트가 따라옴. **페이지가 위로 튀지 않음** (R-D7) |
| 5 | 분류 필터 `맛집` | 구역은 맛집만, 원정 섹션은 장소만 걸러지고 가는 법·할 일은 그대로 |
| 6 | 필터 조합으로 결과 0 | "조건에 맞는 장소가 없어요" 표시 |
| 7 | 지도 핀 탭 | 팝업 + 하단 이름 칩 하이라이트 연동 |
| 7-a | 구역 지도 동선 | 번호 순서대로 점선 연결. 범례에 "직선이라 실제 길은 아니에요" 문구 |
| 7-b | 원정 지도 (`EXCURSIONS` 비어 있음) | 원정 섹션 0개. `EXCURSIONS`에 객체를 push 하면 즉시 되살아남 |
| 7-d | 각 DAY 상단 시간표 | `이 날의 흐름` 블록. 옵션 구역(베이)엔 **없어야** 정상 (`schedule` 미정의) |
| 7-c | 오사카성 구역 (1곳) | 동선 없음 + `setView` (골목 한 칸까지 안 튐, R-D9) |
| 8 | 이름 칩 탭 | 해당 핀으로 지도 이동 + 강조 |
| 9 | 장소 카드 탭 | 구글맵 새 탭. **엉뚱한 장소 아님** (R-D3) |
| 10 | 원정 길찾기 버튼 | 구글맵 길찾기. 숙소 미정이면 오사카역 출발 |
| 11 | 모바일 375×812 | 가로 스크롤 없음. 지도·카드 안 깨짐 |
| 12 | 기내모드 | 지도 타일만 안 뜨고 나머지 전부 동작 |

---

## 11. 로컬 프리뷰

`.claude/launch.json`의 `osaka-guide` (포트 **8767** — 도쿄 8766과 분리). 또는:

```bash
npx --yes serve -l 8767 .
```

`index.html`을 그냥 더블클릭해도 열리지만, `file://`에서는 localStorage 동작이 브라우저마다 다르므로 **비번 게이트 검증은 서버로** 할 것.

---

## 12. 절대 하면 안 되는 것

- CSP 메타 완화
- 사용자 데이터 `innerHTML` 주입 (정적 SVG 상수 외)
- 사이드카 데이터 파일 생성 (R-D1)
- 평문 비번 박제 (R-D2)
- 검증 안 한 좌표·추측 `place_id` 커밋 (R-D3)
- `--frame` / `--page` / `--ink` 축 변경 (매거진 시리즈 공통)
- `design.md` / `:root` / 본 § 5 중 **한 곳만** 갱신 (R-D11)
- 네 번째 카테고리 신설 — 테마 축을 먼저 검토할 것 (§ 3.2 · `learning.md § 11`)
- `git push --force` / `git reset --hard` (사용자 명시 요청 없이)
- **도쿄·오키나와 폴더 write** (읽기는 허용 — § 0)

---

## 13. 미해결 — 다음 작업

| Phase | 내용 | 상태 / 블로커 |
|---|---|---|
| 2 | 좌표 land-check (24곳) | ✅ **완료** (v0.2). Nominatim/OSM 대조 → 4곳 정정 |
| 2 | 구역 반경 점검 | ✅ **완료** (v0.2). 오사카성·베이 9km → 2개로 분리 (R-D8) |
| 2 | `zones[].access` | ✅ **역 기준으로 작성** (숙소 비의존). 숙소 확정 시 도보 시간 추가 가능 |
| 2 | **맛집·카페 데이터** — 현재 **0곳** | ⚠ **최대 공백.** 리서치 필요 |
| 2 | `base_hotel` — 현재 `null` | **숙소 확정 대기** (엔진은 `null`을 우아하게 처리 중) |
| **2** | **`theme` 축 구현** — `서브컬쳐` / `역사·문화` | 🆕 동행 요청 (2026-08-09). § 3.2 스키마 + [`design.md § 1.5`](design.md) 토큰 + 내비 칩 |
| **2** | **서브컬쳐 장소 리서치** — 덴덴타운·게임센터·e스포츠·PC방 | 🆕 **0곳.** 좌표 land-check 필수 (R-D3) |
| **2** | **역사·문화 장소 리서치** — 오사카성 외 확충 | 🆕 오사카성 1곳만 있음. **서브컬쳐와 동등한 비중**으로 채울 것 |
| 3 | 원정 `routes`의 소요시간·요금 재확인 | 출발 전 1회 |
| 3 | USJ · 나라 · 고베 원정 추가 여부 | 사용자 결정 |
| 4 | `CONCEPT.md`의 여행 사실 채우기 | **날짜·숙소·인원 확정 대기** (동행 관심사는 일부 확정됨) |
| 5 | 전체 스모크 테스트 (§ 10) | Phase 2~4 완료 후 |

### 좌표 land-check 방법 (재현용)

Nominatim(OSM)으로 대조한다. 1req/s 정책을 지킬 것. `Δ < 0.3km`면 OK, 그 이상이면 OSM 쪽을 신뢰하고 정정.

```bash
node -e "
const q='Osaka Castle';
fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q),
 {headers:{'User-Agent':'osaka-guide-landcheck/0.1 (personal travel guide QA)'}})
 .then(r=>r.json()).then(j=>console.log(j[0]? j[0].lat+','+j[0].lon+'  '+j[0].display_name : '결과 없음'));"
```

영문명으로 안 잡히면 **일본어 정식명**으로 재조회한다 (`梅田スカイビル` · `天保山大観覧車` · `花見小路通` 등). 그런 장소는 `maps_url` 쿼리도 일본어로 두는 게 검색 성공률이 높다.

---

## 14. 참조

- **위(L0)** — 여행 사실·톤 [`CONCEPT.md`](CONCEPT.md) · 요구사항·범위 밖 [`PRD.md`](PRD.md)
- **옆(L1)** — **디자인 정본** [`design.md`](design.md) (본 § 5는 그 요약) · 계보 [`OSAKA_TRANSPLANT_GUIDE.md`](OSAKA_TRANSPLANT_GUIDE.md)
- **아래** — `index.html` · 회고 [`learning.md`](learning.md) (§ 8 R-D 룰이 생긴 서사)
- **인덱스** — **[`DOC-MAP.md`](DOC-MAP.md)** — 정본 규칙 · 영향 매트릭스 · 위험신호 진단표
- **사용자용** — [`README.md`](README.md)

⚠ 부모 워크스페이스 문서는 **읽기 전용**이고, 저널 계보 전제라 오사카에 안 맞는 항목이 있다 → [`DOC-MAP.md § 8`](DOC-MAP.md)
