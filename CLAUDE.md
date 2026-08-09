# Osaka Friend's Guide · CLAUDE Operations Guide

오사카 친구 가이드 · **동행 공유용** (읽기 전용 가이드) · **v0.1** (2026-08-09 — 도쿄 친구 가이드에서 이식).

> **이 문서는 "코드를 어떻게 운영하는가"의 정본**. 제품 요구사항은 [`PRD.md`](PRD.md), 여행 사실·톤은 [`CONCEPT.md`](CONCEPT.md), 이식 내역은 [`OSAKA_TRANSPLANT_GUIDE.md`](OSAKA_TRANSPLANT_GUIDE.md).

---

## 0. 권한 경계 (먼저 읽음)

- **WRITE**: 이 폴더 (`오사카 여행 매거진/*`)만
- **READ**: 이 폴더 내부
- **금지**: 부모 폴더 / 도쿄 폴더 / 오키나와 폴더 read·write 모두 차단
- 도쿄 매거진의 패턴이 필요해지면 **즉시 사용자에게 보고** (자동 read 금지). 이식 시점의 결정은 이미 `OSAKA_TRANSPLANT_GUIDE.md`에 박제돼 있으니 거기부터 볼 것.
- 도쿄판 R9와 같은 정신.

---

## 1. 이 앱이 무엇인가 (1분)

- **단일 HTML 파일** `index.html` 하나. 더블클릭하면 열림. 빌드 없음, 번들러 없음, npm 없음.
- **외부 의존성 2개뿐**: Leaflet (unpkg CDN) + 지도 타일 (CARTO). 나머지는 시스템 폰트.
- **저장소 없음.** localStorage는 비번 게이트 토큰 하나만 씀. 사용자 입력·기록 기능 **없음** — 읽기 전용 가이드다.
- **용도**: 동행에게 링크(또는 파일) 하나 던지면, 그 사람이 그날 있는 구역을 골라 관광지·맛집·카페를 탭 → 구글맵이 열림.

> ⚠ **도쿄 메인 매거진(`index.html` 20,901줄)과 다른 앱이다.** 이 앱은 그 매거진의 `guide/` 서브앱 계보다. 저널·사진·별점·매거진 발행 기능은 여기 없다. 그런 기능이 필요하다는 요청이 오면 "다른 앱"임을 먼저 말할 것.

---

## 2. 파일 구조

```
오사카 여행 매거진/
├── index.html                 본체 — 이거 하나가 앱 전부
├── CLAUDE.md                  ← 이 문서 (운영 정본)
├── PRD.md                     제품 요구사항 · 버전 히스토리
├── CONCEPT.md                 여행 사실 · 동행 · 톤
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
| `base_hotel` | object \| **null** | `{name, area, note}`. **숙소 미정이면 `null`** — 가짜 자리표시자 넣지 말 것. `null`이면 매스트헤드 호텔 칩이 생략되고 원정 길찾기 출발지가 `Osaka Station`으로 대체됨 (`excursionOrigin()`) |
| `zones[].id` | number | 화면에 `AREA 01` 형태로 표시. 앵커 id = `zone-{id}` |
| `zones[].access` | string | 숙소 기준 접근 시간. 숙소 확정 전에는 `TODO — 숙소 확정 후 입력` |
| `sections[].category` | string | **`관광지` / `맛집` / `카페` 셋 중 하나.** `CAT` 딕셔너리 키와 정확히 일치해야 색·아이콘·필터가 붙음 |

### 3.2 `place` — 장소 하나

```json
{ "name_ko":"", "name_en":"", "feature":"", "recommended":false, "essential":false,
  "lat":0, "lng":0, "maps_url":"" }
```

- `recommended` → ★ 추천 뱃지 + "추천만" 필터
- `essential` → 🇰🇷 한국인 필수 뱃지 + 전용 필터
- `lat`/`lng` — **생략 가능.** 없으면 지도 핀에서만 빠지고 카드·구글맵 링크는 정상 동작 (`zoneCenter`가 좌표 없는 항목을 건너뜀)
- `offzone: true` — 핀은 찍되 지도 초기 프레이밍(fitBounds)에서는 제외
- `maps_url` — `https://www.google.com/maps/search/?api=1&query={영문명 URL인코딩}`. `place_id`를 붙이면 더 정확하지만 **없어도 됨. 모르는 place_id를 지어내지 말 것** (§ 8 R-D3)

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
- 앵커 id = `ex-{id}`. 내비 칩 라벨 = `chip` (없으면 `title`).
- `routes[].name`에 `택시`/`didi`/`차로`가 들어가면 길찾기 링크가 `driving` 모드로 나감. 그 외는 `transit`.

---

## 4. 장소 추가·수정 절차

1. `index.html`에서 `GUIDE_DATA` (또는 `EXCURSIONS[].sections`) 안 해당 `places` 배열을 찾는다
2. **한 줄 = 한 장소** 포맷을 지킨다 (diff 가독성 · 도쿄판에서 계승)
3. `maps_url`은 영문명을 URL 인코딩해서 만든다
4. 좌표는 § 8 R-D3의 land-check를 거친다
5. `BUILD_VERSION` 갱신
6. § 9 자가 점검 실행

---

## 5. 디자인 토큰

`index.html` `:root`가 정본. 도쿄 가이드에서 계승하되 **포인트 색 1개만** 바꿨다.

| 축 | 토큰 | 값 | 비고 |
|---|---|---|---|
| frame | `--frame` / `--indigo` | `#1a1b4b` | 매거진 시리즈 공통 축 — **바꾸지 말 것** |
| page | `--page` / `--page-tint` / `--page-warm` | `#f5f3ee` 계열 | 공통 |
| ink | `--ink` / `--ink-soft` / `--ink-faint` | `#2a2d3a` 계열 | 공통 |
| **point** | **`--osaka-red`** | **`#D8452E`** | 도쿄 `--tokyo-red: #d94848`(로즈레드) → 오사카는 버밀리언. **매거진 간 식별 축** |
| gold | `--gold` 계열 | `#d4af37` | ★ 추천 뱃지 전용 |
| essential | `--essential` | `#C0455E` | 🇰🇷 한국인 필수 뱃지 전용 |
| 카테고리 | `--cat-sight` / `--cat-meal` / `--cat-cafe` | 3색 | `CAT` 딕셔너리와 쌍 |
| 구역 액센트 | `ZONE_ACCENTS` (JS) | 6색 | 구역+원정 합계가 6을 넘으면 색이 순환·중복됨 → 색 추가 필요 |

- 새 매거진(Vol IV)으로 갈 때 **포인트 색만 바꾸는 게 규칙**. frame/page/ink를 건드리면 시리즈 일관성이 깨진다.
- `--gold` / `--essential`은 각각의 뱃지 전용. 일반 강조에 쓰지 말 것 (도쿄 R13과 같은 정신).

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
- `buildCatSection(s)` — **구역·원정 공용** 카테고리 섹션. 필터가 `.catsec` 단위로 돌아가므로 구조를 바꾸면 필터가 깨진다
- `buildCard(p, cat)` — 장소 카드
- `renderZones()` / `renderExcursions()` / `buildExcursion(ex)`
- `blockH(en, ko)` — 원정 안 소제목

**지도**
- `zoneCenter(zone)` — 좌표 평균 (offzone·좌표없음 제외)
- `buildZoneMap(zone, accent)` — 지도 컨테이너 + 범례 + 구글맵 버튼. **`zone.id`를 쓰지 않으므로 원정 객체도 그대로 넣을 수 있다**
- `initLeafletMap(entry)` — Leaflet 인스턴스. 핀↔이름칩 하이라이트 연동
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
#    BUILD_VERSION(이식 출처 표기)과 R-D2 룰 주석은 의도된 것이므로 제외한다.
grep -niE "tokyo|도쿄|우에노|디즈니|마이하마" index.html | grep -vE "BUILD_VERSION|R-D2" || echo "OK — 잔재 없음"
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
- `git push --force` / `git reset --hard` (사용자 명시 요청 없이)
- 도쿄·오키나와 폴더 자동 read·write (§ 0)

---

## 13. 미해결 — 다음 작업

| Phase | 내용 | 블로커 |
|---|---|---|
| 2 | **좌표 land-check** — 현재 24곳 좌표는 전부 미검증 시드 | 없음. 바로 가능 |
| 2 | **맛집·카페 데이터** — 현재 0곳. 구역별로 채워야 함 | 없음 (리서치 필요) |
| 2 | `zones[].access` — 전부 `TODO` | **숙소 확정** |
| 2 | `base_hotel` — 현재 `null` | **숙소 확정** |
| 3 | 원정 `routes`의 소요시간·요금 재확인 | 없음. 출발 전 1회 |
| 3 | USJ · 나라 · 고베 원정 추가 여부 | 사용자 결정 |
| 4 | `CONCEPT.md`의 여행 사실 채우기 | **날짜·동행 확정** |
| 5 | 전체 스모크 테스트 (§ 10) | Phase 2~4 완료 후 |
